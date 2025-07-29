// simulation-service/src/services/openRouterService.js - FIXED VERSION
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
      const systemPrompt = this.buildSystemPrompt(patientPersona, simulation.difficulty);
      const messages = this.buildMessageHistory(conversationHistory, studentMessage);

      console.log(`🤖 Generating response for ${patientPersona.patient?.name || 'Patient'}`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 400,
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
      
      // Fallback response for errors
      return {
        patientResponse: "I'm sorry, I'm not feeling well right now. Could you repeat that?",
        guardianResponse: null,
        clinicalInfo: {},
        error: error.message
      };
    }
  }

  buildSystemPrompt(patientPersona, difficulty) {
    const { patient = {}, guardian = {}, demographics = {}, medicalHistory = [], currentCondition, personality, culturalFactors } = patientPersona;
    
    let basePrompt = '';
    
    // Safe access to properties with fallbacks
    const patientAge = patient.age || demographics.age || 'unknown';
    const patientName = patient.name || 'Patient';
    const patientGender = patient.gender || 'patient';
    const guardianName = guardian.name || 'Guardian';
    const guardianRelation = guardian.relationship || 'family member';
    const primaryLanguage = demographics.primaryLanguage || 'English';
    const culturalBackground = culturalFactors || demographics.ethnicity || 'general';
    
    // Check if pediatric case (safe string checking)
    const isPediatric = (typeof patientAge === 'string' && (patientAge.includes('months') || patientAge.includes('years'))) || 
                       (typeof patientAge === 'number' && patientAge < 18) ||
                       (parseInt(patientAge) > 0 && parseInt(patientAge) < 18);
    
    if (isPediatric) {
      basePrompt = `You are playing TWO roles in a medical simulation:

PRIMARY ROLE - PATIENT: ${patientName}, ${patientAge} old ${patientGender}
- Current condition: ${currentCondition || 'seeking medical care'}
- Medical history: ${Array.isArray(medicalHistory) ? medicalHistory.join(', ') : 'None significant'}
- Personality: ${typeof personality === 'object' ? personality.patient : personality || 'age-appropriate behavior'}

SECONDARY ROLE - GUARDIAN: ${guardianName} (${guardianRelation})
- Anxiety level: ${guardian.anxietyLevel || guardian.anxiety_level || 'concerned'}
- Primary concerns: ${Array.isArray(guardian.concerns) ? guardian.concerns.join(', ') : 'child\'s wellbeing'}
- Cultural background: ${culturalBackground}
- Language: ${primaryLanguage}
- Education: ${guardian.education || demographics.education || 'secondary'}`;

      // Safe cultural language checking
      if (primaryLanguage.toLowerCase().includes('spanish') || culturalBackground.toLowerCase().includes('spanish')) {
        basePrompt += `\n- IMPORTANT: Guardian speaks limited English, occasionally uses Spanish phrases`;
      } else if (culturalBackground.toLowerCase().includes('kenyan') || 
                 culturalBackground.toLowerCase().includes('african') ||
                 culturalBackground.toLowerCase().includes('kiswahili')) {
        basePrompt += `\n- IMPORTANT: Guardian may mix English with Kiswahili naturally`;
      }

      basePrompt += `\n\nINSTRUCTIONS:
1. For young children (under 7): Patient mostly cries, points, uses simple words. Guardian does most talking.
2. For older children (7-12): Patient can answer simple questions but looks to guardian for comfort.
3. For adolescents (13-17): Patient may want privacy but guardian is protective.

RESPONSE FORMAT:
When both patient and guardian respond, use this format:
[PATIENT]: (patient's response)
[GUARDIAN]: (guardian's response)

When only one responds, just write the response directly.

CULTURAL AUTHENTICITY:
- Show realistic cultural speech patterns and references
- Include family/community context in responses
- Reference traditional medicine or cultural beliefs when appropriate
- Use respectful, storytelling communication style

MEDICAL ACCURACY:
- Stay consistent with the diagnosis: ${currentCondition || 'presenting symptoms'}
- Don't provide medical advice or diagnoses
- Show appropriate symptoms for age and condition
- Guardian should have realistic medical knowledge based on education level`;

    } else {
      // Adult patient
      basePrompt = `You are a ${patientAge}-year-old ${patientGender} patient seeking medical care.

PATIENT PROFILE:
- Name: ${patientName}
- Chief complaint: ${patientPersona.chiefComplaint || 'seeking medical help'}
- Current condition: ${currentCondition || 'presenting symptoms'}
- Medical history: ${Array.isArray(medicalHistory) ? medicalHistory.join(', ') : 'None'}
- Personality: ${personality || 'cooperative patient'}
- Cultural background: ${culturalBackground}
- Education: ${demographics.education || 'secondary'}
- Socioeconomic: ${demographics.socioeconomic || 'urban_informal'}

INSTRUCTIONS:
1. Respond as this patient would - use first person ("I feel...", "My pain is...")
2. Answer questions honestly but don't volunteer medical information unless asked
3. Show appropriate emotional responses based on condition
4. Keep responses realistic and conversational (50-150 words)
5. Stay in character - you're seeking help, not providing medical advice

CULTURAL SPEECH PATTERNS:
- Mix English with local language phrases naturally if appropriate
- Reference family, community, or traditional medicine when relevant
- Show respect for medical authority while expressing concerns
- Use storytelling approach rather than just direct answers`;
    }

    // Adjust complexity based on difficulty level
    if (difficulty === 'resident' || difficulty === 'fellow') {
      basePrompt += `\n\nCOMPLEXITY LEVEL - ${difficulty.toUpperCase()}:
- Present with some atypical features or complications
- Include psychosocial factors that affect care
- May have medication compliance issues or insurance barriers
- Show realistic patient emotions (fear, anxiety, frustration)
- Include cultural or language barriers that affect communication`;
    } else {
      basePrompt += `\n\nCOMPLEXITY LEVEL - STUDENT:
- Present with classic, textbook symptoms
- Be cooperative and straightforward
- Focus on core medical learning objectives
- Still show cultural authenticity but more straightforward communication`;
    }

    return basePrompt;
  }

  buildMessageHistory(conversationHistory, newMessage) {
    const messages = [];
    
    // Add conversation history (last 10 messages to stay within token limits)
    const recentHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : [];
    
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

    // Check if response contains both patient and guardian voices
    if (response.includes('[PATIENT]:') && response.includes('[GUARDIAN]:')) {
      const patientMatch = response.match(/\[PATIENT\]:\s*(.*?)(?=\[GUARDIAN\]:|$)/s);
      const guardianMatch = response.match(/\[GUARDIAN\]:\s*(.*?)$/s);
      
      return {
        patient: patientMatch ? patientMatch[1].trim() : response,
        guardian: guardianMatch ? guardianMatch[1].trim() : null
      };
    }
    
    // Check if it's a pediatric case
    const patientAge = patientPersona.patient?.age || patientPersona.demographics?.age;
    const isPediatric = (typeof patientAge === 'string' && patientAge.includes('months')) || 
                       (parseInt(patientAge) > 0 && parseInt(patientAge) < 7);
    
    if (isPediatric) {
      return {
        patient: null, // Very young children don't speak much
        guardian: response
      };
    }
    
    // Default: assume it's the primary speaker
    return {
      patient: response,
      guardian: null
    };
  }

  extractClinicalInfo(response, patientPersona) {
    if (!response || typeof response !== 'string') {
      return {};
    }

    const clinicalKeywords = {
      symptoms: ['pain', 'ache', 'fever', 'nausea', 'vomiting', 'dizzy', 'tired', 'sob', 'cough'],
      severity: ['mild', 'moderate', 'severe', 'worst', 'better', 'worse', '1-10', 'scale'],
      timing: ['minutes', 'hours', 'days', 'weeks', 'started', 'began', 'since', 'ago'],
      quality: ['sharp', 'dull', 'crushing', 'burning', 'stabbing', 'throbbing', 'cramping'],
      location: ['chest', 'back', 'arm', 'jaw', 'stomach', 'head', 'abdomen', 'right', 'left'],
      associated: ['sweating', 'nausea', 'shortness', 'dizzy', 'weak', 'tired']
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
      const feedbackPrompt = this.buildFeedbackPrompt(simulation, studentActions);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: feedbackPrompt },
          { role: 'user', content: 'Please provide feedback on this simulation session.' }
        ],
        temperature: 0.3,
        max_tokens: 500
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
      return 'Feedback generation is temporarily unavailable. Please review your performance with your instructor.';
    }
  }

  buildFeedbackPrompt(simulation, studentActions) {
    if (!simulation || !simulation.patientPersona) {
      return 'Unable to generate feedback due to missing simulation data.';
    }

    const { patientPersona, learningProgress } = simulation;
    const patientName = patientPersona.patient?.name || 'Patient';
    const patientAge = patientPersona.patient?.age || patientPersona.demographics?.age || 'unknown';
    const currentCondition = patientPersona.currentCondition || 'unknown condition';
    const programArea = simulation.programArea || 'general medicine';
    const learningObjectives = patientPersona.learningObjectives || ['General clinical skills'];
    
    return `You are a medical education AI providing constructive feedback to a ${simulation.difficulty || 'student'} on their patient simulation performance.

CASE DETAILS:
- Patient: ${patientName}, ${patientAge}
- Condition: ${currentCondition}
- Program: ${programArea}

STUDENT ACTIONS TAKEN:
${Array.isArray(studentActions) ? studentActions.map(action => `- ${action.action}: ${action.details}`).join('\n') : 'No specific actions recorded'}

LEARNING OBJECTIVES:
${Array.isArray(learningObjectives) ? learningObjectives.join('\n- ') : learningObjectives}

PROVIDE FEEDBACK ON:
1. Clinical reasoning and diagnostic approach
2. Communication skills (especially with guardians if pediatric case)
3. What was done well
4. Areas for improvement
5. Next steps for learning

Keep feedback constructive, specific, and educational. Focus on learning, not judgment.`;
  }
}

module.exports = OpenRouterService;