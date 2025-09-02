import mongoose from 'mongoose';
import { getPatientResponseStream, getEvaluation } from './aiService.js';
import Case from '../models/CaseModel.js';
import Session from '../models/SessionModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import CaseService from './caseService.js';

export const getCases = CaseService.getCases.bind(CaseService);

export async function startSimulation(caseId) {
    let caseDataFromDB = await Case.findOne({ 'case_metadata.case_id': caseId });

    if (!caseDataFromDB) {
        throw { status: 404, message: 'Case not found' };
    }

    const history = [];
    if (caseDataFromDB.initial_prompt) {
        history.push({ role: 'Patient', content: caseDataFromDB.initial_prompt, timestamp: new Date() });
    }

    const newSession = new Session({
        case_ref: caseDataFromDB._id,
        original_case_id: caseDataFromDB.case_metadata.case_id,
        history: history,
    });

    await newSession.save();
    
    // Extract patient information for the frontend
    const patientPersona = caseDataFromDB.patient_persona;
    const patientName = patientPersona?.name || 'Virtual Patient';
    const speaksFor = patientPersona?.speaks_for;
    
    return {
        sessionId: newSession._id.toString(),
        initialPrompt: caseDataFromDB.initial_prompt,
        patientName: patientName,
        speaks_for: speaksFor
    };
}

export async function handleAsk(sessionId, question, res) {
    const session = await Session.findById(sessionId).populate('case_ref');
    if (!session) {
        throw { status: 404, message: 'Session not found' };
    }
    if (session.sessionEnded) {
        throw { status: 403, message: 'Simulation has ended.' };
    }
    if (!session.case_ref) {
        throw { status: 500, message: 'Internal server error: Case data missing.' };
    }

    const caseData = session.case_ref.toObject();
    session.history.push({ 
        role: 'Clinician', 
        content: question, 
        timestamp: new Date() 
    });

    const willEndAfterResponse = CaseService.shouldEndSession(question);

    const { sessionShouldBeMarkedEnded } = await getPatientResponseStream(
        caseData,
        session.history,
        question,
        sessionId,
        res,
        willEndAfterResponse
    );

    if (sessionShouldBeMarkedEnded) {
        session.sessionEnded = true;
    }

    await session.save();
}

export async function endSession(sessionId, user) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw { status: 400, message: 'Invalid session ID' };
    }

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();
    
    try {
        const session = await Session.findById(sessionId).populate('case_ref').session(dbSession);
        if (!session) throw { status: 404, message: 'Session not found' };
        if (!session.case_ref) throw { status: 500, message: 'Case data missing' };
        
        if (session.sessionEnded && session.evaluation) {
            await dbSession.commitTransaction();
            return { sessionEnded: true, evaluation: session.evaluation, history: session.history };
        }

        const caseData = session.case_ref.toObject();
        const { evaluationText, extractedMetrics } = await getEvaluation(caseData, session.history);

        const performanceRecord = new PerformanceMetrics({
            session_ref: session._id,
            case_ref: session.case_ref._id,
            user_ref: user?.id || user?._id,
            metrics: extractedMetrics,
            evaluation_summary: extractedMetrics.evaluation_summary,
            raw_evaluation_text: evaluationText,
        });

        session.evaluation = evaluationText;
        session.sessionEnded = true;

        await Promise.all([
            session.save({ session: dbSession }),
            performanceRecord.save({ session: dbSession })
        ]);

        await dbSession.commitTransaction();

        // Update progress after transaction commits
        const userId = user?.id || user?._id;
        if (userId) {
            try {
                const { updateProgressAfterCase } = await import('./clinicianProgressService.js');
                await updateProgressAfterCase(userId, session.case_ref._id, performanceRecord._id);
            } catch (progressError) {
                console.error('Progress update failed:', progressError);
                // Don't fail the session end if progress update fails
            }
        }

        return {
            sessionEnded: true,
            evaluation: evaluationText,
            history: session.history
        };
    } catch (error) {
        await dbSession.abortTransaction();
        throw error;
    } finally {
        dbSession.endSession();
    }
}

export const getCaseCategories = CaseService.getCaseCategories.bind(CaseService);

export async function getPerformanceMetricsBySession(sessionId) {
    const metrics = await PerformanceMetrics.findOne({ session_ref: sessionId })
        .populate('case_ref', 'case_metadata.case_id case_metadata.title');
    if (!metrics) {
        throw { status: 404, message: 'Performance metrics not found for this session.' };
    }
    return metrics;
}

export async function getPerformanceMetricsByUser(userId) {
    const metrics = await PerformanceMetrics.find({ user_ref: userId })
        .populate('case_ref', 'case_metadata.case_id case_metadata.title')
        .populate('session_ref', 'original_case_id createdAt')
        .sort({ evaluated_at: -1 });

    if (!metrics || metrics.length === 0) {
        throw { status: 404, message: 'No performance metrics found for this user.' };
    }
    return metrics;
}
