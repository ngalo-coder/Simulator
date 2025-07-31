// ai-patient-sim-core-services/simulation-service/src/services/templateSimulationEngine.js - OPTIMIZED
const TemplateCaseService = require('./templateCaseService');
const OpenRouterService = require('./openRouterService');

class TemplateSimulationEngine {
  constructor() {
    this.templateCaseService = new TemplateCaseService();
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Initialize a new simulation from template
   */
  async initializeSimulation(caseId, userId, userRole) {
    try {
      console.log(`🏥 Initializing template simulation: ${caseId} for user ${userId}`);

      const caseData = await this.templateCaseService.getCaseById(caseId);

      // Create initial simulation state
      const simulationState = {
        caseId,
        userId,
        userRole,
        caseData,
        conversationHistory: [],
        clinicalActions: [],
        evaluationCriteria: this.templateCaseService.getEvaluationCriteria(caseData),
        simulationTriggers: this.templateCaseService.getSimulationTriggers(caseData),
        sessionMetrics: {
          startTime: new Date(),
          messageCount: 0,
          clinicalActionsCount: 0,
        },
        learningProgress: {
          objectivesCompleted: [],
          clinicalSkillsAssessed: [],
          diagnosticAccuracy: 0,
          communicationScore: 0,
          overallProgress: 0,
        },
        status: 'active',
      };

      // Generate simple initial presentation without complex AI processing
      const initialResponse = this.generateSimpleInitialPresentation(caseData);

      // Add initial response to conversation
      simulationState.conversationHistory.push({
        sender: this.determineInitialSender(caseData.patient_persona),
        message: initialResponse,
        messageType: 'initial_presentation',
        timestamp: new Date(),
      });
      simulationState.sessionMetrics.messageCount++;

      console.log(`✅ Template simulation initialized: ${caseId}`);
      return simulationState;
    } catch (error) {
      console.error('❌ Error initializing template simulation:', error);
      throw error;
    }
  }

  /**
   * Generate simple initial presentation without AI call
   */
  generateSimpleInitialPresentation(caseData) {
    const { patient_persona } = caseData;

    // Create deterministic initial response based on template
    if (patient_persona.speaks_for !== 'Self') {
      // Guardian speaking for child
      return `Hello doctor, I'm the ${patient_persona.speaks_for.toLowerCase()} and this is ${
        patient_persona.name
      }. We're here because ${
        patient_persona.chief_complaint.toLowerCase()
      }. I'm quite ${patient_persona.emotional_tone.toLowerCase()} about this.`;
    } else {
      // Adult patient speaking
      return `Hello doctor, I'm ${patient_persona.name}. I came to see you because ${
        patient_persona.chief_complaint.toLowerCase()
      }. I'm feeling ${patient_persona.emotional_tone.toLowerCase()} about this.`;
    }
  }

  /**
   * Generate patient response - OPTIMIZED VERSION
   */
  async generatePatientResponse(simulationState, userMessage) {
    try {
      console.log(`💬 Generating template response for: ${userMessage.substring(0, 50)}...`);

      const { caseData } = simulationState;

      // Quick trigger check first
      const triggerResponse = this.checkSimulationTriggers(
        userMessage,
        simulationState.simulationTriggers
      );

      if (triggerResponse) {
        return {
          response: triggerResponse.response,
          triggerActivated: triggerResponse.trigger,
          clinicalInfo: null,
        };
      }

      // Extract clinical information BEFORE AI call to optimize prompt
      const relevantClinicalInfo = this.extractRelevantClinicalInfo(userMessage, caseData);

      // Build optimized, focused prompt
      const optimizedPrompt = this.buildOptimizedPrompt(
        caseData,
        userMessage,
        relevantClinicalInfo
      );

      // Create simplified simulation object for OpenRouter
      const simplifiedSimulation = {
        patientPersona: {
          patient: {
            name: caseData.patient_persona.name,
            age: caseData.patient_persona.age,
            gender: caseData.patient_persona.gender,
          },
          currentCondition: caseData.clinical_dossier.hidden_diagnosis,
          personality: {
            emotionalTone: caseData.patient_persona.emotional_tone,
          },
          chiefComplaint: caseData.patient_persona.chief_complaint,
        },
        conversationHistory: simulationState.conversationHistory.slice(-6), // Only last 6 messages
        difficulty: caseData.case_metadata.difficulty.toLowerCase(),
        systemPrompt: optimizedPrompt,
      };

      // Generate AI response with timeout protection
      const aiResponse = await Promise.race([
        this.openRouterService.generatePatientResponse(simplifiedSimulation, userMessage),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error('AI response timeout')), 15000) // 15 second timeout
        ),
      ]);

