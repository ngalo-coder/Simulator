// ai-patient-sim-core-services/simulation-service/src/services/openRouterService.js - OPTIMIZED FOR SPEED
const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.defaultModel = process.env.DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
    
    // Create axios instance with optimized defaults
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 12000, // 12 second timeout
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://simuatech.netlify.app',
        'X-Title': 'AI Patient Simulation Platform'
      }
    });

    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not configured');
    }

    console.log('🤖 OpenRouter service initialized with optimizations');
  }

  async generatePatientResponse(simulation, studentMessage) {
    try {
      const startTime = Date.now();
      
      // Build optimized system prompt (much shorter)
      const systemPrompt = this.buildOptimizedSystemPrompt(simulation);
      
      // Build minimal message history (only last 4 messages)
      const messages = this.buildMinimalMessageHistory(simulation.conversationHistory, studentMessage);

      console.log(`🤖 Generating AI response (${messages.length} messages in context)`);

      const requestData = {
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 150, // Reduced for faster response
        top_p: 0.9,
        stream: false
      };

      const response = await this.axiosInstance.post('/chat/completions', requestData);

      const responseTime = Date.now() - startTime;
      console.log(`✅ AI response generated in ${responseTime}ms`);

      const aiResponse = response.data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Empty AI response received');
      }

      // Parse response quickly
      const parsedResponse = this.parsePatientResponseFast(aiResponse, simulation.patientPersona);

      return {
        patientResponse: parsedResponse.patient,
        guardianResponse: parsedResponse.guardian,
        clinicalInfo: this.extractClinicalInfoFast(studentMessage, aiResponse),
        usage: response.data.usage,
        model: this.defaultModel,
        responseTime
      };

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error.response?.data || error.message);

      // Fast fallback responses
      return this.getFastFallbackResponse(simulation, error);
    }
  }

  /**
   * Build much shorter, focused system prompt
   */
  buildOptimizedSystemPrompt(simulation) {
    const { patientPersona } = simulation;
    const patient = patientPersona.patient || {};
    const currentCondition = patientPersona.currentCondition || 'medical concern';
    const emotionalTone = patientPersona.personality?.emotionalTone || 'concerned';
    const chiefComplaint = patientPersona.chiefComplaint || 'not feeling well';

    // Check if pediatric case
    const ageString = String(patient.age || '').toLowerCase();
    const isPediatric = ageString.includes('months') || 
                       ageString.includes('year') || 
                       (!isNaN(patient.age) && parseInt(patient.age) < 18);

    if (isPediatric && patientPersona.guardian) {
      return `CRITICAL: You are ONLY the PATIENT - a ${patient.age} child named ${patient.name}. 

You are NOT a doctor or clinician. You are the PATIENT seeking help.

You have: ${chiefComplaint}
You feel: ${emotionalTone}

PATIENT RESPONSE RULES:
- You are the PATIENT, NOT the doctor
- Answer as the patient would - from your perspective
- Keep responses SHORT (1-2 sentences)
- Show you're ${emotionalTone}
- Use simple words appropriate for your age
- Only answer what the doctor asks you directly

NEVER give medical advice or act like a doctor. You are the patient who needs help.`;
    } else {
      return `CRITICAL: You are ONLY the PATIENT - ${patient.name || 'a patient'}, age ${patient.age || 'adult'}.

You are NOT a doctor or clinician. You are the PATIENT seeking medical help.

Your condition: ${currentCondition}
Why you came: ${chiefComplaint}
How you feel: ${emotionalTone}

PATIENT RESPONSE RULES:
- You are the PATIENT, NOT the doctor
- Answer from the patient's perspective only
- Keep answers SHORT (1-2 sentences max)
- Show you're feeling ${emotionalTone}
- Use simple, natural language
- Only answer what the doctor asks you
- NEVER give medical advice or diagnose yourself

You are here because you need help from the doctor. You are NOT the medical professional.`;
    }
  }

  /**
   * Build minimal message history for speed
   */
  buildMinimalMessageHistory(conversationHistory, newMessage) {
    const messages = [];

    // Only include last 4 messages for context
    const recentHistory = Array.isArray(conversationHistory) ? 
      conversationHistory.slice(-4) : [];

    recentHistory.forEach((msg) => {
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

  /**
   * Fast response parsing
   */
  parsePatientResponseFast(response, patientPersona) {
    if (!response || typeof response !== 'string') {
      return { patient: response || '', guardian: null };
    }

    // Clean response quickly
    let cleanResponse = response.trim()
      .replace(/^(Patient says?:|Guardian says?:|Response:|Answer:)\s*/i, '')
      .replace(/^(As (a|the) patient,?|As (a|the) guardian,?)\s*/i, '');

    // Quick check for structured response
    if (cleanResponse.includes('[PATIENT]:') && cleanResponse.includes('[GUARDIAN]:')) {
      const patientMatch = cleanResponse.match(/\[PATIENT\]:\s*(.*?)(?=\[GUARDIAN\]:|$)/s);
      const guardianMatch = cleanResponse.match(/\[GUARDIAN\]:\s*(.*?)$/s);

      return {
        patient: patientMatch ? patientMatch[1].trim() : cleanResponse,
        guardian: guardianMatch ? guardianMatch[1].trim() : null
      };
    }

    // Quick age check for pediatric cases
    const patientAge = String(patientPersona.patient?.age || '').toLowerCase();
    const isVeryYoung = patientAge.includes('months') || 
                       (patientAge.includes('year') && parseInt(patientAge) < 5);

    if (isVeryYoung && patientPersona.guardian) {
      return {
        patient: null,
        guardian: cleanResponse
      };
    }

    // Default: assume patient speaking
    return {
      patient: cleanResponse,
      guardian: null
    };
  }

  /**
   * Fast clinical info extraction
   */
  extractClinicalInfoFast(studentMessage, response) {
    if (!response || typeof response !== 'string') {
      return {};
    }

    const messageLower = studentMessage.toLowerCase();
    const responseLower = response.toLowerCase();
    const clinicalInfo = {};

    // Quick keyword-based extraction
    const extractionRules = {
      'pain|hurt|symptom': () => {
        if (responseLower.includes('pain') || responseLower.includes('hurt')) {
          clinicalInfo.symptoms = ['pain mentioned'];
        }
      },
      'when|start|began|long': () => {
        if (responseLower.includes('hour') || responseLower.includes('day') || responseLower.includes('week')) {
          clinicalInfo.timing = ['timeline provided'];
        }
      },
      'where|location': () => {
        if (responseLower.includes('chest') || responseLower.includes('head') || responseLower.includes('stomach')) {
          clinicalInfo.location = ['anatomical location mentioned'];
        }
      },
      'severe|bad|scale': () => {
        if (responseLower.match(/\d+\/10|\d+ out of 10|severe|mild|moderate/)) {
          clinicalInfo.severity = ['severity described'];
        }
      }
    };

    // Apply extraction rules quickly
    Object.entries(extractionRules).forEach(([keywords, extractor]) => {
      if (new RegExp(keywords, 'i').test(messageLower)) {
        extractor();
      }
    });

    return Object.keys(clinicalInfo).length > 0 ? clinicalInfo : {};
  }

  /**
   * Fast fallback response generation
   */
  getFastFallbackResponse(simulation, error) {
    const patientPersona = simulation.patientPersona || {};
    const patient = patientPersona.patient || {};
    const emotionalTone = patientPersona.personality?.emotionalTone || 'concerned';
    
    // Quick fallback responses based on emotional tone
    const fallbackResponses = {
      'anxious': [
        "I'm sorry doctor, I'm quite anxious right now. Could you repeat that?",
        "I'm worried about my condition and didn't catch what you said. Can you ask again?",
        "I'm feeling very nervous about my symptoms. What did you want to know?"
      ],
      'scared': [
        "I'm scared doctor. Could you please repeat your question?",
        "I'm frightened about what's wrong with me and missed what you said.",
        "I'm really scared about my condition. What did you ask?"
      ],
      'tired': [
        "I'm so tired doctor. Could you ask me that again?",
        "I'm exhausted from feeling unwell and didn't hear you clearly.",
        "I'm feeling weak. What did you say?"
      ],
      'calm': [
        "Could you repeat that question please doctor?",
        "I didn't quite catch what you said.",
        "Can you ask me that again?"
      ],
      'frustrated': [
        "I'm getting frustrated with how I'm feeling. What did you ask?",
        "Could you please repeat that? I'm having trouble concentrating because of my symptoms.",
        "I didn't understand. Can you say that again?"
      ]
    };

    const tone = emotionalTone.toLowerCase();
    const responses = fallbackResponses[tone] || fallbackResponses['calm'];
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    console.log(`🔄 Using fallback response for ${tone} patient`);

    return {
      patientResponse: selectedResponse,
      guardianResponse: null,
      clinicalInfo: {},
      error: error.message,
      fallback: true
    };
  }

  /**
   * Generate clinical feedback - optimized version
   */
  async generateClinicalFeedback(simulation, studentActions) {
    try {
      // Build very short feedback prompt
      const patientName = simulation.patientPersona?.patient?.name || 'Patient';
      const condition = simulation.patientPersona?.currentCondition || 'the medical case';
      const actionsString = Array.isArray(studentActions) ? 
        studentActions.map(a => a.action).join(', ') : 'conversation';

      const feedbackPrompt = `Give brief feedback to a medical student who completed a simulation with ${patientName}.

Case: ${condition}
Student did: ${actionsString}

Give 2-3 sentences of encouraging feedback with one tip for improvement.`;

      const response = await this.axiosInstance.post('/chat/completions', {
        model: this.defaultModel,
        messages: [
          { 
            role: 'system', 
            content: 'You are a medical educator giving brief, encouraging feedback to students.' 
          },
          { 
            role: 'user', 
            content: feedbackPrompt 
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
        timeout: 8000 // Shorter timeout for feedback
      });

      return response.data.choices[0]?.message?.content || 
             'Good work on the simulation! Keep practicing your clinical skills.';

    } catch (error) {
      console.error('❌ Feedback generation error:', error.message);
      return 'Great job completing the simulation! Continue practicing to improve your clinical reasoning and communication skills.';
    }
  }

  /**
   * Health check for OpenRouter service
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return {
          status: 'warning',
          message: 'API key not configured',
          configured: false
        };
      }

      // Quick test call with minimal data
      const testResponse = await this.axiosInstance.post('/chat/completions', {
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      });

      return {
        status: 'healthy',
        message: 'OpenRouter API accessible',
        configured: true,
        model: this.defaultModel,
        responseTime: 'OK'
      };

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        configured: !!this.apiKey,
        error: error.response?.status || 'Network error'
      };
    }
  }

  /**
   * Get optimized models list (cache results)
   */
  async getAvailableModels() {
    try {
      // Cache models list to avoid repeated API calls
      if (this._cachedModels && this._cacheTime && (Date.now() - this._cacheTime < 300000)) {
        return this._cachedModels;
      }

      const response = await this.axiosInstance.get('/models', { timeout: 5000 });
      
      this._cachedModels = response.data.data || [];
      this._cacheTime = Date.now();
      
      return this._cachedModels;

    } catch (error) {
      console.error('❌ Error fetching models:', error.message);
      return [];
    }
  }

  /**
   * Switch to faster model for simple responses
   */
  async generateSimpleResponse(prompt, maxTokens = 50) {
    try {
      const fastModel = 'openai/gpt-3.5-turbo'; // Faster, cheaper model
      
      const response = await this.axiosInstance.post('/chat/completions', {
        model: fastModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
        timeout: 5000
      });

      return response.data.choices[0]?.message?.content || '';

    } catch (error) {
      console.error('❌ Simple response generation failed:', error.message);
      return '';
    }
  }

  /**
   * Batch process multiple messages (for efficiency)
   */
  async batchGenerateResponses(requests) {
    const results = [];
    
    // Process in batches of 3 to avoid overwhelming the API
    for (let i = 0; i < requests.length; i += 3) {
      const batch = requests.slice(i, i + 3);
      
      const batchPromises = batch.map(async (request) => {
        try {
          return await this.generatePatientResponse(request.simulation, request.message);
        } catch (error) {
          return this.getFastFallbackResponse(request.simulation, error);
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      ));

      // Small delay between batches to be API-friendly
      if (i + 3 < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Cache frequently used responses
   */
  getCachedResponse(key) {
    if (!this._responseCache) this._responseCache = new Map();
    
    const cached = this._responseCache.get(key);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.response;
    }
    
    return null;
  }

  setCachedResponse(key, response) {
    if (!this._responseCache) this._responseCache = new Map();
    
    // Limit cache size
    if (this._responseCache.size > 100) {
      const firstKey = this._responseCache.keys().next().value;
      this._responseCache.delete(firstKey);
    }
    
    this._responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      service: 'OpenRouter',
      configured: !!this.apiKey,
      model: this.defaultModel,
      cacheSize: this._responseCache?.size || 0,
      timeout: 12000,
      optimizations: [
        'Reduced token limits',
        'Shorter system prompts',
        'Minimal conversation history',
        'Fast fallback responses',
        'Response caching',
        'Batch processing support'
      ]
    };
  }
}

module.exports = OpenRouterService;