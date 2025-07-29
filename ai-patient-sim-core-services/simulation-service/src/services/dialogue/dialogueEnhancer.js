// simulation-service/src/services/dialogue/dialogueEnhancer.js
const NaturalSpeechEngine = require('./naturalSpeech');
const EmotionalStateManager = require('./emotionalStates');
const CulturalContextManager = require('./culturalContext');

class DialogueEnhancer {
  constructor() {
    this.speechEngine = new NaturalSpeechEngine();
    this.emotionalManager = new EmotionalStateManager();
    this.culturalManager = new CulturalContextManager();
    
    // Conversation context
    this.conversationContext = {
      duration: 0,
      interactions: 0,
      startTime: Date.now(),
      culturalElementsUsed: [],
      emotionalJourney: []
    };
  }

  /**
   * Main method to enhance patient responses with natural dialogue
   */
  enhancePatientResponse(baseResponse, patientProfile, conversationHistory, userInput) {
    try {
      console.log('🎭 Enhancing dialogue for patient:', patientProfile.patient?.name);
      
      // Update conversation context
      this.updateConversationContext(conversationHistory);
      
      // Analyze emotional state from user input and context
      const emotionalAnalysis = this.emotionalManager.analyzeInput(
        userInput, 
        this.conversationContext
      );
      
      // Enhance with natural speech patterns
      let enhancedResponse = this.speechEngine.enhanceResponse(
        baseResponse,
        emotionalAnalysis.currentState,
        patientProfile.culturalBackground || 'kenyan_general',
        patientProfile
      );
      
      // Add cultural context
      enhancedResponse = this.culturalManager.enhanceResponseWithCulture(
        enhancedResponse,
        patientProfile,
        emotionalAnalysis.currentState
      );
      
      // Calculate response timing
      const responseDelay = this.speechEngine.calculateResponseDelay(
        enhancedResponse,
        emotionalAnalysis.currentState
      );
      
      // Track emotional journey
      this.conversationContext.emotionalJourney.push({
        timestamp: Date.now(),
        state: emotionalAnalysis.currentState,
        intensity: emotionalAnalysis.intensity,
        trigger: userInput.substring(0, 50)
      });
      
      return {
        enhancedText: enhancedResponse,
        emotionalState: emotionalAnalysis.currentState,
        intensity: emotionalAnalysis.intensity,
        physicalCues: emotionalAnalysis.physicalCues,
        responseDelay: responseDelay,
        culturalElements: this.extractCulturalElements(enhancedResponse),
        metadata: {
          speechPatterns: emotionalAnalysis.speechModifications,
          triggers: emotionalAnalysis.triggers,
          conversationFlow: this.analyzeConversationFlow(conversationHistory)
        }
      };
      
    } catch (error) {
      console.error('❌ Dialogue enhancement error:', error);
      return {
        enhancedText: baseResponse,
        emotionalState: 'calm',
        intensity: 0.5,
        physicalCues: [],
        responseDelay: 1000,
        culturalElements: [],
        error: error.message
      };
    }
  }

  /**
   * Enhance guardian responses with cultural authenticity
   */
  enhanceGuardianResponse(baseResponse, guardianProfile, patientProfile, situation) {
    try {
      console.log('👥 Enhancing guardian dialogue:', guardianProfile?.name);
      
      // Determine guardian emotional state
      const guardianEmotionalState = this.determineGuardianEmotionalState(
        guardianProfile, 
        situation, 
        this.conversationContext
      );
      
      // Add cultural behavior
      let enhancedResponse = this.culturalManager.getGuardianCulturalBehavior(
        guardianProfile,
        situation
      );
      
      // If we have a base response, enhance it; otherwise use cultural behavior
      if (baseResponse && baseResponse.trim()) {
        enhancedResponse = this.speechEngine.enhanceResponse(
          baseResponse,
          guardianEmotionalState,
          guardianProfile.culturalBackground || 'kenyan_general',
          guardianProfile
        );
      }
      
      // Add language mixing if appropriate
      if (guardianProfile.primaryLanguage !== 'English') {
        enhancedResponse = this.culturalManager.addLanguageMixing(
          enhancedResponse,
          guardianProfile.education || 'secondary',
          guardianEmotionalState
        );
      }
      
      return {
        enhancedText: enhancedResponse,
        emotionalState: guardianEmotionalState,
        culturalElements: this.extractCulturalElements(enhancedResponse),
        responseDelay: this.speechEngine.calculateResponseDelay(enhancedResponse, guardianEmotionalState)
      };
      
    } catch (error) {
      console.error('❌ Guardian dialogue enhancement error:', error);
      return {
        enhancedText: baseResponse || "I'm very concerned about this situation.",
        emotionalState: 'anxious',
        culturalElements: [],
        responseDelay: 1000
      };
    }
  }

