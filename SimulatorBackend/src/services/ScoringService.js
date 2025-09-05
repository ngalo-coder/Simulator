import ScoringRubric from '../models/ScoringRubricModel.js';
import SessionModel from '../models/SessionModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import CompetencyAssessment from '../models/CompetencyAssessmentModel.js';
import logger from '../config/logger.js';
import AIEvaluationService from './AIEvaluationService.js';

class ScoringService {
  constructor() {
    this.rubricCache = new Map();
  }

  // Get or create default rubrics for disciplines
  async initializeDefaultRubrics(userId) {
    try {
      const defaultRubrics = this._getDefaultRubrics(userId);
      const results = [];

      for (const rubricData of defaultRubrics) {
        // Check if rubric already exists
        const existingRubric = await ScoringRubric.findOne({ 
          rubricId: rubricData.rubricId 
        });
        
        if (!existingRubric) {
          const rubric = new ScoringRubric(rubricData);
          await rubric.save();
          results.push(rubric);
          logger.info(`Created default rubric: ${rubricData.rubricId}`);
        } else {
          results.push(existingRubric);
        }
      }

      return results;
    } catch (error) {
      logger.error({ error: error.message }, 'Error initializing default rubrics');
      throw new Error(`Failed to initialize default rubrics: ${error.message}`);
    }
  }

  // Score a session using the appropriate rubric
  async scoreSession(sessionId, rubricId = null, evaluatorId = null) {
    try {
      const session = await SessionModel.findById(sessionId)
        .populate('caseId')
        .populate('userId');

      if (!session) {
        throw new Error('Session not found');
      }

      // Get or determine the appropriate rubric
      const rubric = await this._getRubricForSession(session, rubricId);
      if (!rubric) {
        throw new Error('No suitable scoring rubric found for this session');
      }

      // Get performance metrics
      let performanceMetrics = await PerformanceMetrics.findOne({ sessionId });
      if (!performanceMetrics) {
        throw new Error('Performance metrics not found for session');
      }

      // Calculate scores using the rubric
      const scoringResult = await this._calculateScores(session, performanceMetrics, rubric);

      // Apply AI-powered evaluation if available
      if (AIEvaluationService.isAvailable()) {
        const aiEvaluation = await AIEvaluationService.evaluateSession(sessionId);
        scoringResult.aiEvaluation = aiEvaluation;
        scoringResult.finalScore = this._integrateAIEvaluation(scoringResult.calculatedScore, aiEvaluation);
      } else {
        scoringResult.finalScore = scoringResult.calculatedScore;
      }

      // Determine performance level
      scoringResult.performanceLevel = rubric.determinePerformanceLevel(scoringResult.finalScore);

      // Update session with scoring results
      session.scoringResults = {
        rubricId: rubric.rubricId,
        finalScore: scoringResult.finalScore,
        performanceLevel: scoringResult.performanceLevel,
        criteriaScores: scoringResult.criteriaScores,
        evaluatedAt: new Date(),
        evaluatorId: evaluatorId
      };

      await session.save();

      // Update competency assessment
      await this._updateCompetencyAssessment(session.userId, scoringResult, rubric);

      logger.info({ 
        sessionId, 
        rubricId: rubric.rubricId, 
        finalScore: scoringResult.finalScore 
      }, 'Session scored successfully');

      return scoringResult;
    } catch (error) {
      logger.error({ sessionId, error: error.message }, 'Error scoring session');
      throw error;
    }
  }

  // Get rubric for a session based on case discipline and specialty
  async _getRubricForSession(session, preferredRubricId = null) {
    if (preferredRubricId) {
      return await ScoringRubric.findOne({ 
        rubricId: preferredRubricId, 
        isActive: true 
      });
    }

    const caseData = session.caseId;
    const discipline = caseData.discipline || 'general';
    const specialty = caseData.specialty;

    // Try to find rubric with matching discipline and specialty
    let rubric = await ScoringRubric.findOne({
      discipline,
      specialty,
      isActive: true
    }).sort({ version: -1 });

    // Fallback to general discipline rubric
    if (!rubric) {
      rubric = await ScoringRubric.findOne({
        discipline: 'general',
        isActive: true
      }).sort({ version: -1 });
    }

    return rubric;
  }

