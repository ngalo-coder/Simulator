const Case = require('../models/Case');
const Session = require('../models/Session');
const OpenAI = require('openai');

function getOpenAI() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === '') {
    return null;
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'Simuatech',
    },
  });
}

exports.startSession = async (req, res) => {
    const { caseId, userId = 'anonymous' } = req.body;
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ error: 'Case not found' });

    const session = new Session({ userId, caseId, conversation: [] });
    await session.save();

    // Generate initial greeting from AI patient
    let greeting = '';
    try {
      greeting = await getPatientResponse(caseDoc, [], "The doctor enters the room. As the patient, introduce yourself and describe your main problem to the doctor.");
    } catch (err) {
      console.warn('⚠️ Failed to generate AI greeting:', err.message);
      // Fallback greeting when AI is unavailable
      greeting = `Hello Doctor, my name is ${caseDoc.patientName}. I'm ${caseDoc.patientProfile.age || '...'} years old. ${caseDoc.patientProfile.chiefComplaint ? `My main problem is ${caseDoc.patientProfile.chiefComplaint}.` : 'I need your help.'}`;
    }
    session.conversation.push({ role: 'patient', content: greeting });
    await session.save();

    res.json({ sessionId: session._id, greeting });
};

exports.chat = async (req, res) => {
    const { sessionId, question } = req.body;
    const session = await Session.findById(sessionId).populate('caseId');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.conversation.push({ role: 'user', content: question });
    await session.save();

    let reply = '';
    try {
      const last10 = session.conversation.slice(-10);
      reply = await getPatientResponse(session.caseId, last10, question);
    } catch (err) {
      console.warn('⚠️ Failed to generate AI reply:', err.message);
      reply = `I'm sorry Doctor, I don't quite understand. Could you please rephrase that? My name is ${session.caseId.patientName} and I came because ${session.caseId.patientProfile.chiefComplaint || "I'm not feeling well"}.`;
    }
    session.conversation.push({ role: 'patient', content: reply });
    await session.save();

    res.json({ reply });
};

exports.endSimulation = async (req, res) => {
    const { sessionId, diagnosis, endedManually } = req.body;
    const session = await Session.findById(sessionId).populate('caseId');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.userDiagnosis = diagnosis;
    session.endedManually = endedManually;

    try {
      session.assessment = await generateAssessment(session, session.caseId);
    } catch (err) {
      console.warn('⚠️ Failed to generate AI assessment:', err.message);
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
};

async function getPatientResponse(caseDoc, history, userQuestion) {
    const openai = getOpenAI();
    if (!openai) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build conversation history.
    const historyMessages = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
    }));

    // Inject a reminder before the last user message so the AI stays in patient character.
    const patientReminder = {
        role: 'system',
        content: `Remember: You are the PATIENT, not the doctor. You are ${caseDoc.patientProfile.age || 'a certain age'} years old, ${caseDoc.patientProfile.gender || 'unspecified gender'}. Your chief complaint is: "${caseDoc.patientProfile.chiefComplaint || 'N/A'}". Answer the doctor's questions as the patient. Do NOT role-play as the doctor, do NOT evaluate the doctor's questions, do NOT provide a diagnosis. You are the patient seeking medical help.`
    };

    const messages = [
        { role: 'system', content: caseDoc.patientSystemPrompt },
        ...historyMessages,
        patientReminder,
        { role: 'user', content: userQuestion }
    ];

    const completion = await openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 150
    });
    return completion.choices[0].message.content;
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
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
    });
    const text = completion.choices[0].message.content.trim();
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(jsonStr);
}

