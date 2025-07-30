// ai-patient-sim-core-services/simulation-service/src/services/templateSimulationEngine.js
const TemplateCaseService = require('./templateCaseService');
const OpenRouterService = require('./openRouterService');
const DialogueEnhancer = require('./dialogue/dialogueEnhancer');

class TemplateSimulationEngine {
  constructor() {
    this.templateCaseService = new TemplateCaseService();
    this.openRouterService = new OpenRouterService();
    this.dialogueEnhancer = new DialogueEnhancer();
  }

  /**
   * Initialize a new simulation from template
   */
  async initializeSimulation(caseId, userId, userRole) {
    try {
      const caseData = await this.templateCaseService.getCaseById(caseId);
      
      // Build system prompt from template
      const systemPrompt = this.templateCaseService.buildSystemPrompt(caseData);
      
      // Create initial simulation state
      const simulationState = {
        caseId,
        userId,
        userRole,
        caseData,
        systemPrompt,
        conversationHistory: [],
        clinicalActions: [],
        evaluationCriteria: this.templateCaseService.getEvaluationCriteria(caseData),
        simulationTriggers: this.templateCaseService.getSimulationTriggers(caseData),
        sessionMetrics: {
          startTime: new Date(),
          messageCount: 0,
          clinicalActionsCount: 0
        },
        learningProgress: {
          objectivesCompleted: [],
          clinicalSkillsAssessed: [],
          diagnosticAccuracy: 0,
          communicationScore: 0,
          overallProgress: 0
        }
      };

      // Generate initial patient presentation
      const initialPrompt = caseData.initial_prompt || 
        "You are now interacting with a virtual patient. Begin by asking your clinical questions.";
      
      const initialResponse = await this.generatePatientResponse(
        simulationState,
        initialPrompt,
        true // isInitial
      );

      // Add initial response to conversation
      if (initialResponse.response) {
        simulationState.conversationHistory.push({
          sender: 'patient',
          message: initialResponse.response,
          messageType: 'initial_presentation',
          timestamp: new Date(),
          clinicalInfo: initialResponse.clinicalInfo
        });
        simulationState.sessionMetrics.messageCount++;
      }

      return simulationState;
    } catch (error) {
      console.error('❌ Error initializing template simulation:', error);
      throw error;
    }
  }

  /**
   * Generate patient response using template data
   */
  async generatePatientResponse(simulationState, userMessage, isInitial = false) {
    try {
      const { caseData, systemPrompt, conversationHistory } = simulationState;
      
      // Build conversation context
      const conversationContext = this.buildConversationContext(
        conversationHistory,
        userMessage,
        isInitial
      );

      // Check for simulation triggers
      const triggerResponse = this.checkSimulationTriggers(
        userMessage,
        simulationState.simulationTriggers
      );

      if (triggerResponse) {
        return {
          response: triggerResponse.response,
          triggerActivated: triggerResponse.trigger,
          clinicalInfo: null
        };
      }

      // Generate AI response
      const aiResponse = await this.openRouterService.generateResponse({
        system: systemPrompt,
        messages: conversationContext,
        temperature: 0.7,
        maxTokens: 500
      });

      // Enhance response with dialogue improvements
      const enhancedResponse = await this.dialogueEnhancer.enhanceResponse(
        aiResponse,
        caseData,
        conversationHistory
      );

      // Extract clinical information revealed
      const clinicalInfo = this.extractClinicalInformation(
        userMessage,
        enhancedResponse.response,
        caseData
      );

      return {
        response: enhancedResponse.response,
        clinicalInfo,
        dialogueMetadata: enhancedResponse.metadata
      };
    } catch (error) {
      console.error('❌ Error generating template patient response:', error);
      throw error;
    }
  }

  /**
   * Build conversation context for AI
   */
  buildConversationContext(conversationHistory, currentMessage, isInitial) {
    const context = [];

    if (isInitial) {
      context.push({
        role: 'user',
        content: 'Please provide your initial presentation as the patient. Introduce yourself naturally and present your chief complaint.'
      });
    } else {
      // Add recent conversation history
      const recentHistory = conversationHistory.slice(-10);
      
      recentHistory.forEach(msg => {
        if (msg.sender === 'student') {
          context.push({
            role: 'user',
            content: msg.message
          });
        } else if (msg.sender === 'patient') {
          context.push({
            role: 'assistant',
            content: msg.message
          });
        }
      });

      // Add current user message
      context.push({
        role: 'user',
        content: currentMessage
      });
    }

    return context;
  }