  // Calculate scores based on rubric criteria
  async _calculateScores(session, performanceMetrics, rubric) {
    const criteriaScores = [];
    let totalCalculatedScore = 0;

    // Evaluate each competency area and criteria
    for (const area of rubric.competencyAreas) {
      for (const criterion of area.criteria) {
        const score = await this._evaluateCriterion(
          criterion, 
          session, 
          performanceMetrics
        );
        
        criteriaScores.push({
          area: area.area,
          criterionId: criterion.criterionId,
          criterionName: criterion.description,
          score: score,
          maxScore: criterion.maxScore,
          weight: criterion.weight
        });

        totalCalculatedScore += (score / criterion.maxScore) * criterion.weight;
      }
    }

    // Calculate overall score using rubric's method
    const calculatedScore = rubric.calculateScore(criteriaScores);

    return {
      calculatedScore,
      criteriaScores,
      rubricVersion: rubric.version
    };
  }

  // Evaluate a specific criterion
  async _evaluateCriterion(criterion, session, performanceMetrics) {
    const evaluationMethods = {
      // Clinical skills criteria
      'history_taking_completeness': () => 
        this._evaluateHistoryTaking(session, performanceMetrics),
      'physical_exam_accuracy': () => 
        this._evaluatePhysicalExam(session, performanceMetrics),
      'diagnostic_accuracy': () => 
        this._evaluateDiagnosticAccuracy(performanceMetrics),
      
      // Communication criteria
      'patient_communication': () => 
        this._evaluatePatientCommunication(session, performanceMetrics),
      'team_communication': () => 
        this._evaluateTeamCommunication(performanceMetrics),
      
      // Professionalism criteria
      'time_management': () => 
        this._evaluateTimeManagement(performanceMetrics),
      'safety_protocols': () => 
        this._evaluateSafetyProtocols(performanceMetrics),
      
      // Default evaluation method
      'default': () => Math.random() * 40 + 60 // 60-100 for demo
    };

    const evaluate = evaluationMethods[criterion.criterionId] || evaluationMethods.default;
    return await evaluate();
  }

  // Specific evaluation methods (placeholder implementations)
  async _evaluateHistoryTaking(session, performanceMetrics) {
    const completeness = performanceMetrics.dataCollectionMetrics?.completeness || 0;
    return Math.min(100, completeness * 100);
  }

  async _evaluatePhysicalExam(session, performanceMetrics) {
    const accuracy = performanceMetrics.clinicalSkillsMetrics?.physicalExamAccuracy || 0;
    return Math.min(100, accuracy * 100);
  }

  async _evaluateDiagnosticAccuracy(performanceMetrics) {
    const accuracy = performanceMetrics.diagnosticMetrics?.accuracy || 0;
    return Math.min(100, accuracy * 100);
  }

  async _evaluatePatientCommunication(session, performanceMetrics) {
    const communicationScore = performanceMetrics.communicationMetrics?.patientCommunication || 0;
    return Math.min(100, communicationScore * 100);
  }

  async _evaluateTeamCommunication(performanceMetrics) {
    const teamScore = performanceMetrics.communicationMetrics?.teamCommunication || 0;
    return Math.min(100, teamScore * 100);
  }

  async _evaluateTimeManagement(performanceMetrics) {
    const efficiency = performanceMetrics.timeMetrics?.efficiency || 0;
    return Math.min(100, efficiency * 100);
  }

  async _evaluateSafetyProtocols(performanceMetrics) {
    const safetyScore = performanceMetrics.safetyMetrics?.overallScore || 0;
    return Math.min(100, safetyScore * 100);
  }

  // Integrate AI evaluation with manual scoring
  _integrateAIEvaluation(manualScore, aiEvaluation) {
    const aiWeight = 0.3; // 30% weight to AI evaluation
    const manualWeight = 0.7; // 70% weight to manual scoring
    
    return Math.round(
      (manualScore * manualWeight) + 
      (aiEvaluation.confidenceScore * aiWeight)
    );
  }

  // Update competency assessment with scoring results
  async _updateCompetencyAssessment(userId, scoringResult, rubric) {
    try {
      let assessment = await CompetencyAssessment.findOne({ userId });
      if (!assessment) {
        // Initialize assessment if it doesn't exist
        const CompetencyAssessmentService = await import('./CompetencyAssessmentService.js');
        assessment = await CompetencyAssessmentService.default.initializeUserAssessment(userId);
      }

      // Map rubric areas to competencies
      for (const area of rubric.competencyAreas) {
        const areaScore = scoringResult.criteriaScores
          .filter(c => c.area === area.area)
          .reduce((sum, c) => sum + (c.score * c.weight), 0) / 
          scoringResult.criteriaScores.filter(c => c.area === area.area).reduce((sum, c) => sum + c.weight, 0);

        if (areaScore) {
          await this._updateCompetency(assessment, area.area, areaScore);
        }
      }

      await assessment.save();
    } catch (error) {
      logger.warn({ userId, error: error.message }, 'Failed to update competency assessment');
    }
  }