  /**
   * Generate enhanced system prompt with dialogue context
   */
  enhanceSystemPrompt(basePrompt, patientProfile, conversationState) {
    const emotionalState = this.emotionalManager.currentState;
    const intensity = this.emotionalManager.stateIntensity;
    
    let enhancedPrompt = basePrompt;
    
    // Add current emotional state context
    enhancedPrompt += `\n\nCURRENT DIALOGUE STATE:
- Emotional state: ${emotionalState} (intensity: ${intensity.toFixed(1)}/1.0)
- Conversation duration: ${Math.round((Date.now() - this.conversationContext.startTime) / 60000)} minutes
- Interactions: ${this.conversationContext.interactions}`;

    // Add speech pattern instructions
    if (emotionalState !== 'calm') {
      const speechPatterns = this.emotionalManager.getCurrentSpeechPatterns();
      enhancedPrompt += `\n\nSPEECH PATTERNS TO USE:
- Rate: ${speechPatterns.rate || 'normal'}
- Include natural hesitations and disfluencies
- Show emotional state through speech patterns`;
      
      if (speechPatterns.pauses) {
        enhancedPrompt += `\n- Include natural pauses and interruptions`;
      }
      if (speechPatterns.repetition) {
        enhancedPrompt += `\n- Use natural repetition when anxious`;
      }
    }

    // Add cultural context
    if (patientProfile.culturalBackground?.includes('kenyan')) {
      enhancedPrompt += `\n\nCULTURAL SPEECH ELEMENTS:
- Occasionally mix English with Kiswahili phrases naturally
- Reference family, community, or traditional medicine when appropriate
- Show respect for medical authority while expressing concerns
- Use storytelling approach rather than direct answers sometimes`;
      
      if (patientProfile.education === 'primary') {
        enhancedPrompt += `\n- Use simpler English, more Kiswahili mixing`;
      }
    }

    // Add physical cues
    const physicalCues = this.emotionalManager.getCurrentPhysicalCues();
    if (physicalCues.length > 0) {
      enhancedPrompt += `\n\nPHYSICAL EXPRESSIONS TO SHOW:
${physicalCues.map(cue => `- ${cue}`).join('\n')}`;
    }

    enhancedPrompt += `\n\nIMPORTANT: Keep responses conversational and natural (50-150 words). Show don't tell emotions through speech patterns.`;

    return enhancedPrompt;
  }

  /**
   * Update conversation context with new interaction
   */
  updateConversationContext(conversationHistory) {
    this.conversationContext.duration = Date.now() - this.conversationContext.startTime;
    this.conversationContext.interactions = conversationHistory.length;
    
    // Analyze recent interactions for emotional progression
    const recentMessages = conversationHistory.slice(-5);
    const studentMessages = recentMessages.filter(msg => msg.sender === 'student');
    
    // Check for repeated questions (might cause frustration)
    const lastQuestions = studentMessages.slice(-3).map(msg => msg.message.toLowerCase());
    this.conversationContext.repeatQuestions = this.hasRepeatedQuestions(lastQuestions);
    
    // Check conversation flow
    this.conversationContext.conversationFlow = this.analyzeConversationFlow(conversationHistory);
  }

  /**
   * Determine guardian emotional state based on context
   */
  determineGuardianEmotionalState(guardianProfile, situation, context) {
    let baseState = guardianProfile.anxietyLevel || 'concerned';
    
    // Escalate based on conversation context
    if (context.duration > 900000) { // 15 minutes
      baseState = 'frustrated';
    }
    
    if (situation === 'diagnosis_news') {
      baseState = 'anxious';
    }
    
    if (situation === 'treatment_discussion') {
      baseState = 'concerned';
    }
    
    return baseState;
  }

  /**
   * Extract cultural elements used in response
   */
  extractCulturalElements(text) {
    const elements = [];
    const lowerText = text.toLowerCase();
    
    // Check for Kiswahili words
    const kiswahiliWords = ['daktari', 'pole', 'asante', 'homa', 'maumivu', 'tumbo'];
    kiswahiliWords.forEach(word => {
      if (lowerText.includes(word)) {
        elements.push(`kiswahili:${word}`);
      }
    });
    
    // Check for cultural references
    if (lowerText.includes('traditional') || lowerText.includes('grandmother') || lowerText.includes('village')) {
      elements.push('cultural:traditional_reference');
    }
    
    if (lowerText.includes('family') || lowerText.includes('mother') || lowerText.includes('children')) {
      elements.push('cultural:family_oriented');
    }
    
    return elements;
  }

  /**
   * Analyze conversation flow patterns
   */
  analyzeConversationFlow(conversationHistory) {
    const flow = {
      questionsAsked: 0,
      informationGiven: 0,
      emotionalSupport: 0,
      medicalTermsUsed: 0,
      culturalReferences: 0
    };
    
    conversationHistory.forEach(msg => {
      const text = msg.message.toLowerCase();
      
      if (msg.sender === 'student') {
        if (text.includes('?')) flow.questionsAsked++;
        if (text.includes('understand') || text.includes('sorry') || text.includes('worry')) {
          flow.emotionalSupport++;
        }
      } else if (msg.sender === 'patient' || msg.sender === 'guardian') {
        if (text.length > 100) flow.informationGiven++;
        if (text.includes('family') || text.includes('traditional')) {
          flow.culturalReferences++;
        }
      }
    });
    
    return flow;
  }

  /**
   * Check for repeated questions that might cause frustration
   */
  hasRepeatedQuestions(questions) {
    if (questions.length < 2) return false;
    
    const similarities = [];
    for (let i = 0; i < questions.length - 1; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const similarity = this.calculateSimilarity(questions[i], questions[j]);
        if (similarity > 0.7) similarities.push(similarity);
      }
    }
    
    return similarities.length > 0;
  }

  /**
   * Simple similarity calculator for questions
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Reset conversation context for new simulation
   */
  resetContext() {
    this.conversationContext = {
      duration: 0,
      interactions: 0,
      startTime: Date.now(),
      culturalElementsUsed: [],
      emotionalJourney: []
    };
    
    this.emotionalManager.reset();
  }

  /**
   * Get conversation insights for feedback
   */
  getConversationInsights() {
    return {
      emotionalJourney: this.conversationContext.emotionalJourney,
      culturalElements: this.conversationContext.culturalElementsUsed,
      conversationFlow: this.conversationContext.conversationFlow,
      totalDuration: this.conversationContext.duration,
      totalInteractions: this.conversationContext.interactions
    };
  }
}

module.exports = DialogueEnhancer;