  /**
   * Check if user message triggers any simulation events
   */
  checkSimulationTriggers(userMessage, triggers) {
    if (!triggers) return null;

    const messageLower = userMessage.toLowerCase();

    // Check end session trigger
    if (triggers.end_session && 
        messageLower.includes(triggers.end_session.condition_keyword)) {
      return {
        trigger: 'end_session',
        response: triggers.end_session.patient_response
      };
    }

    // Check invalid input trigger
    if (triggers.invalid_input && this.isInvalidInput(userMessage)) {
      return {
        trigger: 'invalid_input',
        response: triggers.invalid_input.response
      };
    }

    return null;
  }

  /**
   * Check if user input is invalid or inappropriate
   */
  isInvalidInput(message) {
    const invalidPatterns = [
      /^[^a-zA-Z]*$/, // Only symbols/numbers
      /(.)\1{10,}/, // Repeated characters
      /^.{1,2}$/ // Too short
    ];

    return invalidPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Extract clinical information revealed in the conversation
   */
  extractClinicalInformation(userQuestion, patientResponse, caseData) {
    const clinicalInfo = {};
    const questionLower = userQuestion.toLowerCase();
    const responseLower = patientResponse.toLowerCase();
    const clinicalDossier = caseData.clinical_dossier;

    // History of presenting illness
    if (questionLower.includes('pain') || questionLower.includes('symptom')) {
      if (clinicalDossier.history_of_presenting_illness) {
        const hpi = clinicalDossier.history_of_presenting_illness;
        if (responseLower.includes('day') || responseLower.includes('week')) {
          clinicalInfo.onset = hpi.onset;
        }
        if (responseLower.includes('severe') || responseLower.includes('pain')) {
          clinicalInfo.severity = hpi.severity;
        }
        if (responseLower.includes('location') || questionLower.includes('where')) {
          clinicalInfo.location = hpi.location;
        }
      }
    }

    // Review of systems
    if (questionLower.includes('fever') || questionLower.includes('nausea')) {
      if (clinicalDossier.review_of_systems) {
        clinicalInfo.reviewOfSystems = {
          positive: clinicalDossier.review_of_systems.positive,
          negative: clinicalDossier.review_of_systems.negative
        };
      }
    }

    // Past medical history
    if (questionLower.includes('history') || questionLower.includes('medical')) {
      clinicalInfo.pastMedicalHistory = clinicalDossier.past_medical_history;
    }

    // Medications
    if (questionLower.includes('medication') || questionLower.includes('drug')) {
      clinicalInfo.medications = clinicalDossier.medications;
    }

    // Allergies
    if (questionLower.includes('allerg')) {
      clinicalInfo.allergies = clinicalDossier.allergies;
    }

    // Social history
    if (questionLower.includes('smoke') || questionLower.includes('drink') || 
        questionLower.includes('social')) {
      clinicalInfo.socialHistory = clinicalDossier.social_history;
    }

    return Object.keys(clinicalInfo).length > 0 ? clinicalInfo : null;
  }

  /**
   * Evaluate student performance against template criteria
   */
  evaluatePerformance(simulationState) {
    const { conversationHistory, clinicalActions, evaluationCriteria, caseData } = simulationState;
    
    const evaluation = {};
    const totalCriteria = Object.keys(evaluationCriteria).length;
    let totalScore = 0;

    // Evaluate each criterion
    Object.entries(evaluationCriteria).forEach(([criterion, description]) => {
      const score = this.evaluateCriterion(
        criterion,
        description,
        conversationHistory,
        clinicalActions,
        caseData
      );
      
      evaluation[criterion] = {
        description,
        score,
        feedback: this.generateCriterionFeedback(criterion, score, description)
      };
      
      totalScore += score;
    });

    // Calculate overall score
    const overallScore = Math.round(totalScore / totalCriteria);

    return {
      overallScore,
      criteriaEvaluation: evaluation,
      recommendations: this.generateRecommendations(evaluation, caseData),
      strengths: this.identifyStrengths(evaluation),
      improvementAreas: this.identifyImprovementAreas(evaluation)
    };
  }

  /**
   * Evaluate individual criterion
   */
  evaluateCriterion(criterion, description, conversationHistory, clinicalActions, caseData) {
    const studentMessages = conversationHistory.filter(msg => msg.sender === 'student');
    const allStudentText = studentMessages.map(msg => msg.message).join(' ').toLowerCase();

    // Basic scoring based on keyword matching and conversation analysis
    let score = 50; // Base score

    switch (criterion) {
      case 'History_Taking':
        if (allStudentText.includes('pain') || allStudentText.includes('symptom')) score += 10;
        if (allStudentText.includes('when') || allStudentText.includes('onset')) score += 10;
        if (allStudentText.includes('how long') || allStudentText.includes('duration')) score += 10;
        if (allStudentText.includes('worse') || allStudentText.includes('better')) score += 10;
        if (studentMessages.length >= 5) score += 10;
        break;

      case 'Risk_Factor_Assessment':
        if (allStudentText.includes('history') || allStudentText.includes('family')) score += 15;
        if (allStudentText.includes('smoke') || allStudentText.includes('drink')) score += 15;
        if (allStudentText.includes('medication') || allStudentText.includes('allerg')) score += 10;
        if (allStudentText.includes('work') || allStudentText.includes('environment')) score += 10;
        break;

      case 'Differential_Diagnosis_Questioning':
        const diagnosisRelatedQuestions = studentMessages.filter(msg => 
          msg.message.toLowerCase().includes('could') || 
          msg.message.toLowerCase().includes('possible') ||
          msg.message.toLowerCase().includes('rule out')
        );
        score += Math.min(20, diagnosisRelatedQuestions.length * 5);
        break;

      case 'Communication_and_Empathy':
        if (allStudentText.includes('understand') || allStudentText.includes('sorry')) score += 15;
        if (allStudentText.includes('concern') || allStudentText.includes('worry')) score += 15;
        if (allStudentText.includes('help') || allStudentText.includes('support')) score += 10;
        const politeWords = (allStudentText.match(/please|thank|sorry/g) || []).length;
        score += Math.min(10, politeWords * 2);
        break;

      case 'Clinical_Urgency':
        if (allStudentText.includes('urgent') || allStudentText.includes('emergency')) score += 20;
        if (allStudentText.includes('test') || allStudentText.includes('exam')) score += 15;
        if (clinicalActions.length > 0) score += 15;
        break;

      default:
        // Generic evaluation
        score += Math.min(20, studentMessages.length * 2);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate feedback for specific criterion
   */
  generateCriterionFeedback(criterion, score, description) {
    if (score >= 80) {
      return `Excellent performance in ${criterion.replace(/_/g, ' ').toLowerCase()}. ${description}`;
    } else if (score >= 60) {
      return `Good approach to ${criterion.replace(/_/g, ' ').toLowerCase()}. Consider expanding your inquiry. ${description}`;
    } else {
      return `${criterion.replace(/_/g, ' ')} needs improvement. Focus on: ${description}`;
    }
  }

  /**
   * Generate overall recommendations
   */
  generateRecommendations(evaluation, caseData) {
    const recommendations = [];
    const lowScoreCriteria = Object.entries(evaluation)
      .filter(([_, data]) => data.score < 70)
      .map(([criterion, _]) => criterion);

    if (lowScoreCriteria.includes('History_Taking')) {
      recommendations.push('Practice systematic history taking using OPQRST format');
    }

    if (lowScoreCriteria.includes('Communication_and_Empathy')) {
      recommendations.push('Focus on empathetic communication and active listening');
    }

    if (lowScoreCriteria.includes('Clinical_Urgency')) {
      recommendations.push('Develop skills in recognizing clinical urgency and appropriate escalation');
    }

    // Add case-specific recommendations
    const specialty = caseData.case_metadata.specialty;
    recommendations.push(`Review ${specialty} clinical guidelines for similar cases`);

    return recommendations;
  }

  /**
   * Identify strengths from evaluation
   */
  identifyStrengths(evaluation) {
    return Object.entries(evaluation)
      .filter(([_, data]) => data.score >= 80)
      .map(([criterion, data]) => ({
        area: criterion.replace(/_/g, ' '),
        score: data.score,
        note: 'Strong performance demonstrated'
      }));
  }

  /**
   * Identify improvement areas
   */
  identifyImprovementAreas(evaluation) {
    return Object.entries(evaluation)
      .filter(([_, data]) => data.score < 70)
      .map(([criterion, data]) => ({
        area: criterion.replace(/_/g, ' '),
        score: data.score,
        suggestion: data.feedback
      }));
  }
}

module.exports = TemplateSimulationEngine;