  async _updateCompetency(assessment, area, score) {
    const competency = assessment.competencies.find(comp => 
      comp.area === area || comp.competencyName.toLowerCase().includes(area.toLowerCase())
    );
    
    if (competency) {
      competency.confidenceScore = Math.max(competency.confidenceScore, score);
      competency.lastAssessed = new Date();
    }
  }

  // Get default rubrics configuration
  _getDefaultRubrics(userId) {
    return [
      {
        rubricId: 'MEDICAL-RUBRIC-2024',
        name: 'Medical Case Scoring Rubric 2024',
        discipline: 'medical',
        description: 'Comprehensive scoring rubric for medical case simulations',
        competencyAreas: [
          {
            area: 'clinical_skills',
            weight: 0.4,
            criteria: [
              {
                criterionId: 'history_taking_completeness',
                description: 'Completeness and accuracy of history taking',
                maxScore: 100,
                weight: 0.3,
                evaluationGuidelines: 'Assess thoroughness of patient history, including chief complaint, HPI, PMH, etc.',
                evidenceRequirements: ['case_narrative', 'documentation']
              },
              {
                criterionId: 'physical_exam_accuracy',
                description: 'Accuracy of physical examination findings',
                maxScore: 100,
                weight: 0.3,
                evaluationGuidelines: 'Evaluate appropriate physical exam techniques and accurate interpretation',
                evidenceRequirements: ['exam_documentation', 'findings']
              },
              {
                criterionId: 'diagnostic_accuracy',
                description: 'Accuracy of diagnostic reasoning',
                maxScore: 100,
                weight: 0.4,
                evaluationGuidelines: 'Assess appropriate differential diagnosis and diagnostic test selection',
                evidenceRequirements: ['differential_diagnosis', 'test_ordering']
              }
            ]
          },
          {
            area: 'communication',
            weight: 0.3,
            criteria: [
              {
                criterionId: 'patient_communication',
                description: 'Effectiveness of patient communication',
                maxScore: 100,
                weight: 0.6,
                evaluationGuidelines: 'Evaluate empathy, clarity, and patient-centered communication',
                evidenceRequirements: ['patient_interactions', 'communication_quality']
              },
              {
                criterionId: 'team_communication',
                description: 'Effectiveness of team communication',
                maxScore: 100,
                weight: 0.4,
                evaluationGuidelines: 'Assess clarity and appropriateness of team communication',
                evidenceRequirements: ['team_interactions', 'consultation_requests']
              }
            ]
          },
          {
            area: 'professionalism',
            weight: 0.3,
            criteria: [
              {
                criterionId: 'time_management',
                description: 'Efficiency in time management',
                maxScore: 100,
                weight: 0.5,
                evaluationGuidelines: 'Evaluate appropriate pacing and time utilization',
                evidenceRequirements: ['time_metrics', 'decision_timing']
              },
              {
                criterionId: 'safety_protocols',
                description: 'Adherence to safety protocols',
                maxScore: 100,
                weight: 0.5,
                evaluationGuidelines: 'Assess compliance with patient safety and infection control protocols',
                evidenceRequirements: ['safety_checks', 'protocol_adherence']
              }
            ]
          }
        ],
        passingScore: 70,
        createdBy: userId,
        metadata: {
          caseTypes: ['acute_care', 'chronic_care', 'emergency'],
          difficultyLevels: ['beginner', 'intermediate', 'advanced'],
          applicablePrograms: ['medical_school', 'residency', 'fellowship']
        }
      },
      // Additional default rubrics for other disciplines would be added here
      {
        rubricId: 'NURSING-RUBRIC-2024',
        name: 'Nursing Care Scoring Rubric 2024',
        discipline: 'nursing',
        description: 'Comprehensive scoring rubric for nursing care simulations',
        competencyAreas: [
          {
            area: 'nursing_process',
            weight: 0.5,
            criteria: [
              {
                criterionId: 'assessment_completeness',
                description: 'Completeness of nursing assessment',
                maxScore: 100,
                weight: 0.25,
                evaluationGuidelines: 'Evaluate thoroughness of patient assessment',
                evidenceRequirements: ['assessment_documentation']
              },
              {
                criterionId: 'care_plan_appropriateness',
                description: 'Appropriateness of nursing care plan',
                maxScore: 100,
                weight: 0.25,
                evaluationGuidelines: 'Assess relevance and completeness of care plan',
                evidenceRequirements: ['care_plan_documentation']
              },
              {
                criterionId: 'intervention_effectiveness',
                description: 'Effectiveness of nursing interventions',
                maxScore: 100,
                weight: 0.25,
                evaluationGuidelines: 'Evaluate appropriateness and effectiveness of interventions',
                evidenceRequirements: ['intervention_execution']
              },
              {
                criterionId: 'evaluation_accuracy',
                description: 'Accuracy of outcome evaluation',
                maxScore: 100,
                weight: 0.25,
                evaluationGuidelines: 'Assess proper evaluation of intervention outcomes',
                evidenceRequirements: ['outcome_documentation']
              }
            ]
          },
          {
            area: 'patient_safety',
            weight: 0.3,
            criteria: [
              {
                criterionId: 'medication_safety',
                description: 'Adherence to medication safety protocols',
                maxScore: 100,
                weight: 0.5,
                evaluationGuidelines: 'Evaluate proper medication administration and safety checks',
                evidenceRequirements: ['medication_documentation', 'safety_checks']
              },
              {
                criterionId: 'infection_control',
                description: 'Compliance with infection control protocols',
                maxScore: 100,
                weight: 0.5,
                evaluationGuidelines: 'Assess proper use of PPE and infection prevention measures',
                evidenceRequirements: ['ppe_usage', 'infection_control_actions']
              }
            ]
          },
          {
            area: 'communication',
            weight: 0.2,
            criteria: [
              {
                criterionId: 'patient_education',
                description: 'Effectiveness of patient education',
                maxScore: 100,
                weight: 0.6,
                evaluationGuidelines: 'Evaluate clarity and appropriateness of patient education',
                evidenceRequirements: ['education_provided', 'patient_understanding']
              },
              {
                criterionId: 'documentation_quality',
                description: 'Quality of nursing documentation',
                maxScore: 100,
                weight: 0.4,
                evaluationGuidelines: 'Assess completeness and accuracy of documentation',
                evidenceRequirements: ['charting_quality', 'documentation_timeliness']
              }
            ]
          }
        ],
        passingScore: 75,
        createdBy: userId,
        metadata: {
          caseTypes: ['medical_surgical', 'critical_care', 'pediatric', 'geriatric'],
          difficultyLevels: ['beginner', 'intermediate', 'advanced'],
          applicablePrograms: ['nursing_school', 'rn_training', 'apn_training']
        }
      }
    ];
  }

