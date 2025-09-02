import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { 
  startSimulation, 
  handleAsk, 
  endSession, 
  getPerformanceMetricsBySession,
  getPerformanceMetricsByUser 
} from '../simulationService.js';
import Case from '../../models/CaseModel.js';
import Session from '../../models/SessionModel.js';
import PerformanceMetrics from '../../models/PerformanceMetricsModel.js';
import { getPatientResponseStream, getEvaluation } from '../aiService.js';
import CaseService from '../caseService.js';

// Mock dependencies
jest.mock('../../models/CaseModel.js');
jest.mock('../../models/SessionModel.js');
jest.mock('../../models/PerformanceMetricsModel.js');
jest.mock('../aiService.js');
jest.mock('../caseService.js');

describe('simulationService', () => {
  const mockCaseId = 'TEST-001';
  const mockSessionId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  const mockCaseData = {
    _id: new mongoose.Types.ObjectId(),
    case_metadata: {
      case_id: mockCaseId,
      title: 'Test Case',
      specialty: 'Cardiology'
    },
    patient_persona: {
      name: 'John Doe',
      speaks_for: 'Self'
    },
    initial_prompt: 'Hello doctor, I have chest pain.',
    toObject: jest.fn().mockReturnThis()
  };

  const mockSession = {
    _id: new mongoose.Types.ObjectId(),
    case_ref: mockCaseData,
    original_case_id: mockCaseId,
    history: [],
    sessionEnded: false,
    evaluation: null,
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock mongoose session
    const mockDbSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };
    mongoose.startSession = jest.fn().mockResolvedValue(mockDbSession);
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startSimulation', () => {
    it('should start a new simulation successfully', async () => {
      Case.findOne.mockResolvedValue(mockCaseData);
      
      const mockNewSession = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };
      Session.mockImplementation(() => mockNewSession);

      const result = await startSimulation(mockCaseId);

      expect(Case.findOne).toHaveBeenCalledWith({ 'case_metadata.case_id': mockCaseId });
      expect(Session).toHaveBeenCalledWith({
        case_ref: mockCaseData._id,
        original_case_id: mockCaseData.case_metadata.case_id,
        history: [{ 
          role: 'Patient', 
          content: mockCaseData.initial_prompt, 
          timestamp: expect.any(Date) 
        }]
      });
      expect(mockNewSession.save).toHaveBeenCalled();
      expect(result).toEqual({
        sessionId: mockNewSession._id.toString(),
        initialPrompt: mockCaseData.initial_prompt,
        patientName: 'John Doe',
        speaks_for: 'Self'
      });
    });

    it('should handle case not found', async () => {
      Case.findOne.mockResolvedValue(null);

      await expect(startSimulation('NONEXISTENT-001')).rejects.toEqual({
        status: 404,
        message: 'Case not found'
      });
    });

    it('should handle missing initial prompt', async () => {
      const caseWithoutPrompt = { ...mockCaseData };
      delete caseWithoutPrompt.initial_prompt;
      
      Case.findOne.mockResolvedValue(caseWithoutPrompt);
      
      const mockNewSession = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };
      Session.mockImplementation(() => mockNewSession);

      const result = await startSimulation(mockCaseId);

      expect(Session).toHaveBeenCalledWith({
        case_ref: caseWithoutPrompt._id,
        original_case_id: caseWithoutPrompt.case_metadata.case_id,
        history: []
      });
    });

    it('should handle missing patient persona', async () => {
      const caseWithoutPersona = { ...mockCaseData };
      delete caseWithoutPersona.patient_persona;
      
      Case.findOne.mockResolvedValue(caseWithoutPersona);
      
      const mockNewSession = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };
      Session.mockImplementation(() => mockNewSession);

      const result = await startSimulation(mockCaseId);

      expect(result.patientName).toBe('Virtual Patient');
      expect(result.speaks_for).toBeUndefined();
    });

    it('should handle database save errors', async () => {
      Case.findOne.mockResolvedValue(mockCaseData);
      
      const mockNewSession = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      };
      Session.mockImplementation(() => mockNewSession);

      await expect(startSimulation(mockCaseId)).rejects.toThrow('Database save failed');
    });
  });

  describe('handleAsk', () => {
    const mockQuestion = 'What are your symptoms?';
    const mockResponse = {
      write: jest.fn(),
      end: jest.fn()
    };

    beforeEach(() => {
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockSession,
          history: []
        })
      });
      
      getPatientResponseStream.mockResolvedValue({
        sessionShouldBeMarkedEnded: false
      });
      
      CaseService.shouldEndSession = jest.fn().mockReturnValue(false);
    });

    it('should handle question successfully', async () => {
      const sessionWithHistory = {
        ...mockSession,
        history: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sessionWithHistory)
      });

      await handleAsk(mockSessionId, mockQuestion, mockResponse);

      expect(Session.findById).toHaveBeenCalledWith(mockSessionId);
      expect(sessionWithHistory.history).toContainEqual({
        role: 'Clinician',
        content: mockQuestion,
        timestamp: expect.any(Date)
      });
      expect(getPatientResponseStream).toHaveBeenCalledWith(
        mockCaseData,
        sessionWithHistory.history,
        mockQuestion,
        mockSessionId,
        mockResponse,
        false
      );
      expect(sessionWithHistory.save).toHaveBeenCalled();
    });

    it('should handle session not found', async () => {
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(handleAsk(mockSessionId, mockQuestion, mockResponse))
        .rejects.toEqual({
          status: 404,
          message: 'Session not found'
        });
    });

    it('should handle ended session', async () => {
      const endedSession = {
        ...mockSession,
        sessionEnded: true
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(endedSession)
      });

      await expect(handleAsk(mockSessionId, mockQuestion, mockResponse))
        .rejects.toEqual({
          status: 403,
          message: 'Simulation has ended.'
        });
    });

    it('should handle missing case data', async () => {
      const sessionWithoutCase = {
        ...mockSession,
        case_ref: null
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sessionWithoutCase)
      });

      await expect(handleAsk(mockSessionId, mockQuestion, mockResponse))
        .rejects.toEqual({
          status: 500,
          message: 'Internal server error: Case data missing.'
        });
    });

    it('should end session when diagnosis trigger detected', async () => {
      CaseService.shouldEndSession = jest.fn().mockReturnValue(true);
      getPatientResponseStream.mockResolvedValue({
        sessionShouldBeMarkedEnded: true
      });

      const sessionWithHistory = {
        ...mockSession,
        history: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(sessionWithHistory)
      });

      await handleAsk(mockSessionId, 'I think this is a heart attack', mockResponse);

      expect(CaseService.shouldEndSession).toHaveBeenCalledWith('I think this is a heart attack');
      expect(getPatientResponseStream).toHaveBeenCalledWith(
        mockCaseData,
        sessionWithHistory.history,
        'I think this is a heart attack',
        mockSessionId,
        mockResponse,
        true
      );
      expect(sessionWithHistory.sessionEnded).toBe(true);
    });
  });

  describe('endSession', () => {
    const mockUser = {
      id: mockUserId,
      _id: mockUserId
    };

    const mockEvaluationResult = {
      evaluationText: 'Good performance overall',
      extractedMetrics: {
        clinical_reasoning: 85,
        communication: 90,
        evaluation_summary: 'Strong clinical skills demonstrated'
      }
    };

    beforeEach(() => {
      const mockDbSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      mongoose.startSession.mockResolvedValue(mockDbSession);
      
      getEvaluation.mockResolvedValue(mockEvaluationResult);
      
      const mockPerformanceRecord = {
        _id: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true)
      };
      PerformanceMetrics.mockImplementation(() => mockPerformanceRecord);
    });

    it('should end session successfully with new evaluation', async () => {
      const sessionToEnd = {
        ...mockSession,
        sessionEnded: false,
        evaluation: null,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(sessionToEnd)
        })
      });

      // Mock dynamic import
      const mockUpdateProgress = jest.fn().mockResolvedValue(true);
      jest.doMock('../clinicianProgressService.js', () => ({
        updateProgressAfterCase: mockUpdateProgress
      }), { virtual: true });

      const result = await endSession(mockSessionId, mockUser);

      expect(getEvaluation).toHaveBeenCalledWith(mockCaseData, sessionToEnd.history);
      expect(PerformanceMetrics).toHaveBeenCalledWith({
        session_ref: sessionToEnd._id,
        case_ref: sessionToEnd.case_ref._id,
        user_ref: mockUserId,
        metrics: mockEvaluationResult.extractedMetrics,
        evaluation_summary: mockEvaluationResult.extractedMetrics.evaluation_summary,
        raw_evaluation_text: mockEvaluationResult.evaluationText
      });
      expect(sessionToEnd.evaluation).toBe(mockEvaluationResult.evaluationText);
      expect(sessionToEnd.sessionEnded).toBe(true);
      expect(result).toEqual({
        sessionEnded: true,
        evaluation: mockEvaluationResult.evaluationText,
        history: sessionToEnd.history
      });
    });

    it('should return existing evaluation if session already ended', async () => {
      const endedSession = {
        ...mockSession,
        sessionEnded: true,
        evaluation: 'Previous evaluation'
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(endedSession)
        })
      });

      const result = await endSession(mockSessionId, mockUser);

      expect(getEvaluation).not.toHaveBeenCalled();
      expect(result).toEqual({
        sessionEnded: true,
        evaluation: 'Previous evaluation',
        history: endedSession.history
      });
    });

    it('should handle invalid session ID', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await expect(endSession('invalid-id', mockUser))
        .rejects.toEqual({
          status: 400,
          message: 'Invalid session ID'
        });
    });

    it('should handle session not found', async () => {
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(null)
        })
      });

      await expect(endSession(mockSessionId, mockUser))
        .rejects.toEqual({
          status: 404,
          message: 'Session not found'
        });
    });

    it('should handle missing case data', async () => {
      const sessionWithoutCase = {
        ...mockSession,
        case_ref: null
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(sessionWithoutCase)
        })
      });

      await expect(endSession(mockSessionId, mockUser))
        .rejects.toEqual({
          status: 500,
          message: 'Case data missing'
        });
    });

    it('should handle transaction rollback on error', async () => {
      const mockDbSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      mongoose.startSession.mockResolvedValue(mockDbSession);

      const sessionToEnd = {
        ...mockSession,
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(sessionToEnd)
        })
      });

      await expect(endSession(mockSessionId, mockUser)).rejects.toThrow('Save failed');
      expect(mockDbSession.abortTransaction).toHaveBeenCalled();
      expect(mockDbSession.endSession).toHaveBeenCalled();
    });

    it('should handle progress update failure gracefully', async () => {
      const sessionToEnd = {
        ...mockSession,
        sessionEnded: false,
        evaluation: null,
        save: jest.fn().mockResolvedValue(true)
      };
      
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(sessionToEnd)
        })
      });

      // Mock dynamic import to throw error
      const mockUpdateProgress = jest.fn().mockRejectedValue(new Error('Progress update failed'));
      jest.doMock('../clinicianProgressService.js', () => ({
        updateProgressAfterCase: mockUpdateProgress
      }), { virtual: true });

      // Should not throw error even if progress update fails
      const result = await endSession(mockSessionId, mockUser);
      
      expect(result.sessionEnded).toBe(true);
    });
  });

  describe('getPerformanceMetricsBySession', () => {
    it('should get performance metrics by session ID', async () => {
      const mockMetrics = {
        _id: new mongoose.Types.ObjectId(),
        session_ref: mockSessionId,
        metrics: { clinical_reasoning: 85 }
      };
      
      PerformanceMetrics.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMetrics)
      });

      const result = await getPerformanceMetricsBySession(mockSessionId);

      expect(PerformanceMetrics.findOne).toHaveBeenCalledWith({ session_ref: mockSessionId });
      expect(result).toEqual(mockMetrics);
    });

    it('should handle metrics not found', async () => {
      PerformanceMetrics.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await expect(getPerformanceMetricsBySession(mockSessionId))
        .rejects.toEqual({
          status: 404,
          message: 'Performance metrics not found for this session.'
        });
    });
  });

  describe('getPerformanceMetricsByUser', () => {
    it('should get performance metrics by user ID', async () => {
      const mockMetrics = [
        {
          _id: new mongoose.Types.ObjectId(),
          user_ref: mockUserId,
          metrics: { clinical_reasoning: 85 }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          user_ref: mockUserId,
          metrics: { clinical_reasoning: 90 }
        }
      ];
      
      PerformanceMetrics.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockMetrics)
      });

      const result = await getPerformanceMetricsByUser(mockUserId);

      expect(PerformanceMetrics.find).toHaveBeenCalledWith({ user_ref: mockUserId });
      expect(result).toEqual(mockMetrics);
    });

    it('should handle no metrics found for user', async () => {
      PerformanceMetrics.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await expect(getPerformanceMetricsByUser(mockUserId))
        .rejects.toEqual({
          status: 404,
          message: 'No performance metrics found for this user.'
        });
    });

    it('should handle null metrics result', async () => {
      PerformanceMetrics.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(null)
      });

      await expect(getPerformanceMetricsByUser(mockUserId))
        .rejects.toEqual({
          status: 404,
          message: 'No performance metrics found for this user.'
        });
    });
  });
});