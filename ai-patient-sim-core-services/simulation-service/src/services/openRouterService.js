// simulation-service/src/services/openRouterService.js - ENHANCED VERSION
const axios = require('axios');
const DialogueEnhancer = require('./dialogue/dialogueEnhancer');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.defaultModel = process.env.DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
    
    // Initialize dialogue enhancer
    this.dialogueEnhancer = new DialogueEnhancer();
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured');
    }
  }

  async generatePatientResponse(simulation, studentMessage) {
    try {
      const { patientPersona, conversationHistory } = simulation;
      
      // Build enhanced system prompt with dialogue context
      const baseSystemPrompt = this.buildSystemPrompt(patientPersona, simulation.difficulty);
      const enhancedSystemPrompt = this.dialogueEnhancer.enhanceSystemPrompt(
        baseSystemPrompt,
        patientPersona,
        { conversationHistory, currentMessage: studentMessage }
      );
      
      const messages = this.buildMessageHistory(conversationHistory, studentMessage);

      console.log(`🤖 Generating enhanced response for ${patientPersona.patient?.name || 'Patient'}`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
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
      
      // Parse response to separate patient and guardian voices
      const parsedResponse = this.parsePatientGuardianResponse(aiResponse, patientPersona);
      
      // Enhance patient response with dialogue systems
      let enhancedPatientResponse = null;
      let enhancedGuardianResponse = null;
      
      if (parsedResponse.patient) {
        const patientEnhancement = this.dialogueEnhancer.enhancePatientResponse(
          parsedResponse.patient,
          patientPersona,
          conversationHistory,
          studentMessage
        );
        
        enhancedPatientResponse = {
          text: patientEnhancement.enhancedText,
          emotionalState: patientEnhancement.emotionalState,
          physicalCues: patientEnhancement.physicalCues,
          responseDelay: patientEnhancement.responseDelay,
          culturalElements: patientEnhancement.culturalElements
        };
      }
      
      if (parsedResponse.guardian && patientPersona.guardian) {
        const guardianEnhancement = this.dialogueEnhancer.enhanceGuardianResponse(
          parsedResponse.guardian,
          patientPersona.guardian,
          patientPersona,
          this.determineGuardianSituation(studentMessage, conversationHistory)
        );
        
        enhancedGuardianResponse = {
          text: guardianEnhancement.enhancedText,
          emotionalState: guardianEnhancement.emotionalState,
          culturalElements: guardianEnhancement.culturalElements,
          responseDelay: guardianEnhancement.responseDelay
        };
      }
      
      // Extract clinical information revealed (enhanced)
      const clinicalInfo = this.extractClinicalInfo(aiResponse, patientPersona);
      
      return {
        patientResponse: enhancedPatientResponse?.text || null,
        guardianResponse: enhancedGuardianResponse?.text || null,
        clinicalInfo,
        dialogueMetadata: {
          patientEmotionalState: enhancedPatientResponse?.emoticalState,
          guardianEmotionalState: enhancedGuardianResponse?.emotionalState,
          physicalCues: enhancedPatientResponse?.physicalCues || [],
          culturalElements: [
            ...(enhancedPatientResponse?.culturalElements || []),
            ...(enhancedGuardianResponse?.culturalElements || [])
          ],
          responseDelays: {
            patient: enhancedPatientResponse?.responseDelay || 1000,
            guardian: enhancedGuardianResponse?.responseDelay || 1000
          }
        },
        usage: response.data.usage,
        model: this.defaultModel
      };

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
      
      // Fallback response with basic enhancement
      const fallbackResponse = "I'm sorry, I'm not feeling well right now. Could you repeat that?";
      const fallbackEnhancement = this.dialogueEnhancer.enhancePatientResponse(
        fallbackResponse,
        simulation.patientPersona,
        simulation.conversationHistory,
        studentMessage
      );
      
      return {
        patientResponse: fallbackEnhancement.enhancedText,
        guardianResponse: null,
        clinicalInfo: {},
        dialogueMetadata: {
          patientEmotionalState: fallbackEnhancement.emotionalState,
          physicalCues: fallbackEnhancement.physicalCues,
          culturalElements: fallbackEnhancement.culturalElements,
          responseDelays: { patient: fallbackEnhancement.responseDelay }
        },
        error: error.message
      };
    }
  }

  buildSystemPrompt(patientPersona, difficulty) {
    const { patient, guardian, demographics, medicalHistory, currentCondition, personality, culturalFactors } = patientPersona;
    
    let basePrompt = '';
    
    // Pediatric cases with guardian
    if (patient.age && (patient.age.includes('months') || patient.age.includes('years') || parseInt(patient.age) < 18)) {
      basePrompt = `You are playing TWO roles in a medical simulation:

PRIMARY ROLE - PATIENT: ${patient.name}, ${patient.age} old ${patient.gender}
- Current condition: ${currentCondition}
- Medical history: ${medicalHistory?.join(', ') || 'None significant'}
- Personality: ${personality?.patient || 'age-appropriate behavior'}

SECONDARY ROLE - GUARDIAN: ${guardian?.name} (${guardian?.relationship})
- Anxiety level: ${guardian?.anxietyLevel || 'concerned'}
- Primary concerns: ${guardian?.concerns?.join(', ') || 'child\'s wellbeing'}
- Cultural background: ${culturalFactors || demographics?.ethnicity || 'Kenyan'}
- Language: ${demographics?.primaryLanguage || 'English'}
- Education: ${guardian?.education || 'secondary'}`;

      if (demographics?.primaryLanguage === 'spanish' || culturalFactors?.includes('spanish')) {
        basePrompt += `\n- IMPORTANT: Guardian speaks limited English, occasionally uses Spanish phrases`;
      } else if (culturalFactors?.includes('kenyan') || demographics?.ethnicity?.includes('kenyan')) {
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
- Stay consistent with the diagnosis: ${currentCondition}
- Don't provide medical advice or diagnoses
- Show appropriate symptoms for age and condition
- Guardian should have realistic medical knowledge based on education level`;

    } else {
      // Adult patient
      basePrompt = `You are a ${demographics?.age || patient.age}-year-old ${patient.gender} patient seeking medical care.

PATIENT PROFILE:
- Name: ${patient.name}
- Chief complaint: ${patientPersona.chiefComplaint}
- Current condition: ${currentCondition}
- Medical history: ${medicalHistory?.join(', ') || 'None'}
- Personality: ${personality}
- Cultural background: ${culturalFactors || demographics?.ethnicity || 'Kenyan'}
- Education: ${demographics?.education || 'secondary'}
- Socioeconomic: ${demographics?.socioeconomic || 'urban_informal'}

INSTRUCTIONS:
1. Respond as this patient would - use first person ("I feel...", "My pain is...")
2. Answer questions honestly but don't volunteer medical information unless asked
3. Show appropriate emotional responses based on condition
4. Keep responses realistic and conversational (50-150 words)
5. Stay in character - you're seeking help, not providing medical advice

CULTURAL SPEECH PATTERNS:
- Mix English with Kiswahili phrases naturally if Kenyan background
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
    const recentHistory = conversationHistory.slice(-10);
    
    recentHistory.forEach(msg => {
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
    });
    
    // Add new student message
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    return messages;
  }

  parsePatientGuardianResponse(response, patientPersona) {
    // Check if response contains both patient and guardian voices
    if (response.includes('[PATIENT]:') && response.includes('[GUARDIAN]:')) {
      const patientMatch = response.match(/\[PATIENT\]:\s*(.*?)(?=\[GUARDIAN\]:|$)/s);
      const guardianMatch = response.match(/\[GUARDIAN\]:\s*(.*?)$/s);
      
      return {
        patient: patientMatch ? patientMatch[1].trim() : response,
        guardian: guardianMatch ? guardianMatch[1].trim() : null
      };
    }
    
    // If it's a pediatric case but no format markers, assume it's mostly guardian speaking
    if (patientPersona.patient?.age && (patientPersona.patient.age.includes('months') || parseInt(patientPersona.patient.age) < 7)) {
      return {
        patient: null, // Very young children don't speak much
        guardian: response
      };
    }
    
    // Default: assume it's the primary speaker (patient for adults, guardian for very young children)
    return {
      patient: response,
      guardian: null
    };
  }

  determineGuardianSituation(studentMessage, conversationHistory) {
    const message = studentMessage.toLowerCase();
    
    if (message.includes('diagnosis') || message.includes('what') && message.includes('wrong')) {
      return 'diagnosis_news';
    }
    if (message.includes('treatment') || message.includes('medicine') || message.includes('surgery')) {
      return 'treatment_discussion';
    }
    if (message.includes('cost') || message.includes('insurance') || message.includes('pay')) {
      return 'financial_concern';
    }
    if (conversationHistory.length < 3) {
      return 'initial_concern';
    }
    
    return 'general_inquiry';
  }

  extractClinicalInfo(response, patientPersona) {
    const clinicalKeywords = {
      symptoms: ['pain', 'ache', 'fever', 'nausea', 'vomiting', 'dizzy', 'tired', 'sob', 'cough', 'maumivu', 'homa'],
      severity: ['mild', 'moderate', 'severe', 'worst', 'better', 'worse', '1-10', 'scale'],
      timing: ['minutes', 'hours', 'days', 'weeks', 'started', 'began', 'since', 'ago'],
      quality: ['sharp', 'dull', 'crushing', 'burning', 'stabbing', 'throbbing', 'cramping'],
      location: ['chest', 'back', 'arm', 'jaw', 'stomach', 'head', 'abdomen', 'right', 'left', 'tumbo', 'kichwa'],
      associated: ['sweating', 'nausea', 'shortness', 'dizzy', 'weak', 'tired'],
      cultural: ['traditional', 'family', 'grandmother', 'village', 'herbs', 'prayer']
    };

    const revealed = {};
    const lowerResponse = response.toLowerCase();

    Object.keys(clinicalKeywords).forEach(category => {
      clinicalKeywords[category].forEach(keyword => {
        if (lowerResponse.includes(keyword)) {
          if (!revealed[category]) revealed[category] = [];
          if (!revealed[category].includes(keyword)) {
            revealed[category].push(keyword);
          }
        }
      });
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
    const { patientPersona, learningProgress } = simulation;
    const conversationInsights = this.dialogueEnhancer.getConversationInsights();
    
    return `You are a medical education AI providing constructive feedback to a ${simulation.difficulty} on their patient simulation performance.

CASE DETAILS:
- Patient: ${patientPersona.patient?.name}, ${patientPersona.patient?.age}
- Condition: ${patientPersona.currentCondition}
- Program: ${simulation.programArea}
- Cultural context: ${patientPersona.culturalFactors || 'General'}

STUDENT ACTIONS TAKEN:
${studentActions.map(action => `- ${action.action}: ${action.details}`).join('\n')}

COMMUNICATION ANALYSIS:
- Emotional journey: ${conversationInsights.emotionalJourney?.map(e => e.state).join(' → ') || 'stable'}
- Cultural elements engaged: ${conversationInsights.culturalElements?.length || 0}
- Conversation duration: ${Math.round(conversationInsights.totalDuration / 60000)} minutes
- Total interactions: ${conversationInsights.totalInteractions}

LEARNING OBJECTIVES:
${patientPersona.learningObjectives?.join('\n- ') || 'General clinical skills'}

PROVIDE FEEDBACK ON:
1. Clinical reasoning and diagnostic approach
2. Communication skills and cultural sensitivity
3. Patient-centered care approach
4. What was done well
5. Areas for improvement with specific examples
6. Next steps for learning

Keep feedback constructive, specific, and educational. Highlight cultural competency aspects.`;
  }

  // Reset dialogue enhancer for new simulation
  resetDialogueContext() {
    this.dialogueEnhancer.resetContext();
  }
}

module.exports = OpenRouterService;