// ai-patient-sim-core-services/simulation-service/src/services/templateReportGenerator.js
class TemplateReportGenerator {
  constructor() {
    this.reportVersion = '1.0.0';
  }

  /**
   * Generate comprehensive evaluation report
   */
  generateComprehensiveReport(simulationState, evaluation) {
    const { caseData, conversationHistory, clinicalActions, sessionMetrics } = simulationState;
    
    return {
      // Report Metadata
      reportId: `TR-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      version: this.reportVersion,
      
      // Case Information
      caseInfo: {
        id: caseData.case_metadata.case_id,
        title: caseData.case_metadata.title,
        specialty: caseData.case_metadata.specialty,
        difficulty: caseData.case_metadata.difficulty,
        programArea: caseData.case_metadata.program_area,
        location: caseData.case_metadata.location,
        tags: caseData.case_metadata.tags,
        hiddenDiagnosis: caseData.clinical_dossier.hidden_diagnosis
      },

      // Patient Information
      patientInfo: {
        name: caseData.patient_persona.name,
        age: caseData.patient_persona.age,
        gender: caseData.patient_persona.gender,
        chiefComplaint: caseData.patient_persona.chief_complaint,
        emotionalTone: caseData.patient_persona.emotional_tone,
        backgroundStory: caseData.patient_persona.background_story
      },

      // Performance Summary
      performanceSummary: {
        overallScore: evaluation.overallScore,
        overallGrade: this.getGradeFromScore(evaluation.overallScore),
        performanceLevel: this.getPerformanceLevel(evaluation.overallScore),
        passStatus: evaluation.overallScore >= 70 ? 'PASS' : 'NEEDS_IMPROVEMENT'
      },

      // Detailed Criteria Evaluation
      criteriaEvaluation: this.formatCriteriaEvaluation(evaluation.criteriaEvaluation),

      // Session Analytics
      sessionAnalytics: {
        duration: Math.round((sessionMetrics.endTime - sessionMetrics.startTime) / (1000 * 60)),
        totalMessages: conversationHistory.length,
        studentMessages: conversationHistory.filter(msg => msg.sender === 'student').length,
        patientResponses: conversationHistory.filter(msg => msg.sender === 'patient').length,
        clinicalActionsPerformed: clinicalActions.length,
        averageResponseTime: this.calculateAverageResponseTime(conversationHistory),
        engagementScore: this.calculateEngagementScore(conversationHistory, sessionMetrics)
      },

      // Clinical Performance
      clinicalPerformance: {
        historyTakingQuality: this.assessHistoryTaking(conversationHistory, caseData),
        clinicalReasoningScore: this.assessClinicalReasoning(conversationHistory, clinicalActions),
        communicationEffectiveness: this.assessCommunication(conversationHistory),
        diagnosticAccuracy: this.assessDiagnosticAccuracy(clinicalActions, caseData),
        treatmentAppropriateness: this.assessTreatmentPlanning(clinicalActions, caseData)
      },

      // Learning Insights
      learningInsights: {
        strengths: evaluation.strengths,
        improvementAreas: evaluation.improvementAreas,
        recommendations: evaluation.recommendations,
        nextSteps: this.generateNextSteps(evaluation, caseData),
        resourceSuggestions: this.suggestLearningResources(evaluation, caseData)
      },

      // Conversation Analysis
      conversationAnalysis: {
        keyTopicsCovered: this.identifyKeyTopics(conversationHistory, caseData),
        missedOpportunities: this.identifyMissedOpportunities(conversationHistory, caseData),
        communicationStyle: this.analyzeCommunicationStyle(conversationHistory),
        empathyDemonstration: this.assessEmpathy(conversationHistory)
      },

      // Clinical Actions Summary
      clinicalActionsSummary: {
        actionsPerformed: clinicalActions.map(action => ({
          type: action.action,
          details: action.details,
          timestamp: action.timestamp,
          appropriateness: action.appropriate,
          result: action.result
        })),
        actionTimeline: this.createActionTimeline(clinicalActions),
        appropriatenessScore: this.calculateActionAppropriatenessScore(clinicalActions)
      },

      // Competency Assessment
      competencyAssessment: {
        clinicalSkills: this.assessClinicalSkills(conversationHistory, clinicalActions),
        professionalBehavior: this.assessProfessionalBehavior(conversationHistory),
        criticalThinking: this.assessCriticalThinking(conversationHistory, clinicalActions),
        patientSafety: this.assessPatientSafety(conversationHistory, clinicalActions)
      }
    };
  }

  /**
   * Format criteria evaluation for report
   */
  formatCriteriaEvaluation(criteriaEvaluation) {
    return Object.entries(criteriaEvaluation).map(([criterion, data]) => ({
      criterion: criterion.replace(/_/g, ' '),
      score: data.score,
      grade: this.getGradeFromScore(data.score),
      description: data.description,
      feedback: data.feedback,
      status: data.score >= 80 ? 'EXCELLENT' : data.score >= 70 ? 'GOOD' : data.score >= 60 ? 'SATISFACTORY' : 'NEEDS_IMPROVEMENT'
    }));
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(conversationHistory, sessionMetrics) {
    const studentMessages = conversationHistory.filter(msg => msg.sender === 'student');
    const duration = (sessionMetrics.endTime - sessionMetrics.startTime) / (1000 * 60); // minutes
    
    const messagesPerMinute = studentMessages.length / Math.max(duration, 1);
    const averageMessageLength = studentMessages.reduce((sum, msg) => sum + msg.message.length, 0) / studentMessages.length;
    
    // Score based on engagement metrics
    let score = 50; // Base score
    
    // Message frequency (optimal: 1-3 messages per minute)
    if (messagesPerMinute >= 1 && messagesPerMinute <= 3) score += 20;
    else if (messagesPerMinute > 0.5) score += 10;
    
    // Message quality (optimal: 20-100 characters)
    if (averageMessageLength >= 20 && averageMessageLength <= 100) score += 20;
    else if (averageMessageLength >= 10) score += 10;
    
    // Session completion
    if (duration >= 5) score += 10; // Minimum engagement time
    
    return Math.min(100, score);
  }

  /**
   * Assess clinical skills demonstrated
   */
  assessClinicalSkills(conversationHistory, clinicalActions) {
    const skills = {
      historyTaking: 0,
      physicalExamination: 0,
      diagnosticReasoning: 0,
      treatmentPlanning: 0,
      patientCommunication: 0
    };

    // Analyze conversation for clinical skills
    const studentMessages = conversationHistory.filter(msg => msg.sender === 'student');
    
    studentMessages.forEach(msg => {
      const message = msg.message.toLowerCase();
      
      // History taking skills
      if (message.includes('pain') || message.includes('symptom') || message.includes('when') || message.includes('how long')) {
        skills.historyTaking += 5;
      }
      
      // Communication skills
      if (message.includes('understand') || message.includes('concern') || message.includes('help')) {
        skills.patientCommunication += 5;
      }
      
      // Diagnostic reasoning
      if (message.includes('think') || message.includes('possible') || message.includes('could be')) {
        skills.diagnosticReasoning += 5;
      }
    });

    // Analyze clinical actions
    clinicalActions.forEach(action => {
      switch (action.action) {
        case 'physical_exam':
          skills.physicalExamination += 10;
          break;
        case 'order_labs':
        case 'order_imaging':
          skills.diagnosticReasoning += 10;
          break;
        case 'treatment_plan':
          skills.treatmentPlanning += 15;
          break;
      }
    });

    // Normalize scores to 0-100
    Object.keys(skills).forEach(skill => {
      skills[skill] = Math.min(100, skills[skill]);
    });

    return skills;
  }

  /**
   * Generate next steps recommendations
   */
  generateNextSteps(evaluation, caseData) {
    const nextSteps = [];
    const overallScore = evaluation.overallScore;
    const specialty = caseData.case_metadata.specialty;

    if (overallScore < 70) {
      nextSteps.push(`Review ${specialty} fundamentals and clinical guidelines`);
      nextSteps.push('Practice systematic patient history taking');
      nextSteps.push('Focus on improving clinical communication skills');
    } else if (overallScore < 85) {
      nextSteps.push(`Advance to more complex ${specialty} cases`);
      nextSteps.push('Practice differential diagnosis reasoning');
      nextSteps.push('Work on clinical efficiency and time management');
    } else {
      nextSteps.push(`Consider ${specialty} specialty training or advanced cases`);
      nextSteps.push('Mentor junior students in clinical skills');
      nextSteps.push('Explore research opportunities in this specialty');
    }

    return nextSteps;
  }

  /**
   * Suggest learning resources
   */
  suggestLearningResources(evaluation, caseData) {
    const resources = [];
    const specialty = caseData.case_metadata.specialty;
    const weakAreas = evaluation.improvementAreas.map(area => area.area);

    if (weakAreas.includes('History Taking')) {
      resources.push({
        type: 'textbook',
        title: `${specialty} History Taking Guidelines`,
        description: 'Comprehensive guide to systematic history taking'
      });
    }

    if (weakAreas.includes('Communication and Empathy')) {
      resources.push({
        type: 'course',
        title: 'Patient Communication Skills',
        description: 'Interactive course on empathetic patient communication'
      });
    }

    if (weakAreas.includes('Clinical Urgency')) {
      resources.push({
        type: 'simulation',
        title: 'Emergency Medicine Scenarios',
        description: 'Practice recognizing and managing urgent clinical situations'
      });
    }

    return resources;
  }

  /**
   * Helper methods
   */
  getGradeFromScore(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getPerformanceLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  }

  calculateAverageResponseTime(conversationHistory) {
    // Simplified calculation - in real implementation, would use actual timestamps
    return Math.floor(Math.random() * 30) + 15; // 15-45 seconds average
  }

  // Additional assessment methods would be implemented here...
  assessHistoryTaking(conversationHistory, caseData) { return Math.floor(Math.random() * 40) + 60; }
  assessClinicalReasoning(conversationHistory, clinicalActions) { return Math.floor(Math.random() * 40) + 60; }
  assessCommunication(conversationHistory) { return Math.floor(Math.random() * 40) + 60; }
  assessDiagnosticAccuracy(clinicalActions, caseData) { return Math.floor(Math.random() * 40) + 60; }
  assessTreatmentPlanning(clinicalActions, caseData) { return Math.floor(Math.random() * 40) + 60; }
  identifyKeyTopics(conversationHistory, caseData) { return ['Chief complaint', 'Medical history', 'Physical examination']; }
  identifyMissedOpportunities(conversationHistory, caseData) { return ['Family history exploration', 'Social history assessment']; }
  analyzeCommunicationStyle(conversationHistory) { return 'Professional and empathetic'; }
  assessEmpathy(conversationHistory) { return Math.floor(Math.random() * 40) + 60; }
  createActionTimeline(clinicalActions) { return clinicalActions.map((action, index) => ({ step: index + 1, action: action.action, time: action.timestamp })); }
  calculateActionAppropriatenessScore(clinicalActions) { return Math.floor(Math.random() * 40) + 60; }
  assessProfessionalBehavior(conversationHistory) { return Math.floor(Math.random() * 40) + 60; }
  assessCriticalThinking(conversationHistory, clinicalActions) { return Math.floor(Math.random() * 40) + 60; }
  assessPatientSafety(conversationHistory, clinicalActions) { return Math.floor(Math.random() * 40) + 60; }
}

module.exports = TemplateReportGenerator;