      return {
        response:
          aiResponse.patientResponse || aiResponse.response || this.getFallbackResponse(caseData),
        clinicalInfo: relevantClinicalInfo,
        usage: aiResponse.usage,
      };
    } catch (error) {
      console.error('❌ Error generating template patient response:', error);

      // Immediate fallback response
      return {
        response: this.getFallbackResponse(simulationState.caseData, userMessage),
        clinicalInfo: this.extractRelevantClinicalInfo(userMessage, simulationState.caseData),
        error: error.message,
      };
    }
  }

  /**
   * Build optimized prompt - much shorter and focused
   */
  buildOptimizedPrompt(caseData, userMessage, clinicalInfo) {
    const { patient_persona, clinical_dossier } = caseData;

    let prompt = `CRITICAL: You are ONLY the PATIENT - ${patient_persona.name}, ${patient_persona.age} years old.

You are NOT a doctor, clinician, or medical professional. You are the PATIENT who needs help.

Your situation:
- You have: ${patient_persona.chief_complaint}
- You feel: ${patient_persona.emotional_tone.toLowerCase()}
- Your condition: ${clinical_dossier.hidden_diagnosis}

The doctor just asked: "${userMessage}"

INFORMATION YOU CAN SHARE (only if directly asked):`;

    if (clinicalInfo) {
      Object.entries(clinicalInfo).forEach(([category, info]) => {
        prompt += `\n- ${category}: ${typeof info === 'object' ? JSON.stringify(info) : info}`;
      });
    }

    prompt += `\n\nPATIENT RESPONSE RULES:
- You are the PATIENT seeking help, NOT the doctor
- Answer from YOUR perspective as the patient
- Keep response SHORT (1-2 sentences)
- Show you're ${patient_persona.emotional_tone.toLowerCase()}
- Only answer what the doctor asked you
- Use simple, natural patient language
- NEVER give medical advice or act like a doctor

You are here because you need the doctor's help. Respond only as the patient would.`;

    return prompt;
  }

  /**
   * Fast clinical information extraction
   */
  extractRelevantClinicalInfo(question, caseData) {
    const questionLower = question.toLowerCase();
    const clinicalDossier = caseData.clinical_dossier;
    const relevantInfo = {};

    // Quick keyword matching for common questions
    const keywordMap = {
      // Pain/symptom questions
      'pain|hurt|feel|symptom': () => {
        if (clinicalDossier.history_of_presenting_illness) {
          relevantInfo.symptoms = {
            character: clinicalDossier.history_of_presenting_illness.character,
            severity: clinicalDossier.history_of_presenting_illness.severity,
            location: clinicalDossier.history_of_presenting_illness.location,
          };
        }
      },

      // Timing questions
      'when|start|begin|long': () => {
        if (clinicalDossier.history_of_presenting_illness?.onset) {
          relevantInfo.timing = clinicalDossier.history_of_presenting_illness.onset;
        }
      },

      // Medical history
      'history|medical|before|previous': () => {
        relevantInfo.pastHistory = clinicalDossier.past_medical_history;
      },

      // Medications
      'medication|drug|pill|medicine': () => {
        relevantInfo.medications = clinicalDossier.medications;
      },

      // Family history
      'family|parent|father|mother': () => {
        relevantInfo.familyHistory = clinicalDossier.family_history;
      },
    };

    // Check keywords and extract relevant info
    Object.entries(keywordMap).forEach(([keywords, extractor]) => {
      const keywordRegex = new RegExp(keywords, 'i');
      if (keywordRegex.test(questionLower)) {
        extractor();
      }
    });

    return Object.keys(relevantInfo).length > 0 ? relevantInfo : null;
  }

  /**
   * Get immediate fallback response
   */
  getFallbackResponse(caseData, userMessage = '') {
    const { patient_persona } = caseData;
    const tone = patient_persona.emotional_tone.toLowerCase();

    const fallbackResponses = {
      anxious: [
        "I'm sorry doctor, I'm quite anxious right now. Could you repeat that?",
        "I'm worried about what's happening to me. What did you ask?",
        "I'm feeling very nervous. Can you ask me again?",
      ],
      scared: [
        "I'm scared doctor. Could you please repeat your question?",
        "I'm frightened and didn't catch what you said.",
        "I'm really scared right now. What did you want to know?",
      ],
      calm: [
        "I'm sorry doctor, could you repeat that question?",
        "I didn't quite understand. Can you ask me again?",
        'Could you please ask that again?',
      ],
      worried: [
        "I'm worried and missed what you said. Can you ask again?",
        "I'm concerned about my condition. What did you ask?",
        "I'm feeling worried. Could you repeat that?",
      ],
      frustrated: [
        "I'm getting frustrated with how I'm feeling. What did you ask?",
        "I'm having trouble concentrating. Can you repeat that?",
        "I'm frustrated about my symptoms. What did you want to know?",
      ],
    };

    const responses = fallbackResponses[tone] || fallbackResponses['calm'];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Fast trigger checking
   */
  checkSimulationTriggers(userMessage, triggers) {
    if (!triggers) return null;

    const messageLower = userMessage.toLowerCase();

    // Check end session trigger
    if (
      triggers.end_session &&
      messageLower.includes(triggers.end_session.condition_keyword.toLowerCase())
    ) {
      return {
        trigger: 'end_session',
        response: triggers.end_session.patient_response,
      };
    }

    // Check for diagnosis-related keywords
    const diagnosisKeywords = [
      'diagnosis',
      'condition',
      'disease',
      'what do i have',
      'what is wrong',
    ];
    if (diagnosisKeywords.some((keyword) => messageLower.includes(keyword))) {
      return {
        trigger: 'diagnosis_discussion',
        response:
          triggers.end_session?.patient_response ||
          'What do you think might be causing my symptoms, doctor?',
      };
    }

    return null;
  }

  /**
   * Determine initial speaker
   */
  determineInitialSender(patientPersona) {
    if (patientPersona.speaks_for !== 'Self') {
      const patientAge = parseInt(patientPersona.patient_age_for_communication) || 18;
      return patientAge < 12 ? 'guardian' : 'patient';
    }
    return 'patient';
  }

  /**
   * Simplified clinical action processing
   */
  async performClinicalAction(simulationState, action, details) {
    try {
      console.log(`🔬 Template clinical action: ${action} - ${details}`);

      const timestamp = new Date();

      // Create clinical action with immediate results
      const clinicalAction = {
        action,
        details: details || '',
        timestamp,
        appropriate: this.isActionAppropriate(action, simulationState.caseData),
        result: this.generateQuickActionResult(action, details, simulationState.caseData),
      };

      // Add to simulation state
      simulationState.clinicalActions.push(clinicalAction);
      simulationState.sessionMetrics.clinicalActionsCount++;

      // Generate quick system message
      const systemMessage = this.generateQuickSystemMessage(clinicalAction);

      simulationState.conversationHistory.push({
        sender: 'system',
        message: systemMessage,
        messageType: 'clinical_action',
        timestamp,
        actionDetails: clinicalAction,
      });

      // Quick progress update
      this.updateLearningProgressQuick(simulationState, clinicalAction);

      return {
        success: true,
        action: clinicalAction,
        systemMessage,
        learningProgress: simulationState.learningProgress,
      };
    } catch (error) {
      console.error('❌ Error performing template clinical action:', error);
      throw error;
    }
  }

  /**
   * Quick action appropriateness check
   */
  isActionAppropriate(action, caseData) {
    // Simplified appropriateness logic
    const specialty = caseData.case_metadata.specialty;
    const commonActions = ['history_taking', 'physical_exam', 'diagnosis', 'treatment_plan'];
    const diagnosticActions = ['order_labs', 'order_imaging'];

    if (commonActions.includes(action)) return true;
    if (diagnosticActions.includes(action) && specialty !== 'Pediatrics') return true;

    return false;
  }

  /**
   * Generate quick action results
   */
  generateQuickActionResult(action, details, caseData) {
    const condition = caseData.clinical_dossier.hidden_diagnosis;

    const quickResults = {
      history_taking: {
        category: 'history',
        information: 'Additional clinical history obtained',
        relevance: 'Provides important context for diagnosis',
      },
      physical_exam: {
        category: 'physical_exam',
        findings: this.getQuickExamFindings(condition),
        significance: 'Physical examination findings documented',
      },
      order_labs: {
        category: 'laboratory',
        results: this.getQuickLabResults(condition),
        interpretation: 'Laboratory results available for review',
      },
      diagnosis: {
        category: 'diagnosis',
        assessment: details,
        accuracy: this.assessDiagnosisQuick(details, condition),
      },
      treatment_plan: {
        category: 'treatment',
        plan: details,
        appropriateness: 'Treatment plan documented',
      },
    };

    return (
      quickResults[action] || {
        category: 'general',
        status: 'completed',
        details: `${action} performed: ${details}`,
      }
    );
  }

  /**
   * Quick exam findings
   */
  getQuickExamFindings(condition) {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('myocardial') || conditionLower.includes('heart')) {
      return 'Patient appears diaphoretic, tachycardic, no murmurs heard';
    }
    if (conditionLower.includes('respiratory') || conditionLower.includes('cough')) {
      return 'Clear lung fields, no respiratory distress at rest';
    }
    if (conditionLower.includes('abdominal') || conditionLower.includes('pain')) {
      return 'Abdomen soft, tender in affected area';
    }

    return 'Physical examination completed, findings documented';
  }

  /**
   * Quick lab results
   */
  getQuickLabResults(condition) {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('myocardial')) {
      return 'Elevated cardiac enzymes, ECG shows changes consistent with presentation';
    }
    if (conditionLower.includes('infection')) {
      return 'Elevated white blood cell count, inflammatory markers raised';
    }

    return 'Laboratory results within expected parameters for condition';
  }

  /**
   * Quick diagnosis assessment
   */
  assessDiagnosisQuick(userDiagnosis, correctDiagnosis) {
    const similarity = this.calculateSimpleSimilarity(userDiagnosis, correctDiagnosis);

    if (similarity > 0.7) {
      return { level: 'accurate', score: 90, feedback: 'Good diagnostic accuracy' };
    } else if (similarity > 0.4) {
      return { level: 'partial', score: 70, feedback: 'Partially correct' };
    } else {
      return { level: 'needs_review', score: 50, feedback: 'Consider additional findings' };
    }
  }

  /**
   * Simple similarity calculation
   */
  calculateSimpleSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter((word) =>
      words2.some((w) => w.includes(word) || word.includes(w))
    );
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Quick system message generation
   */
  generateQuickSystemMessage(clinicalAction) {
    const { action, details, result } = clinicalAction;
    let message = `✅ ${action.replace('_', ' ').toUpperCase()}: ${details}`;

    if (result.findings) {
      message += `\n📋 Findings: ${result.findings}`;
    }
    if (result.results) {
      message += `\n📊 Results: ${result.results}`;
    }

    return message;
  }

  /**
   * Quick learning progress update
   */
  updateLearningProgressQuick(simulationState, clinicalAction) {
    const { learningProgress } = simulationState;
    const { action, appropriate } = clinicalAction;

    // Simple progress calculation
    const completedActions = simulationState.clinicalActions.length;
    const appropriateActions = simulationState.clinicalActions.filter((a) => a.appropriate).length;

    learningProgress.overallProgress =
      completedActions > 0 ? Math.round((appropriateActions / completedActions) * 100) : 0;
  }

  /**
   * Fast performance evaluation
   */
  evaluatePerformance(simulationState) {
    const { conversationHistory, clinicalActions, evaluationCriteria } = simulationState;

    console.log(`📊 Quick evaluation for template simulation`);

    const evaluation = {};
    let totalScore = 0;
    const criteriaCount = Object.keys(evaluationCriteria).length;

    // Quick evaluation of each criterion
    Object.entries(evaluationCriteria).forEach(([criterion, description]) => {
      const score = this.quickEvaluateCriterion(criterion, conversationHistory, clinicalActions);

      evaluation[criterion] = {
        description,
        score,
        feedback: this.getQuickFeedback(criterion, score),
      };

      totalScore += score;
    });

    const overallScore = criteriaCount > 0 ? Math.round(totalScore / criteriaCount) : 0;

    return {
      overallScore,
      criteriaEvaluation: evaluation,
      recommendations: this.getQuickRecommendations(evaluation),
      strengths: Object.entries(evaluation)
        .filter(([_, data]) => data.score >= 80)
        .map(([criterion, _]) => criterion),
      improvementAreas: Object.entries(evaluation)
        .filter(([_, data]) => data.score < 70)
        .map(([criterion, _]) => criterion),
      sessionSummary: {
        totalMessages: conversationHistory.length,
        clinicalActionsPerformed: clinicalActions.length,
        appropriateActions: clinicalActions.filter((a) => a.appropriate).length,
        communicationQuality: this.quickAssessCommunication(conversationHistory),
      },
    };
  }

  /**
   * Quick criterion evaluation
   */
  quickEvaluateCriterion(criterion, conversationHistory, clinicalActions) {
    const studentMessages = conversationHistory.filter((msg) => msg.sender === 'student');
    const allText = studentMessages
      .map((msg) => msg.message)
      .join(' ')
      .toLowerCase();

    let score = 50; // Base score

    // Quick scoring based on keywords
    const scoringRules = {
      History_Taking: () => {
        const historyKeywords = ['pain', 'when', 'how long', 'where', 'what', 'describe'];
        const matches = historyKeywords.filter((k) => allText.includes(k)).length;
        return Math.min(50, matches * 8);
      },
      Communication_and_Empathy: () => {
        const empathyKeywords = ['understand', 'sorry', 'concern', 'help', 'thank'];
        const matches = empathyKeywords.filter((k) => allText.includes(k)).length;
        return Math.min(50, matches * 10);
      },
      Clinical_Urgency: () => {
        const urgencyKeywords = ['urgent', 'serious', 'emergency'];
        const hasActions = clinicalActions.length > 0;
        return (urgencyKeywords.some((k) => allText.includes(k)) ? 25 : 0) + (hasActions ? 25 : 0);
      },
    };

    const rule = scoringRules[criterion];
    if (rule) {
      score += rule();
    } else {
      // Generic scoring
      score += Math.min(30, studentMessages.length * 3);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Quick feedback generation
   */
  getQuickFeedback(criterion, score) {
    if (score >= 80) return `Excellent ${criterion.replace(/_/g, ' ').toLowerCase()}`;
    if (score >= 60)
      return `Good ${criterion.replace(/_/g, ' ').toLowerCase()}, room for improvement`;
    return `${criterion.replace(/_/g, ' ')} needs attention`;
  }

  /**
   * Quick recommendations
   */
  getQuickRecommendations(evaluation) {
    const lowScoreCriteria = Object.entries(evaluation)
      .filter(([_, data]) => data.score < 70)
      .map(([criterion, _]) => criterion);

    const recommendations = [];

    if (lowScoreCriteria.includes('History_Taking')) {
      recommendations.push('Practice systematic history taking');
    }
    if (lowScoreCriteria.includes('Communication_and_Empathy')) {
      recommendations.push('Focus on empathetic communication');
    }

    return recommendations;
  }

  /**
   * Quick communication assessment
   */
  quickAssessCommunication(conversationHistory) {
    const studentMessages = conversationHistory.filter((msg) => msg.sender === 'student');
    if (studentMessages.length === 0) return 0;

    let score = 0;
    studentMessages.forEach((msg) => {
      if (msg.message.includes('?')) score += 2;
      if (msg.message.includes('thank') || msg.message.includes('please')) score += 1;
      if (msg.message.length > 10) score += 1;
    });

    return Math.min(100, Math.round((score / studentMessages.length) * 10));
  }
}

module.exports = TemplateSimulationEngine;
