const Case = require('../models/Case');
const Session = require('../models/Session');
const OpenAI = require('openai');

// Constants — configurable via environment variables
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '200', 10);
const MAX_QUESTION_LENGTH = 2000;

// Reuse OpenAI client instance across requests
let _openai = null;
function getOpenAI() {
  if (_openai) return _openai;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === '') {
    return null;
  }
  _openai = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Simuatech',
    },
  });
  return _openai;
}

// Simple input validation helper
function validateString(val, maxLen = MAX_QUESTION_LENGTH) {
  if (typeof val !== 'string' || val.trim().length === 0) return null;
  return val.trim().slice(0, maxLen);
}

exports.startSession = async (req, res) => {
    try {
      const caseId = validateString(req.body.caseId);
      if (!caseId) return res.status(400).json({ error: 'caseId is required' });

      const userId = validateString(req.body.userId) || 'anonymous';
      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

      const session = new Session({ userId, caseId, conversation: [] });
      await session.save();

      let greeting = '';
      try {
        greeting = await getPatientResponse(caseDoc, [], "The doctor enters the room. As the patient, introduce yourself and describe your main problem to the doctor.");
      } catch (err) {
        console.warn('Failed to generate AI greeting:', err.message);
        greeting = `Hello Doctor, my name is ${caseDoc.patientName}. I'm ${caseDoc.patientProfile.age || '...'} years old. ${caseDoc.patientProfile.chiefComplaint ? `My main problem is ${caseDoc.patientProfile.chiefComplaint}.` : 'I need your help.'}`;
      }
      session.conversation.push({ role: 'patient', content: greeting });
      await session.save();

      res.json({ sessionId: session._id, greeting });
    } catch (err) {
      console.error('❌ startSession error:', err.message);
      res.status(500).json({ error: 'Failed to start simulation' });
    }
};

exports.chat = async (req, res) => {
    try {
      const sessionId = validateString(req.body.sessionId);
      const question = validateString(req.body.question);
      if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
      if (!question) return res.status(400).json({ error: 'Question cannot be empty' });

      const session = await Session.findById(sessionId).populate('caseId');
      if (!session) return res.status(404).json({ error: 'Session not found' });

      let reply = '';
      try {
        const last10 = session.conversation.slice(-10);
        reply = await getPatientResponse(session.caseId, last10, question);
      } catch (err) {
        console.warn('Failed to generate AI reply:', err.message);
        reply = `I'm sorry Doctor, I don't quite understand. Could you please rephrase that? My name is ${session.caseId.patientName} and I came because ${session.caseId.patientProfile.chiefComplaint || "I'm not feeling well"}.`;
      }

      // Single DB save — push both messages, then save once
      session.conversation.push(
        { role: 'user', content: question },
        { role: 'patient', content: reply }
      );
      await session.save();

      res.json({ reply });
    } catch (err) {
      console.error('❌ chat error:', err.message);
      res.status(500).json({ error: 'Failed to process message' });
    }
};

exports.endSimulation = async (req, res) => {
    try {
      const sessionId = validateString(req.body.sessionId);
      if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

      const session = await Session.findById(sessionId).populate('caseId');
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const diagnosis = validateString(req.body.diagnosis) || '';
      const endedManually = req.body.endedManually === true;

      session.userDiagnosis = diagnosis;
      session.endedManually = endedManually;

      try {
        session.assessment = await generateAssessment(session, session.caseId);
      } catch (err) {
        console.warn('Failed to generate AI assessment:', err.message);
        session.assessment = {
          grade: 'Pass',
          score: 70,
          feedback: `The doctor interviewed the patient. The correct diagnosis was: ${session.caseId.patientProfile.correctDiagnosis}. The doctor's diagnosis was: ${diagnosis || 'not submitted'}.`,
          strengths: ['Initiated the consultation', 'Gathered patient history'],
          weaknesses: ['Unable to provide AI-powered assessment - API key missing or invalid']
        };
      }
      await session.save();

      res.json({ assessment: session.assessment });
    } catch (err) {
      console.error('❌ endSimulation error:', err.message);
      res.status(500).json({ error: 'Failed to end simulation' });
    }
};

async function getPatientResponse(caseDoc, history, userQuestion) {
    const openai = getOpenAI();
    if (!openai) {
      throw new Error('OpenRouter API key not configured');
    }

        // Map conversation history to OpenAI roles.
    // The AI is always the patient (assistant), the user is the doctor (user).
    // We avoid prefixing messages with role labels that could leak into output.
    const historyMessages = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
    }));

    // Keep a strong system reminder to prevent the AI from role-switching.
    const personalityNote = caseDoc.patientProfile.patientPersonality
        ? ` Your demeanor: ${caseDoc.patientProfile.patientPersonality}.`
        : '';
    const patientReminder = {
        role: 'system',
        content: `CRITICAL: You are the PATIENT. Never act as the doctor, never diagnose yourself, never give medical advice. You are ${caseDoc.patientProfile.age || 'a certain age'} years old, ${caseDoc.patientProfile.gender || 'unspecified gender'}. Your chief complaint is: "${caseDoc.patientProfile.chiefComplaint || 'N/A'}".${personalityNote} Describe only your symptoms and history. Answer conversationally as a real patient.`
    };

    const messages = [
        { role: 'system', content: caseDoc.patientSystemPrompt },
        ...historyMessages,
        patientReminder,
        { role: 'user', content: userQuestion }
    ];

                        const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: MAX_TOKENS
    });
    let reply = completion.choices[0].message.content;

    // Strip any accidental role-prefix the model might still produce
    reply = reply.replace(/^\[?(I, the PATIENT, reply:|The PATIENT:|As the patient,?|Patient:)\]\s*/i, '').trim();

    return reply;
}

async function generateAssessment(session, caseDoc) {
    const openai = getOpenAI();
    if (!openai) {
      throw new Error('OpenRouter API key not configured');
    }

    const conversationText = session.conversation.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `
You are a clinical educator. Evaluate the doctor's performance.

Case: ${caseDoc.title}
Correct diagnosis: ${caseDoc.patientProfile.correctDiagnosis}
User's diagnosis: ${session.userDiagnosis || "(none submitted)"}
Conversation:
${conversationText}

Return a JSON object with exactly these fields:
{
  "grade": "Honors|High Pass|Pass|Fail",
  "score": 0-100,
  "feedback": "Short paragraph",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}

Return ONLY valid JSON, no markdown formatting, no code fences.`;
                        const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });

    const text = completion.choices[0].message.content.trim();
    const jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    try {
      return JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('❌ Failed to parse assessment JSON:', parseErr.message, 'Raw:', jsonStr);
      return {
        grade: 'Pass',
        score: 70,
        feedback: 'Assessment generation encountered an error. Please review manually.',
        strengths: ['Attempted the simulation'],
        weaknesses: ['AI assessment parsing failed']
      };
    }
}