  // Get scoring statistics and analytics
  async getScoringAnalytics(rubricId, timeframe = '30d') {
    try {
      const startDate = this._calculateStartDate(timeframe);
      
      const sessions = await SessionModel.find({
        'scoringResults.rubricId': rubricId,
        'scoringResults.evaluatedAt': { $gte: startDate }
      });

      const scores = sessions.map(s => s.scoringResults.finalScore).filter(score => score !== undefined);
      
      if (scores.length === 0) {
        return { message: 'No scoring data available for the specified timeframe' };
      }

      return {
        totalAssessments: scores.length,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        passingRate: Math.round((scores.filter(s => s >= 70).length / scores.length) * 100),
        scoreDistribution: this._calculateScoreDistribution(scores),
        timeframe
      };
    } catch (error) {
      logger.error({ rubricId, error: error.message }, 'Error getting scoring analytics');
      throw error;
    }
  }

  _calculateStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setDate(now.getDate() - 30));
    }
  }

  _calculateScoreDistribution(scores) {
    const distribution = {
      '0-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80-89': 0,
      '90-100': 0
    };

    scores.forEach(score => {
      if (score < 60) distribution['0-59']++;
      else if (score < 70) distribution['60-69']++;
      else if (score < 80) distribution['70-79']++;
      else if (score < 90) distribution['80-89']++;
      else distribution['90-100']++;
    });

    return distribution;
  }
}

export default new ScoringService();