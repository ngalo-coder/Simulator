// simulation-service/src/services/openRouterService.js - FINAL SAFE VERSION
const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.defaultModel = process.env.DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured');
    }
  }

  async generatePatientResponse(simulation, studentMessage) {
    try {
      const { patientPersona, conversationHistory } = simulation;
      const systemPrompt = this.buildNaturalSystemPrompt(patientPersona, simulation.difficulty);
      const messages = this.buildMessageHistory(conversationHistory, studentMessage);

      console.log(`🤖 Generating natural response for ${patientPersona.patient?.name || 'Patient'}`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.8, // Higher for more natural variation
        max_tokens: 200,  // Shorter responses
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://simulatech.netlify.app',
          'X-Title': 'AI Patient Simulation Platform'
        },
        timeout: 30000
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse response to separate patient and guardian voices if needed
      const parsedResponse = this.parsePatientGuardianResponse(aiResponse, patientPersona);
      
      // Extract clinical information revealed
      const clinicalInfo = this.extractClinicalInfo(aiResponse, patientPersona);
      
      return {
        patientResponse: parsedResponse.patient,
        guardianResponse: parsedResponse.guardian,
        clinicalInfo,
        usage: response.data.usage,
        model: this.defaultModel
      };

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
      
      // Natural fallback responses
      const fallbackResponses = [
        "Sorry, I didn't catch that. Can you ask again?",
        "I'm not feeling great right now. What did you say?",
        "Could you repeat that, please?",
        "I'm having trouble understanding. Can you say that again?"
      ];
      
      return {
        patientResponse: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        guardianResponse: null,
        clinicalInfo: {},
        error: error.message
      };
    }
  }

  buildNaturalSystemPrompt(patientPersona, difficulty) {
    // SAFE: Extract with defaults to prevent undefined errors
    const patient = patientPersona.patient || {};
    const guardian = patientPersona.guardian || {};
    const demographics = patientPersona.demographics || {};
    const medicalHistory = Array.isArray(patientPersona.medicalHistory) ? patientPersona.medicalHistory : [];
    const currentCondition = patientPersona.currentCondition || 'seeking medical help';
    const personality = patientPersona.personality || 'cooperative patient';
    const culturalFactors = patientPersona.culturalFactors || patientPersona.culturalBackground || demographics.ethnicity || '';
    const chiefComplaint = patientPersona.chiefComplaint || 'not feeling well';
    
    // Safe access to properties with fallbacks
    const patientAge = patient.age || demographics.age || 'unknown';
    const patientName = patient.name || 'Patient';
    const patientGender = patient.gender || 'patient';
    const guardianName = guardian.name || 'Guardian';
    const guardianRelation = guardian.relationship || 'family member';
    const primaryLanguage = demographics.primaryLanguage || 'English';
    
    // Safe check for pediatric case
    const ageString = String(patientAge).toLowerCase();
    const isPediatric = ageString.includes('months') || 
                       ageString.includes('year') || 
                       ageString.includes('old') ||
                       (!isNaN(patientAge) && parseInt(patientAge) < 18);
    
    let basePrompt = '';
    
    if (isPediatric) {
      basePrompt = `You are ${patientName}, a ${patientAge} child, and ${guardianName} (your ${guardianRelation}).

SITUATION: You came to see the doctor because ${chiefComplaint}.

WHAT'S WRONG: ${currentCondition}

HOW TO RESPOND:
- Keep it SIMPLE and NATURAL - like real people talking
- Child responses: Short, simple words. "It hurts", "I feel sick", crying is okay
- Guardian responses: Worried parent/caregiver language. "I'm concerned about...", "They've been..."
- Mix between child and guardian talking
- Don't use medical jargon - use everyday words
- Be emotional - worried, scared, tired, etc.

EXAMPLES OF GOOD RESPONSES:
Child: "My tummy hurts really bad" or "I don't want to talk" or *starts crying*
Guardian: "She's been like this since yesterday" or "I'm really worried, doctor"

KEEP RESPONSES SHORT: 1-2 sentences maximum. Talk like real people, not textbooks.`;

      // Add cultural context if present - SAFE checking
      const culturalBackground = String(culturalFactors).toLowerCase();
      if (culturalBackground.includes('kenyan') || 
          culturalBackground.includes('african') ||
          culturalBackground.includes('kiswahili')) {
        basePrompt += `\n\nCULTURAL NOTES:
- Guardian might mix a little Kiswahili: "daktari" (doctor), "pole sana" (sorry), "asante" (thank you)
- Mention family: "my mother says...", "the family is worried"
- Sometimes mention traditional remedies tried first`;
      }

    } else {
      // Adult patient
      basePrompt = `You are ${patientName}, a ${patientAge}-year-old person who came to see the doctor.

SITUATION: You're here because ${chiefComplaint}.

WHAT'S WRONG: ${currentCondition}

HOW TO RESPOND:
- Talk like a REAL PERSON, not a medical textbook
- Use everyday language: "I feel awful", "It really hurts", "I'm worried"
- Keep responses SHORT: 1-2 sentences maximum
- Show your emotions - scared, tired, frustrated, relieved
- Don't give long medical descriptions
- Answer what you're asked, don't volunteer everything at once

EXAMPLES OF GOOD RESPONSES:
"My chest really hurts"
"It started this morning"
"Yeah, it's getting worse"
"I'm scared it might be something serious"
"No, I've never had this before"

BE HUMAN: Use "um", "well", "I think", show hesitation, worry, etc.`;

      // Add cultural context for adults too - SAFE checking
      const culturalBackground = String(culturalFactors).toLowerCase();
      if (culturalBackground.includes('kenyan') || 
          culturalBackground.includes('african') ||
          culturalBackground.includes('kiswahili')) {
        basePrompt += `\n\nCULTURAL NOTES:
- You might use some Kiswahili words naturally: "daktari" (doctor), "pole" (sorry)
- Mention family or community: "my family is worried", "my neighbor had this"
- Sometimes reference trying traditional medicine first`;
      }
    }

    // Adjust for difficulty but keep it natural
    if (difficulty === 'resident' || difficulty === 'fellow') {
      basePrompt += `\n\nADDITIONAL COMPLEXITY:
- You might be a bit more anxious or have complications
- Could have some social/financial worries about treatment
- Still keep responses SHORT and NATURAL`;
    } else {
      basePrompt += `\n\nKEEP IT SIMPLE:
- Straightforward symptoms
- Cooperative but still human and emotional
- Don't make it too complicated`;
    }

    basePrompt += `\n\nIMPORTANT RULES:
1. Maximum 1-2 sentences per response
2. Use simple, everyday words
3. Show real human emotions
4. Don't sound like a medical textbook
5. Be conversational and natural`;

    return basePrompt;
  }

  buildMessageHistory(conversationHistory, newMessage) {
    const messages = [];
    
    // Add conversation history (last 8 messages for more focused context)
    const recentHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-8) : [];
    
    recentHistory.forEach(msg => {
      if (msg && msg.sender && msg.message) {
        if (msg.sender === 'student') {
          messages.push({
            role: 'user',
            content: msg.message
          });
        } else if (msg.sender === 'patient' || msg.sender === 'guardian') {
          messages.push({
            role: 'assistant',
            content: msg.message
          });
        }
      }
    });
    
    // Add new student message
    if (newMessage && typeof newMessage === 'string') {
      messages.push({
        role: 'user',
        content: newMessage
      });
    }
    
    return messages;
  }

  parsePatientGuardianResponse(response, patientPersona) {
    if (!response || typeof response !== 'string') {
      return { patient: response || '', guardian: null };
    }

    // Clean up the response - remove any formatting artifacts
    let cleanResponse = response.trim();
    
    // Remove any unwanted prefixes that might make it sound robotic
    cleanResponse = cleanResponse.replace(/^(Patient says?:|Guardian says?:|Response:|Answer:)\s*/i, '');
    cleanResponse = cleanResponse.replace(/^(As (a|the) patient,?|As (a|the) guardian,?)\s*/i, '');
    
    // Check if response contains both patient and guardian voices
    if (cleanResponse.includes('[PATIENT]:') && cleanResponse.includes('[GUARDIAN]:')) {
      const patientMatch = cleanResponse.match(/\[PATIENT\]:\s*(.*?)(?=\[GUARDIAN\]:|$)/s);
      const guardianMatch = cleanResponse.match(/\[GUARDIAN\]:\s*(.*?)$/s);
      
      return {
        patient: patientMatch ? patientMatch[1].trim() : cleanResponse,
        guardian: guardianMatch ? guardianMatch[1].trim() : null
      };
    }
    
    // SAFE: Check if it's a very young child
    const patientAge = String(patientPersona.patient?.age || patientPersona.demographics?.age || '').toLowerCase();
    const isVeryYoung = patientAge.includes('months') || 
                       (patientAge.includes('year') && parseInt(patientAge) < 5);
    
    if (isVeryYoung) {
      return {
        patient: null,
        guardian: cleanResponse
      };
    }
    
    // Default: assume it's the patient speaking
    return {
      patient: cleanResponse,
      guardian: null
    };
  }

  extractClinicalInfo(response, patientPersona) {
    if (!response || typeof response !== 'string') {
      return {};
    }

    // Simplified clinical info extraction for natural conversation
    const clinicalKeywords = {
      symptoms: ['pain', 'hurt', 'ache', 'fever', 'hot', 'sick', 'nausea', 'vomit', 'dizzy', 'tired', 'cough', 'sob'],
      severity: ['bad', 'really', 'very', 'little', 'worse', 'better', 'awful', 'terrible'],
      timing: ['today', 'yesterday', 'morning', 'night', 'hours', 'days', 'started', 'began'],
      location: ['chest', 'tummy', 'stomach', 'head', 'back', 'arm', 'here', 'there'],
      emotions: ['scared', 'worried', 'afraid', 'tired', 'upset', 'fine', 'okay']
    };

    const revealed = {};
    const lowerResponse = response.toLowerCase();

    Object.keys(clinicalKeywords).forEach(category => {
      const keywords = clinicalKeywords[category];
      if (Array.isArray(keywords)) {
        keywords.forEach(keyword => {
          if (lowerResponse.includes(keyword)) {
            if (!revealed[category]) revealed[category] = [];
            if (!revealed[category].includes(keyword)) {
              revealed[category].push(keyword);
            }
          }
        });
      }
    });

    return revealed;
  }

  async generateClinicalFeedback(simulation, studentActions) {
    try {
      const feedbackPrompt = this.buildNaturalFeedbackPrompt(simulation, studentActions);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: feedbackPrompt },
          { role: 'user', content: 'Please provide brief, practical feedback on this simulation.' }
        ],
        temperature: 0.3,
        max_tokens: 300 // Shorter feedback too
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://simulatech.netlify.app',
          'X-Title': 'AI Patient Simulation Platform'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Feedback generation error:', error.message);
      return 'Great job on the simulation! Keep practicing your communication skills and clinical reasoning.';
    }
  }

  buildNaturalFeedbackPrompt(simulation, studentActions) {
    if (!simulation || !simulation.patientPersona) {
      return 'Provide encouraging feedback for the medical student.';
    }

    const { patientPersona } = simulation;
    const patientName = patientPersona.patient?.name || 'Patient';
    const currentCondition = patientPersona.currentCondition || 'the medical case';
    
    return `Give brief, encouraging feedback to a medical student who just completed a simulation with ${patientName}.

The case involved: ${currentCondition}

Student actions: ${Array.isArray(studentActions) ? studentActions.map(action => action.action).join(', ') : 'conversational interaction'}

FEEDBACK STYLE:
- Keep it SHORT and encouraging
- Focus on what they did well
- Give 1-2 practical tips for improvement
- Use simple, supportive language
- Maximum 3-4 sentences

BE POSITIVE and HELPFUL - they're learning!`;
  }
}

module.exports = OpenRouterService;