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
      console.log(`🏥 Initializing template simulation: ${caseId} for user ${userId}`);
      
      const caseData = await this.templateCaseService.getCaseById(caseId);
      
      // Build enhanced system prompt
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
        },
        status: 'active'
      };

      // Generate initial patient presentation
      const initialResponse = await this.generateInitialPresentation(simulationState);

      // Add initial response to conversation
      if (initialResponse.response) {
        simulationState.conversationHistory.push({
          sender: this.determineInitialSender(caseData.patient_persona),
          message: initialResponse.response,
          messageType: 'initial_presentation',
          timestamp: new Date(),
          clinicalInfo: initialResponse.clinicalInfo,
          dialogueMetadata: initialResponse.dialogueMetadata
        });
        simulationState.sessionMetrics.messageCount++;
      }

      console.log(`✅ Template simulation initialized: ${caseId}`);
      return simulationState;
    } catch (error) {
      console.error('❌ Error initializing template simulation:', error);
      throw error;
    }
  }

  /**
   * Generate initial patient presentation
   */
  async generateInitialPresentation(simulationState) {
    try {
      const { caseData } = simulationState;
      const { patient_persona } = caseData;

      // Create initial presentation prompt
      const initialPrompt = `You are ${patient_persona.name}, and you've just arrived at the medical facility. 
Naturally introduce yourself and present your chief complaint: "${patient_persona.chief_complaint}". 
Show your emotional state (${patient_persona.emotional_tone}) and provide a brief, realistic opening statement. 
Don't give away too much information yet - just what a real patient would say when first meeting a doctor.`;

      // Use OpenRouter to generate natural initial response
      const mockSimulation = this.createMockSimulationForAI(simulationState);
      const aiResponse = await this.openRouterService.generatePatientResponse(
        mockSimulation,
        initialPrompt
      );

      return {
        response: aiResponse.patientResponse || aiResponse.response,
        clinicalInfo: aiResponse.clinicalInfo || null,
        dialogueMetadata: aiResponse.dialogueMetadata || {}
      };
    } catch (error) {
      console.error('❌ Error generating initial presentation:', error);
      
      // Fallback to template-based initial response
      const { patient_persona } = simulationState.caseData;
      return {
        response: `Hello doctor, I'm ${patient_persona.name}. I'm here because ${patient_persona.chief_complaint}. I'm feeling quite ${patient_persona.emotional_tone.toLowerCase()} about this.`,
        clinicalInfo: null,
        dialogueMetadata: {}
      };
    }
  }

  /**
   * Generate patient response using template data and AI
   */
  async generatePatientResponse(simulationState, userMessage) {
    try {
      console.log(`💬 Generating template response for: ${userMessage.substring(0, 50)}...`);
      
      const { caseData, conversationHistory } = simulationState;

      // Check for simulation triggers first
      const triggerResponse = this.checkSimulationTriggers(
        userMessage,
        simulationState.simulationTriggers
      );

      if (triggerResponse) {
        return {
          response: triggerResponse.response,
          triggerActivated: triggerResponse.trigger,
          clinicalInfo: null,
          dialogueMetadata: {}
        };
      }

      // Extract what clinical information should be revealed
      const relevantClinicalInfo = this.templateCaseService.extractRelevantClinicalInfo(
        userMessage,
        caseData
      );

      // Create enhanced system prompt with current context
      const contextualPrompt = this.buildContextualPrompt(
        simulationState,
        userMessage,
        relevantClinicalInfo
      );

      // Generate AI response using the enhanced OpenRouter service
      const mockSimulation = this.createMockSimulationForAI(simulationState, contextualPrompt);
      const aiResponse = await this.openRouterService.generatePatientResponse(
        mockSimulation,
        userMessage
      );

      // Extract and format the response
      const patientResponse = aiResponse.patientResponse || aiResponse.response;
      
      // Enhance with dialogue system if available
      let enhancedResponse = patientResponse;
      try {
        const enhancement = this.dialogueEnhancer.enhancePatientResponse(
          patientResponse,
          caseData.patient_persona,
          conversationHistory,
          userMessage
        );
        enhancedResponse = enhancement.enhancedText || patientResponse;
      } catch (enhancementError) {
        console.warn('⚠️ Dialogue enhancement failed, using base response:', enhancementError.message);
      }

      return {
        response: enhancedResponse,
        clinicalInfo: relevantClinicalInfo,
        dialogueMetadata: aiResponse.dialogueMetadata || {},
        usage: aiResponse.usage
      };

    } catch (error) {
      console.error('❌ Error generating template patient response:', error);
      
      // Fallback response
      const fallbackResponses = [
        "I'm sorry, I didn't catch that. Could you ask me again?",
        "Can you please repeat your question?",
        "I'm not feeling great right now. What did you say?",
        "Sorry, I'm a bit distracted by how I'm feeling. Could you ask that again?"
      ];
      
      return {
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        clinicalInfo: null,
        dialogueMetadata: {},
        error: error.message
      };
    }
  }

  /**
   * Create mock simulation object for OpenRouter service compatibility
   */
  createMockSimulationForAI(simulationState, customPrompt = null) {
    const { caseData, conversationHistory } = simulationState;
    
    return {
      patientPersona: {
        patient: {
          name: caseData.patient_persona.name,
          age: caseData.patient_persona.age,
          gender: caseData.patient_persona.gender,
          presentation: caseData.patient_persona.chief_complaint
        },
        guardian: caseData.patient_persona.speaks_for !== "Self" ? {
          name: caseData.patient_persona.speaks_for,
          relationship: caseData.patient_persona.speaks_for,
          primaryLanguage: 'English'
        } : null,
        demographics: {
          location: caseData.case_metadata.location,
          primaryLanguage: 'English'
        },
        currentCondition: caseData.clinical_dossier.hidden_diagnosis,
        personality: {
          emotionalTone: caseData.patient_persona.emotional_tone,
          backgroundStory: caseData.patient_persona.background_story
        },
        culturalBackground: caseData.case_metadata.location?.toLowerCase().includes('kenya') ? 'kenyan_general' : 'general',
        chiefComplaint: caseData.patient_persona.chief_complaint
      },
      conversationHistory: conversationHistory,
      difficulty: caseData.case_metadata.difficulty.toLowerCase(),
      systemPrompt: customPrompt || simulationState.systemPrompt
    };
  }

  /**
   * Build contextual prompt with relevant clinical information
   */
  buildContextualPrompt(simulationState, userMessage, relevantClinicalInfo) {
    const { caseData } = simulationState;
    let contextualPrompt = simulationState.systemPrompt;

    if (relevantClinicalInfo) {
      contextualPrompt += `\n\nCONTEXT FOR THIS RESPONSE:
The student is asking about topics that relate to the following information from your clinical dossier:`;

      Object.entries(relevantClinicalInfo).forEach(([category, info]) => {
        contextualPrompt += `\n- ${category}: ${JSON.stringify(info, null, 2)}`;
      });

      contextualPrompt += `\n\nReveal this information naturally and appropriately based on the specific question asked. Don't volunteer information that wasn't directly asked for.`;
    }

    // Add emotional context
    contextualPrompt += `\n\nCURRENT EMOTIONAL STATE: ${caseData.patient_persona.emotional_tone}
Remember to show this emotional state in your response through your tone and manner of speaking.`;

    return contextualPrompt;
  }

  /**
   * Check if user message triggers any simulation events
   */
  checkSimulationTriggers(userMessage, triggers) {
    if (!triggers) return null;

    const messageLower = userMessage.toLowerCase();

    // Check end session trigger
    if (triggers.end_session && 
        messageLower.includes(triggers.end_session.condition_keyword.toLowerCase())) {
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

    // Check for diagnosis-related keywords that might end session
    const diagnosisKeywords = ['diagnosis', 'condition', 'disease', 'what do i have', 'what is wrong'];
    if (diagnosisKeywords.some(keyword => messageLower.includes(keyword))) {
      return {
        trigger: 'diagnosis_discussion',
        response: triggers.end_session?.patient_response || "What do you think might be causing my symptoms, doctor?"
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
   * Determine who should be the initial speaker (patient vs guardian)
   */
  determineInitialSender(patientPersona) {
    if (patientPersona.speaks_for !== "Self") {
      // If patient age is very young, guardian speaks first
      const patientAge = parseInt(patientPersona.patient_age_for_communication);
      if (patientAge < 12) {
        return 'guardian';
      }
      // For adolescents, might be mixed
      return Math.random() < 0.7 ? 'guardian' : 'patient';
    }
    return 'patient';
  }

  /**
   * Perform clinical action within template simulation
   */
  async performClinicalAction(simulationState, action, details) {
    try {
      console.log(`🔬 Template clinical action: ${action} - ${details}`);

      const { caseData } = simulationState;
      const timestamp = new Date();

      // Create clinical action record
      const clinicalAction = {
        action,
        details: details || '',
        timestamp,
        appropriate: this.evaluateActionAppropriateness(action, caseData),
        result: await this.generateActionResult(action, details, caseData)
      };

      // Add to simulation state
      simulationState.clinicalActions.push(clinicalAction);
      simulationState.sessionMetrics.clinicalActionsCount++;

      // Generate system feedback
      const systemMessage = this.generateActionSystemMessage(clinicalAction);
      
      simulationState.conversationHistory.push({
        sender: 'system',
        message: systemMessage,
        messageType: 'clinical_action',
        timestamp,
        actionDetails: clinicalAction
      });

      // Update learning progress
      this.updateLearningProgress(simulationState, clinicalAction);

      return {
        success: true,
        action: clinicalAction,
        systemMessage,
        learningProgress: simulationState.learningProgress
      };

    } catch (error) {
      console.error('❌ Error performing template clinical action:', error);
      throw error;
    }
  }

  /**
   * Evaluate if clinical action is appropriate for this case
   */
  evaluateActionAppropriateness(action, caseData) {
    const { case_metadata, clinical_dossier } = caseData;
    const specialty = case_metadata.specialty;
    const condition = clinical_dossier.hidden_diagnosis;

    // Define appropriate actions by specialty and condition
    const appropriateActions = {
      'Internal Medicine': ['history_taking', 'physical_exam', 'order_labs', 'order_imaging', 'diagnosis', 'treatment_plan'],
      'Pediatrics': ['history_taking', 'physical_exam', 'order_labs', 'diagnosis', 'treatment_plan'],
      'Emergency Medicine': ['history_taking', 'physical_exam', 'order_labs', 'order_imaging', 'diagnosis', 'treatment_plan'],
      'Family Medicine': ['history_taking', 'physical_exam', 'order_labs', 'diagnosis', 'treatment_plan']
    };

    const specialtyActions = appropriateActions[specialty] || appropriateActions['Internal Medicine'];
    return specialtyActions.includes(action);
  }

  /**
   * Generate realistic results for clinical actions
   */
  async generateActionResult(action, details, caseData) {
    const { clinical_dossier, patient_persona } = caseData;

    switch (action) {
      case 'history_taking':
        return {
          category: 'history',
          information: this.generateHistoryResult(details, clinical_dossier),
          relevance: 'Provides important clinical context'
        };

      case 'physical_exam':
        return {
          category: 'physical_exam',
          findings: this.generatePhysicalExamResult(details, clinical_dossier),
          significance: 'Physical examination completed'
        };

      case 'order_labs':
        return {
          category: 'laboratory',
          results: this.generateLabResult(details, clinical_dossier),
          interpretation: 'Laboratory results available for review'
        };

      case 'order_imaging':
        return {
          category: 'imaging',
          results: this.generateImagingResult(details, clinical_dossier),
          interpretation: 'Imaging study completed'
        };

      case 'diagnosis':
        return {
          category: 'diagnosis',
          assessment: details,
          accuracy: this.evaluateDiagnosticAccuracy(details, clinical_dossier.hidden_diagnosis)
        };

      case 'treatment_plan':
        return {
          category: 'treatment',
          plan: details,
          appropriateness: this.evaluateTreatmentAppropriateness(details, clinical_dossier.hidden_diagnosis)
        };

      default:
        return {
          category: 'general',
          status: 'completed',
          details: `${action} performed: ${details}`
        };
    }
  }

  /**
   * Generate history-taking results
   */
  generateHistoryResult(details, clinicalDossier) {
    const detailsLower = details.toLowerCase();
    const result = {};

    if (detailsLower.includes('pain') || detailsLower.includes('symptom')) {
      result.presentingIllness = clinicalDossier.history_of_presenting_illness;
    }

    if (detailsLower.includes('past') || detailsLower.includes('medical')) {
      result.pastMedicalHistory = clinicalDossier.past_medical_history;
    }

    if (detailsLower.includes('family')) {
      result.familyHistory = clinicalDossier.family_history;
    }

    if (detailsLower.includes('social') || detailsLower.includes('lifestyle')) {
      result.socialHistory = clinicalDossier.social_history;
    }

    if (detailsLower.includes('medication') || detailsLower.includes('drug')) {
      result.medications = clinicalDossier.medications;
      result.allergies = clinicalDossier.allergies;
    }

    return Object.keys(result).length > 0 ? result : { general: 'Additional history obtained' };
  }

  /**
   * Generate physical exam results
   */
  generatePhysicalExamResult(details, clinicalDossier) {
    const condition = clinicalDossier.hidden_diagnosis.toLowerCase();
    
    // Generate realistic findings based on condition
    const examFindings = {
      'acute myocardial infarction': {
        general: 'Patient appears diaphoretic and anxious',
        cardiovascular: 'Tachycardic, regular rhythm, no murmurs',
        respiratory: 'Clear lung fields, no distress',
        extremities: 'No peripheral edema'
      },
      'pneumonia': {
        general: 'Patient appears ill, mild respiratory distress',
        respiratory: 'Decreased breath sounds right lower lobe, dullness to percussion',
        cardiovascular: 'Tachycardic, regular rhythm'
      },
      'appendicitis': {
        general: 'Patient appears uncomfortable',
        abdominal: 'Right lower quadrant tenderness, positive McBurney sign',
        general_exam: 'Low-grade fever, guarding present'
      }
    };

    // Return findings based on condition or generic findings
    for (const [conditionKey, findings] of Object.entries(examFindings)) {
      if (condition.includes(conditionKey.split(' ')[0])) {
        return findings;
      }
    }

    return {
      general: 'Physical examination performed',
      findings: 'Examination findings documented'
    };
  }

  /**
   * Generate lab results
   */
  generateLabResult(details, clinicalDossier) {
    const condition = clinicalDossier.hidden_diagnosis.toLowerCase();
    
    if (condition.includes('myocardial') || condition.includes('heart')) {
      return {
        troponin: 'Elevated (15.2 ng/mL)',
        cpk_mb: 'Elevated',
        basic_metabolic_panel: 'Within normal limits',
        lipid_panel: 'Total cholesterol 285 mg/dL'
      };
    }

    if (condition.includes('pneumonia') || condition.includes('infection')) {
      return {
        complete_blood_count: 'WBC 15,000 with left shift',
        blood_cultures: 'Pending',
        procalcitonin: 'Elevated'
      };
    }

    return {
      results: 'Laboratory results within expected range for condition',
      status: 'Available for review'
    };
  }

  /**
   * Generate imaging results
   */
  generateImagingResult(details, clinicalDossier) {
    const condition = clinicalDossier.hidden_diagnosis.toLowerCase();
    
    if (condition.includes('myocardial') || condition.includes('heart')) {
      return {
        ecg: 'ST elevation in leads II, III, aVF consistent with inferior STEMI',
        chest_xray: 'Normal cardiac silhouette, clear lung fields'
      };
    }

    if (condition.includes('pneumonia')) {
      return {
        chest_xray: 'Right lower lobe consolidation consistent with pneumonia'
      };
    }

    return {
      findings: 'Imaging study completed',
      impression: 'Results consistent with clinical presentation'
    };
  }

  /**
   * Evaluate diagnostic accuracy
   */
  evaluateDiagnosticAccuracy(userDiagnosis, correctDiagnosis) {
    const userDiagLower = userDiagnosis.toLowerCase();
    const correctDiagLower = correctDiagnosis.toLowerCase();

    // Extract key terms from correct diagnosis
    const keyTerms = correctDiagLower.split(' ');
    const matchedTerms = keyTerms.filter(term => userDiagLower.includes(term));

    const accuracy = matchedTerms.length / keyTerms.length;

    if (accuracy >= 0.7) {
      return { level: 'accurate', score: 90, feedback: 'Diagnostic assessment is accurate' };
    } else if (accuracy >= 0.4) {
      return { level: 'partial', score: 70, feedback: 'Partially correct, consider refining diagnosis' };
    } else {
      return { level: 'inaccurate', score: 40, feedback: 'Consider reviewing clinical findings' };
    }
  }

  /**
   * Evaluate treatment appropriateness
   */
  evaluateTreatmentAppropriateness(treatment, diagnosis) {
    // Simplified treatment evaluation
    const treatmentLower = treatment.toLowerCase();
    const diagnosisLower = diagnosis.toLowerCase();

    let score = 50; // Base score

    if (diagnosisLower.includes('myocardial') && 
        (treatmentLower.includes('aspirin') || treatmentLower.includes('statin'))) {
      score += 30;
    }

    if (diagnosisLower.includes('pneumonia') && 
        treatmentLower.includes('antibiotic')) {
      score += 30;
    }

    if (treatmentLower.includes('supportive') || treatmentLower.includes('monitor')) {
      score += 10;
    }

    return {
      score: Math.min(100, score),
      feedback: score >= 80 ? 'Appropriate treatment plan' : 'Consider additional treatment options'
    };
  }

  /**
   * Generate system message for clinical action
   */
  generateActionSystemMessage(clinicalAction) {
    const { action, details, result } = clinicalAction;
    
    let message = `✅ ${action.replace('_', ' ').toUpperCase()}: ${details}\n`;

    if (result.findings) {
      message += `\n📋 Findings: ${typeof result.findings === 'object' ? 
        JSON.stringify(result.findings, null, 2) : result.findings}`;
    }

    if (result.results) {
      message += `\n📊 Results: ${typeof result.results === 'object' ? 
        JSON.stringify(result.results, null, 2) : result.results}`;
    }

    if (result.accuracy) {
      message += `\n🎯 Assessment: ${result.accuracy.feedback}`;
    }

    return message;
  }

  /**
   * Update learning progress based on clinical action
   */
  updateLearningProgress(simulationState, clinicalAction) {
    const { learningProgress } = simulationState;
    const { action, appropriate, result } = clinicalAction;

    // Update clinical skills assessed
    const skillName = action.replace('_', ' ').toUpperCase();
    const existingSkill = learningProgress.clinicalSkillsAssessed.find(s => s.skill === skillName);
    
    if (existingSkill) {
      existingSkill.assessmentDate = new Date();
    } else {
      learningProgress.clinicalSkillsAssessed.push({
        skill: skillName,
        competencyLevel: appropriate ? 'competent' : 'needs_improvement',
        assessmentDate: new Date()
      });
    }

    // Update diagnostic accuracy if this was a diagnosis action
    if (action === 'diagnosis' && result.accuracy) {
      learningProgress.diagnosticAccuracy = result.accuracy.score;
    }

    // Update overall progress
    const completedActions = simulationState.clinicalActions.length;
    const appropriateActions = simulationState.clinicalActions.filter(a => a.appropriate).length;
    const actionScore = completedActions > 0 ? (appropriateActions / completedActions) * 100 : 0;
    
    learningProgress.overallProgress = Math.round(
      (actionScore * 0.6) + 
      (learningProgress.diagnosticAccuracy * 0.4)
    );
  }

  /**
   * Evaluate student performance against template criteria
   */
  evaluatePerformance(simulationState) {
    const { conversationHistory, clinicalActions, evaluationCriteria, caseData } = simulationState;
    
    console.log(`📊 Evaluating performance for template simulation`);
    
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
    const overallScore = totalCriteria > 0 ? Math.round(totalScore / totalCriteria) : 0;

    return {
      overallScore,
      criteriaEvaluation: evaluation,
      recommendations: this.generateRecommendations(evaluation, caseData),
      strengths: this.identifyStrengths(evaluation),
      improvementAreas: this.identifyImprovementAreas(evaluation),
      sessionSummary: {
        totalMessages: conversationHistory.length,
        clinicalActionsPerformed: clinicalActions.length,
        appropriateActions: clinicalActions.filter(a => a.appropriate).length,
        communicationQuality: this.assessCommunicationQuality(conversationHistory)
      }
    };
  }

  /**
   * Evaluate individual criterion
   */
  evaluateCriterion(criterion, description, conversationHistory, clinicalActions, caseData) {
    const studentMessages = conversationHistory.filter(msg => msg.sender === 'student');
    const allStudentText = studentMessages.map(msg => msg.message).join(' ').toLowerCase();

    // Base score
    let score = 50;

    switch (criterion) {
      case 'History_Taking':
        // Check for systematic history taking
        const historyKeywords = ['pain', 'symptom', 'when', 'onset', 'duration', 'severity', 'location'];
        const historyMatches = historyKeywords.filter(keyword => allStudentText.includes(keyword));
        score += Math.min(40, historyMatches.length * 5);
        
        // Bonus for comprehensive approach
        if (studentMessages.length >= 5) score += 10;
        break;

      case 'Risk_Factor_Assessment':
        const riskKeywords = ['history', 'family', 'smoke', 'drink', 'medication', 'allergy'];
        const riskMatches = riskKeywords.filter(keyword => allStudentText.includes(keyword));
        score += Math.min(40, riskMatches.length * 7);
        break;

      case 'Differential_Diagnosis_Questioning':
        const diffKeywords = ['could', 'possible', 'rule out', 'consider', 'might'];
        const diffMatches = diffKeywords.filter(keyword => allStudentText.includes(keyword));
        score += Math.min(40, diffMatches.length * 8);
        break;

      case 'Communication_and_Empathy':
        const empathyKeywords = ['understand', 'sorry', 'concern', 'worry', 'help', 'thank'];
        const empathyMatches = empathyKeywords.filter(keyword => allStudentText.includes(keyword));
        score += Math.min(40, empathyMatches.length * 7);
        
        // Check for appropriate tone
        const politeWords = (allStudentText.match(/please|thank|sorry/g) || []).length;
        score += Math.min(10, politeWords * 2);
        break;

      case 'Clinical_Urgency':
        const urgencyKeywords = ['urgent', 'emergency', 'serious', 'concerned'];
        const urgencyMatches = urgencyKeywords.filter(keyword => allStudentText.includes(keyword));
        score += Math.min(30, urgencyMatches.length * 10);
        
        // Bonus for taking clinical actions
        if (clinicalActions.length > 0) score += 20;
        break;

      case 'Clinical_Reasoning':
        // Evaluate based on clinical actions taken
        const reasoningActions = clinicalActions.filter(a => 
          ['diagnosis', 'treatment_plan'].includes(a.action)
        );
        score += Math.min(40, reasoningActions.length * 20);
        break;

      case 'Professionalism':
        // Base on communication style and appropriateness
        const professionalWords = (allStudentText.match(/doctor|please|thank|excuse|may i/g) || []).length;
        score += Math.min(40, professionalWords * 5);
        
        // Penalty for inappropriate language
        const inappropriateWords = (allStudentText.match(/stupid|dumb|whatever|yeah right/g) || []).length;
        score -= inappropriateWords * 10;
        break;

      default:
        // Generic evaluation based on engagement
        score += Math.min(30, studentMessages.length * 3);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate feedback for specific criterion
   */
  generateCriterionFeedback(criterion, score, description) {
    const criterionName = criterion.replace(/_/g, ' ').toLowerCase();
    
    if (score >= 85) {
      return `Excellent ${criterionName}. ${description} - Well demonstrated.`;
    } else if (score >= 70) {
      return `Good ${criterionName}. ${description} - Consider expanding your approach.`;
    } else if (score >= 50) {
      return `Adequate ${criterionName}. ${description} - Room for improvement.`;
    } else {
      return `${criterion.replace(/_/g, ' ')} needs significant improvement. Focus on: ${description}`;
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(evaluation, caseData) {
    const recommendations = [];
    const lowScoreCriteria = Object.entries(evaluation)
      .filter(([_, data]) => data.score < 70)
      .map(([criterion, _]) => criterion);

    if (lowScoreCriteria.includes('History_Taking')) {
      recommendations.push('Practice systematic history taking using OPQRST (Onset, Provocation, Quality, Region, Severity, Timing) framework');
    }

    if (lowScoreCriteria.includes('Communication_and_Empathy')) {
      recommendations.push('Focus on empathetic communication - acknowledge patient concerns and show understanding');
    }

    if (lowScoreCriteria.includes('Clinical_Urgency')) {
      recommendations.push('Develop skills in recognizing clinical red flags and appropriate escalation');
    }

    if (lowScoreCriteria.includes('Clinical_Reasoning')) {
      recommendations.push('Practice differential diagnosis formation and clinical decision-making');
    }

    // Add case-specific recommendations
    const specialty = caseData.case_metadata.specialty;
    const difficulty = caseData.case_metadata.difficulty;
    
    recommendations.push(`Review ${specialty} clinical guidelines for ${difficulty.toLowerCase()}-level cases`);
    recommendations.push(`Practice similar cases in ${specialty} to build pattern recognition`);

    return recommendations;
  }

  /**
   * Identify performance strengths
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
        suggestion: this.getImprovementSuggestion(criterion, data.score)
      }));
  }

  /**
   * Get specific improvement suggestions
   */
  getImprovementSuggestion(criterion, score) {
    const suggestions = {
      'History_Taking': 'Use a systematic approach like OPQRST. Ask about onset, timing, quality, and associated symptoms.',
      'Communication_and_Empathy': 'Show empathy by acknowledging concerns, using phrases like "I understand" and "That must be concerning".',
      'Clinical_Urgency': 'Learn to recognize red flags and when to escalate care. Consider the severity of presenting symptoms.',
      'Clinical_Reasoning': 'Practice forming differential diagnoses and explaining your clinical thinking.',
      'Professionalism': 'Maintain professional language and demeanor. Use courteous phrases and appropriate medical terminology.'
    };

    return suggestions[criterion] || 'Review course materials and practice with similar cases.';
  }

  /**
   * Assess overall communication quality
   */
  assessCommunicationQuality(conversationHistory) {
    const studentMessages = conversationHistory.filter(msg => msg.sender === 'student');
    
    if (studentMessages.length === 0) return 0;

    let qualityScore = 0;
    const totalMessages = studentMessages.length;

    studentMessages.forEach(msg => {
      const message = msg.message.toLowerCase();
      
      // Positive indicators
      if (message.includes('?')) qualityScore += 2; // Asking questions
      if (message.includes('thank') || message.includes('please')) qualityScore += 1; // Politeness
      if (message.length > 10) qualityScore += 1; // Substantial responses
      if (message.includes('understand') || message.includes('concern')) qualityScore += 2; // Empathy
    });

    return Math.min(100, Math.round((qualityScore / totalMessages) * 10));
  }
}

module.exports = TemplateSimulationEngine;