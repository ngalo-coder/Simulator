// ai-patient-sim-core-services/simulation-service/src/services/reportGenerator.js
const OpenRouterService = require('./openRouterService');

class ReportGenerator {
  constructor() {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Generate comprehensive simulation report
   */
  async generateSimulationReport(simulation) {
    try {
      console.log(`📊 Generating report for simulation ${simulation.id}`);

      const report = {
        simulationOverview: this.generateSimulationOverview(simulation),
        performanceMetrics: this.calculatePerformanceMetrics(simulation),
        clinicalDecisionMaking: await this.analyzeClinicalDecisionMaking(simulation),
        communicationAssessment: this.assessCommunication(simulation),
        timelineAnalysis: this.generateTimelineAnalysis(simulation),
        debriefingQuestions: this.generateDebriefingQuestions(simulation),
        actionableNextSteps: await this.generateNextSteps(simulation),
        visualData: this.generateVisualData(simulation),
        overallScore: this.calculateOverallScore(simulation)
      };

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating report:', error);
      return {
        success: false,
        error: 'Failed to generate simulation report',
        details: error.message
      };
    }
  }

  /**
   * 1. Simulation Overview
   */
  generateSimulationOverview(simulation) {
    const patientInfo = simulation.patientPersona.patient || {};
    const demographics = simulation.patientPersona.demographics || {};
    
    return {
      scenarioDetails: {
        caseId: simulation.caseId,
        caseName: simulation.caseName,
        patientDescription: `${patientInfo.age || 'Adult'} ${patientInfo.gender || 'patient'} with ${simulation.patientPersona.chiefComplaint || simulation.caseName}`,
        programArea: this.formatProgramArea(simulation.programArea),
        condition: simulation.patientPersona.currentCondition
      },
      learningObjectives: simulation.patientPersona.learningObjectives || [],
      difficultyLevel: this.formatDifficulty(simulation.difficulty),
      sessionInfo: {
        startTime: simulation.sessionMetrics.startTime,
        endTime: simulation.sessionMetrics.endTime,
        duration: simulation.sessionMetrics.totalDuration || this.calculateDuration(simulation),
        status: simulation.status
      }
    };
  }

  /**
   * 2. Performance Metrics & Scoring
   */
  calculatePerformanceMetrics(simulation) {
    const actions = simulation.clinicalActions || [];
    const expectedActions = this.getExpectedActions(simulation.patientPersona.currentCondition);
    
    const completedActions = actions.map(action => ({
      action: action.action,
      details: action.details,
      timestamp: action.timestamp,
      appropriate: this.isActionAppropriate(action, simulation.patientPersona.currentCondition),
      timing: this.assessActionTiming(action, simulation)
    }));

    const criticalActionsMissed = expectedActions.critical.filter(expected => 
      !actions.some(action => this.matchesExpectedAction(action, expected))
    );

    return {
      checklistEvaluation: {
        totalActions: actions.length,
        appropriateActions: completedActions.filter(a => a.appropriate).length,
        criticalActionsCompleted: expectedActions.critical.filter(expected => 
          actions.some(action => this.matchesExpectedAction(action, expected))
        ),
        criticalActionsMissed,
        completedActions
      },
      timingSensitiveActions: this.assessTimeCriticalActions(simulation),
      scoringRubric: {
        clinicalDecisionMaking: simulation.learningProgress.diagnosticAccuracy || 0,
        communication: simulation.learningProgress.communicationScore || 0,
        technicalSkills: this.calculateTechnicalSkillsScore(actions),
        professionalism: this.assessProfessionalism(simulation),
        overallScore: simulation.learningProgress.overallProgress || 0
      }
    };
  }

  /**
   * 3. Clinical Decision-Making Analysis
   */
  async analyzeClinicalDecisionMaking(simulation) {
    const actions = simulation.clinicalActions || [];
    const conversations = simulation.conversationHistory || [];
    
    // Analyze diagnostic reasoning
    const diagnosticActions = actions.filter(a => a.action === 'diagnosis');
    const historyActions = actions.filter(a => a.action === 'history_taking');
    const examActions = actions.filter(a => a.action === 'physical_exam');
    
    const strengths = [];
    const improvements = [];
    const alternatives = [];

    // Assess systematic approach
    if (historyActions.length > 0) {
      strengths.push("Gathered patient history systematically");
    } else {
      improvements.push("Should obtain comprehensive patient history before proceeding");
    }

    if (examActions.length > 0) {
      strengths.push("Performed physical examination");
    } else {
      improvements.push("Physical examination should be completed for proper assessment");
    }

    // Use AI to provide deeper analysis
    try {
      const aiAnalysis = await this.getAIAnalysis(simulation);
      if (aiAnalysis.strengths) strengths.push(...aiAnalysis.strengths);
      if (aiAnalysis.improvements) improvements.push(...aiAnalysis.improvements);
      if (aiAnalysis.alternatives) alternatives.push(...aiAnalysis.alternatives);
    } catch (error) {
      console.log('AI analysis unavailable, using rule-based analysis');
    }

    return {
      strengths: [...new Set(strengths)], // Remove duplicates
      areasForImprovement: [...new Set(improvements)],
      alternativeApproaches: [...new Set(alternatives)],
      diagnosticAccuracy: this.assessDiagnosticAccuracy(simulation),
      clinicalReasoning: this.assessClinicalReasoning(actions)
    };
  }

  /**
   * 4. Communication & Professionalism Assessment
   */
  assessCommunication(simulation) {
    const conversations = simulation.conversationHistory.filter(c => c.sender === 'student');
    
    return {
      patientInteraction: {
        empathy: this.assessEmpathy(conversations),
        clarity: this.assessClarity(conversations),
        therapeuticCommunication: this.assessTherapeuticCommunication(conversations),
        culturalSensitivity: this.assessCulturalSensitivity(simulation)
      },
      professionalBehavior: {
        respectfulness: this.assessRespectfulness(conversations),
        confidentiality: this.assessConfidentiality(conversations),
        ethicalConsiderations: this.assessEthicalBehavior(simulation)
      },
      communicationScore: simulation.learningProgress.communicationScore || 0,
      feedback: this.generateCommunicationFeedback(conversations, simulation)
    };
  }

  /**
   * 5. Timeline Analysis
   */
  generateTimelineAnalysis(simulation) {
    const actions = simulation.clinicalActions || [];
    const conversations = simulation.conversationHistory || [];
    const startTime = new Date(simulation.sessionMetrics.startTime);

    const timeline = [...actions, ...conversations]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(item => ({
        timestamp: item.timestamp,
        type: item.action ? 'clinical_action' : 'communication',
        description: item.action ? `${item.action}: ${item.details}` : `${item.sender}: ${item.message.substring(0, 50)}...`,
        minutesFromStart: Math.round((new Date(item.timestamp) - startTime) / (1000 * 60))
      }));

    return {
      timeline,
      keyMilestones: this.identifyKeyMilestones(timeline, simulation),
      pacing: this.assessPacing(timeline),
      criticalDelays: this.identifyCriticalDelays(timeline, simulation)
    };
  }

  /**
   * 6. Debriefing & Reflection Questions
   */
  generateDebriefingQuestions(simulation) {
    const condition = simulation.patientPersona.currentCondition;
    const programArea = simulation.programArea;
    
    const baseQuestions = [
      "What would you do differently next time?",
      "How did your actions align with evidence-based practice?",
      "What was your primary differential diagnosis and why?",
      "How did you prioritize your clinical actions?",
      "What challenges did you encounter during this simulation?"
    ];

    const conditionSpecificQuestions = this.getConditionSpecificQuestions(condition);
    const programSpecificQuestions = this.getProgramSpecificQuestions(programArea);

    return {
      reflectionQuestions: baseQuestions,
      conditionSpecific: conditionSpecificQuestions,
      programSpecific: programSpecificQuestions,
      expertFeedback: this.generateExpertFeedback(simulation),
      references: this.getRelevantReferences(condition, programArea)
    };
  }

  /**
   * 7. Actionable Next Steps
   */
  async generateNextSteps(simulation) {
    const weakAreas = this.identifyWeakAreas(simulation);
    const strengths = this.identifyStrengths(simulation);
    
    const nextSteps = [];
    const resources = [];

    // Generate personalized recommendations
    if (simulation.learningProgress.diagnosticAccuracy < 70) {
      nextSteps.push("Practice diagnostic reasoning with similar cases");
      resources.push("Diagnostic reasoning modules for " + simulation.programArea);
    }

    if (simulation.learningProgress.communicationScore < 70) {
      nextSteps.push("Complete communication skills training");
      resources.push("Patient communication best practices guide");
    }

    // Add condition-specific recommendations
    const conditionSteps = this.getConditionSpecificNextSteps(simulation.patientPersona.currentCondition);
    nextSteps.push(...conditionSteps);

    return {
      personalizedLearningPlan: nextSteps,
      recommendedResources: resources,
      practiceScenarios: this.getRecommendedPracticeScenarios(simulation),
      skillsToFocus: weakAreas,
      strengthsToMaintain: strengths
    };
  }

  /**
   * 8. Visual & Data Aids
   */
  generateVisualData(simulation) {
    return {
      performanceRadar: {
        clinicalDecisionMaking: simulation.learningProgress.diagnosticAccuracy || 0,
        communication: simulation.learningProgress.communicationScore || 0,
        technicalSkills: this.calculateTechnicalSkillsScore(simulation.clinicalActions),
        professionalism: this.assessProfessionalism(simulation),
        timeManagement: this.assessTimeManagement(simulation)
      },
      actionDistribution: this.getActionDistribution(simulation.clinicalActions),
      timelineData: this.getTimelineChartData(simulation),
      comparisonData: {
        userLevel: simulation.difficulty,
        averageForLevel: this.getAverageScoresForLevel(simulation.difficulty),
        percentile: this.calculatePercentile(simulation)
      }
    };
  }

  // Helper methods
  formatProgramArea(area) {
    const areas = {
      'internal_medicine': 'Internal Medicine',
      'pediatrics': 'Pediatrics',
      'family_medicine': 'Family Medicine',
      'emergency_medicine': 'Emergency Medicine',
      'psychiatry': 'Psychiatry',
      'surgery': 'Surgery',
      'obstetrics_gynecology': 'Obstetrics & Gynecology',
      'cardiology_fellowship': 'Cardiology Fellowship'
    };
    return areas[area] || area;
  }

  formatDifficulty(difficulty) {
    const levels = {
      'student': 'Medical Student',
      'resident': 'Resident Level',
      'fellow': 'Fellowship Level'
    };
    return levels[difficulty] || difficulty;
  }

  calculateDuration(simulation) {
    if (simulation.sessionMetrics.endTime) {
      return Math.round((new Date(simulation.sessionMetrics.endTime) - new Date(simulation.sessionMetrics.startTime)) / (1000 * 60));
    }
    return Math.round((new Date() - new Date(simulation.sessionMetrics.startTime)) / (1000 * 60));
  }

  calculateOverallScore(simulation) {
    const metrics = simulation.learningProgress;
    const weights = {
      diagnosticAccuracy: 0.3,
      communicationScore: 0.25,
      technicalSkills: 0.25,
      professionalism: 0.2
    };

    const scores = {
      diagnosticAccuracy: metrics.diagnosticAccuracy || 0,
      communicationScore: metrics.communicationScore || 0,
      technicalSkills: this.calculateTechnicalSkillsScore(simulation.clinicalActions),
      professionalism: this.assessProfessionalism(simulation)
    };

    return Math.round(
      Object.entries(weights).reduce((total, [key, weight]) => {
        return total + (scores[key] * weight);
      }, 0)
    );
  }

  // Placeholder methods for complex assessments
  getExpectedActions(condition) {
    const expectations = {
      'acute_inferior_stemi': {
        critical: ['history_taking', 'physical_exam', 'order_labs', 'diagnosis'],
        recommended: ['treatment_plan', 'order_imaging']
      },
      'viral_upper_respiratory_infection': {
        critical: ['history_taking', 'physical_exam'],
        recommended: ['diagnosis', 'treatment_plan']
      }
    };
    return expectations[condition] || { critical: [], recommended: [] };
  }

  isActionAppropriate(action, condition) {
    // Simplified logic - in real implementation, this would be more sophisticated
    const expected = this.getExpectedActions(condition);
    return [...expected.critical, ...expected.recommended].includes(action.action);
  }

  assessActionTiming(action, simulation) {
    // Assess if action was performed at appropriate time
    const actionTime = new Date(action.timestamp);
    const startTime = new Date(simulation.sessionMetrics.startTime);
    const minutesFromStart = (actionTime - startTime) / (1000 * 60);
    
    return {
      minutesFromStart: Math.round(minutesFromStart),
      timing: minutesFromStart < 5 ? 'early' : minutesFromStart < 15 ? 'appropriate' : 'delayed'
    };
  }

  calculateTechnicalSkillsScore(actions) {
    if (!actions || actions.length === 0) return 0;
    
    const skillActions = actions.filter(a => 
      ['physical_exam', 'order_labs', 'order_imaging'].includes(a.action)
    );
    
    return Math.min(100, (skillActions.length / actions.length) * 100);
  }

  assessProfessionalism(simulation) {
    // Basic professionalism assessment based on communication patterns
    const studentMessages = simulation.conversationHistory.filter(c => c.sender === 'student');
    if (studentMessages.length === 0) return 50;
    
    // Simple scoring based on message characteristics
    let score = 80; // Base score
    
    studentMessages.forEach(msg => {
      if (msg.message.toLowerCase().includes('please') || msg.message.toLowerCase().includes('thank you')) {
        score += 2;
      }
      if (msg.message.length < 10) {
        score -= 1; // Penalize very short responses
      }
    });
    
    return Math.min(100, Math.max(0, score));
  }

  // Additional helper methods would be implemented here...
  matchesExpectedAction(action, expected) { return action.action === expected; }
  assessTimeCriticalActions(simulation) { return []; }
  getAIAnalysis(simulation) { return Promise.resolve({ strengths: [], improvements: [], alternatives: [] }); }
  assessDiagnosticAccuracy(simulation) { return simulation.learningProgress.diagnosticAccuracy || 0; }
  assessClinicalReasoning(actions) { return "Systematic approach demonstrated"; }
  assessEmpathy(conversations) { return 75; }
  assessClarity(conversations) { return 80; }
  assessTherapeuticCommunication(conversations) { return 70; }
  assessCulturalSensitivity(simulation) { return 85; }
  assessRespectfulness(conversations) { return 90; }
  assessConfidentiality(conversations) { return 95; }
  assessEthicalBehavior(simulation) { return 85; }
  generateCommunicationFeedback(conversations, simulation) { return "Good communication skills demonstrated"; }
  identifyKeyMilestones(timeline, simulation) { return []; }
  assessPacing(timeline) { return "Appropriate pacing"; }
  identifyCriticalDelays(timeline, simulation) { return []; }
  getConditionSpecificQuestions(condition) { return []; }
  getProgramSpecificQuestions(programArea) { return []; }
  generateExpertFeedback(simulation) { return "Overall good performance with room for improvement"; }
  getRelevantReferences(condition, programArea) { return []; }
  identifyWeakAreas(simulation) { return []; }
  identifyStrengths(simulation) { return []; }
  getConditionSpecificNextSteps(condition) { return []; }
  getRecommendedPracticeScenarios(simulation) { return []; }
  assessTimeManagement(simulation) { return 75; }
  getActionDistribution(actions) { return {}; }
  getTimelineChartData(simulation) { return []; }
  getAverageScoresForLevel(difficulty) { return {}; }
  calculatePercentile(simulation) { return 50; }
}

module.exports = ReportGenerator;