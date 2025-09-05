import FeedbackModel from '../models/FeedbackModel.js';
import SessionModel from '../models/SessionModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import CompetencyAssessment from '../models/CompetencyAssessmentModel.js';
import ScoringRubric from '../models/ScoringRubricModel.js';
import AIEvaluationService from './AIEvaluationService.js';
import AnalyticsService from './AnalyticsService.js';
import logger from '../config/logger.js';

class AdvancedFeedbackService {
  constructor() {
    this.feedbackTemplates = this._initializeFeedbackTemplates();
    this.improvementStrategies = this._initializeImprovementStrategies();
    this.learningResources = this._initializeLearningResources();
  }

  // Generate comprehensive feedback for a session
  async generateAdvancedFeedback(sessionId, evaluatorId = null) {
    try {
      const session = await SessionModel.findById(sessionId)
        .populate('caseId')
        .populate('userId');

      if (!session) {
        throw new Error('Session not found');
      }

      const performanceMetrics = await PerformanceMetrics.findOne({ sessionId });
      const competencyAssessment = await CompetencyAssessment.findOne({ 
        userId: session.userId 
      });
      const scoringResults = session.scoringResults;

      // Generate base feedback
      const feedback = await this._createFeedbackStructure(
        session, 
        performanceMetrics, 
        evaluatorId
      );

      // Add scoring-based insights if available
      if (scoringResults) {
        await this._addScoringInsights(feedback, scoringResults, session.caseId);
      }

      // Add competency assessment insights
      if (competencyAssessment) {
        await this._addCompetencyInsights(feedback, competencyAssessment);
      }

      // Add AI-powered evaluation if available
      if (AIEvaluationService.isAvailable()) {
        await this._addAIInsights(feedback, sessionId);
      }

      // Add performance trends and analytics
      await this._addAnalyticalInsights(feedback, session.userId);

      // Generate personalized recommendations
      await this._generatePersonalizedRecommendations(feedback);

      // Save the feedback
      const feedbackDoc = new FeedbackModel(feedback);
      await feedbackDoc.save();

      // Associate with session
      session.feedbackId = feedbackDoc._id;
      await session.save();

      logger.info({ 
        sessionId, 
        feedbackId: feedbackDoc._id 
      }, 'Advanced feedback generated successfully');

      return feedbackDoc;
    } catch (error) {
      logger.error({ sessionId, error: error.message }, 'Error generating advanced feedback');
      throw error;
    }
  }

  // Create the basic feedback structure
  async _createFeedbackStructure(session, performanceMetrics, evaluatorId) {
    return {
      sessionId: session._id,
      userId: session.userId._id,
      caseId: session.caseId._id,
      evaluatorId: evaluatorId,
      overallScore: performanceMetrics?.overallScore || 0,
      categoryScores: {
        clinicalSkills: performanceMetrics?.clinicalSkillsMetrics || {},
        communication: performanceMetrics?.communicationMetrics || {},
        professionalism: performanceMetrics?.professionalismMetrics || {},
        technicalSkills: performanceMetrics?.technicalSkillsMetrics || {}
      },
      strengths: [],
      areasForImprovement: [],
      specificRecommendations: [],
      learningObjectives: [],
      resourceSuggestions: [],
      performanceTrend: {},
      competencyGaps: [],
      riskFactors: [],
      generatedAt: new Date(),
      feedbackType: 'comprehensive',
      metadata: {
        caseDifficulty: session.caseId?.difficulty,
        caseSpecialty: session.caseId?.specialty,
        sessionDuration: session.duration,
        decisionCount: session.decisions?.length || 0
      }
    };
  }

  // Add insights based on scoring results
  async _addScoringInsights(feedback, scoringResults, caseData) {
    const rubric = await ScoringRubric.findOne({ 
      rubricId: scoringResults.rubricId 
    });

    if (!rubric) return;

    feedback.scoringInsights = {
      rubricName: rubric.name,
      finalScore: scoringResults.finalScore,
      performanceLevel: scoringResults.performanceLevel,
      criteriaBreakdown: scoringResults.criteriaScores || []
    };

    // Add strengths and areas for improvement based on scoring
    this._analyzeScoringPatterns(feedback, scoringResults, rubric);
  }

  _analyzeScoringPatterns(feedback, scoringResults, rubric) {
    const { criteriaScores } = scoringResults;

    // Identify top strengths (scores > 80)
    const strengths = criteriaScores
      .filter(criterion => criterion.score >= 80)
      .map(criterion => ({
        area: criterion.area,
        criterion: criterion.criterionName,
        score: criterion.score,
        comment: this._getStrengthComment(criterion.area, criterion.score)
      }));

    // Identify areas for improvement (scores < 70)
    const improvements = criteriaScores
      .filter(criterion => criterion.score < 70)
      .map(criterion => ({
        area: criterion.area,
        criterion: criterion.criterionName,
        score: criterion.score,
        gap: 70 - criterion.score,
        comment: this._getImprovementComment(criterion.area, criterion.score)
      }));

    feedback.strengths.push(...strengths);
    feedback.areasForImprovement.push(...improvements);
  }

  // Add insights from competency assessment
  async _addCompetencyInsights(feedback, competencyAssessment) {
    const weakCompetencies = competencyAssessment.competencies
      .filter(comp => comp.confidenceScore < 70)
      .map(comp => ({
        competency: comp.competencyName,
        currentLevel: comp.currentLevel,
        targetLevel: comp.targetLevel,
        confidenceScore: comp.confidenceScore,
        lastAssessed: comp.lastAssessed
      }));

    feedback.competencyGaps = weakCompetencies;

    // Add recommendations based on competency gaps
    weakCompetencies.forEach(gap => {
      feedback.specificRecommendations.push(
        ...this._getCompetencyRecommendations(gap.competency, gap.confidenceScore)
      );
    });
  }

  // Add AI-powered insights
  async _addAIInsights(feedback, sessionId) {
    try {
      const aiEvaluation = await AIEvaluationService.evaluateSession(sessionId);
      
      feedback.aiInsights = {
        confidenceScore: aiEvaluation.confidenceScore,
        detailedScores: aiEvaluation.detailedScores,
        patternAnalysis: aiEvaluation.patternAnalysis
      };

      // Incorporate AI-generated feedback
      if (aiEvaluation.strengths) {
        feedback.strengths.push(...aiEvaluation.strengths);
      }
      if (aiEvaluation.areasForImprovement) {
        feedback.areasForImprovement.push(...aiEvaluation.areasForImprovement);
      }
      if (aiEvaluation.recommendations) {
        feedback.specificRecommendations.push(...aiEvaluation.recommendations);
      }
    } catch (error) {
      logger.warn({ sessionId, error: error.message }, 'AI insights unavailable for feedback');
    }
  }

  // Add analytical insights from performance trends
  async _addAnalyticalInsights(feedback, userId) {
    try {
      const trends = await AnalyticsService.getUserPerformanceTrends(userId, 30);
      const weakAreas = await AnalyticsService.getWeakAreas(userId);
      const competencyGaps = await AnalyticsService.getCompetencyGaps(userId);

      feedback.performanceTrend = trends;
      feedback.analytics = {
        weakAreas,
        competencyGaps,
        improvementRate: trends.improvementRate,
        performanceLevel: trends.performanceLevel
      };

      // Add trend-based recommendations
      this._addTrendBasedRecommendations(feedback, trends, weakAreas);
    } catch (error) {
      logger.warn({ userId, error: error.message }, 'Analytical insights unavailable');
    }
  }

  // Generate personalized recommendations
  async _generatePersonalizedRecommendations(feedback) {
    const recommendations = new Set();

    // Add recommendations from scoring insights
    if (feedback.areasForImprovement) {
      feedback.areasForImprovement.forEach(area => {
        const recs = this._getRecommendationsForArea(area.area, area.score);
        recs.forEach(rec => recommendations.add(rec));
      });
    }

    // Add recommendations from competency gaps
    if (feedback.competencyGaps) {
      feedback.competencyGaps.forEach(gap => {
        const recs = this._getCompetencyRecommendations(gap.competency, gap.confidenceScore);
        recs.forEach(rec => recommendations.add(rec));
      });
    }

    // Add recommendations from analytics
    if (feedback.analytics?.weakAreas) {
      feedback.analytics.weakAreas.forEach(area => {
        const recs = this._getRecommendationsForCategory(area.category, area.averageScore);
        recs.forEach(rec => recommendations.add(rec));
      });
    }

    // Convert to array and add to feedback
    feedback.specificRecommendations = [
      ...feedback.specificRecommendations,
      ...Array.from(recommendations)
    ].slice(0, 10); // Limit to top 10 recommendations

    // Add learning objectives
    feedback.learningObjectives = this._generateLearningObjectives(feedback);

    // Add resource suggestions
    feedback.resourceSuggestions = this._suggestLearningResources(feedback);
  }

  // Generate learning objectives based on feedback
  _generateLearningObjectives(feedback) {
    const objectives = [];

    if (feedback.areasForImprovement) {
      feedback.areasForImprovement.forEach(area => {
        objectives.push({
          objective: `Improve ${area.area} skills to achieve minimum proficiency (70%)`,
          timeline: '2-4 weeks',
          successCriteria: `Score ≥70% on ${area.criterion} in next assessment`
        });
      });
    }

    if (feedback.competencyGaps) {
      feedback.competencyGaps.forEach(gap => {
        objectives.push({
          objective: `Develop ${gap.competency} competency from ${gap.currentLevel} to ${gap.targetLevel} level`,
          timeline: '1-2 months',
          successCriteria: `Achieve ${gap.targetLevel} level in competency assessment`
        });
      });
    }

    return objectives.slice(0, 5); // Limit to top 5 objectives
  }

  // Suggest learning resources based on needs
  _suggestLearningResources(feedback) {
    const resources = new Set();

    // Add resources based on weak areas
    if (feedback.areasForImprovement) {
      feedback.areasForImprovement.forEach(area => {
        const areaResources = this.learningResources[area.area] || [];
        areaResources.forEach(resource => resources.add(resource));
      });
    }

    // Add resources based on competency gaps
    if (feedback.competencyGaps) {
      feedback.competencyGaps.forEach(gap => {
        const compResources = this.learningResources[gap.competency] || [];
        compResources.forEach(resource => resources.add(resource));
      });
    }

    return Array.from(resources).slice(0, 8); // Limit to 8 resources
  }

  // Add recommendations based on performance trends
  _addTrendBasedRecommendations(feedback, trends, weakAreas) {
    if (trends.improvementRate < 0) {
      feedback.specificRecommendations.push(
        'Focus on consistent practice and review foundational concepts'
      );
    }

    if (weakAreas.length > 0) {
      weakAreas.forEach(area => {
        feedback.specificRecommendations.push(
          `Prioritize improvement in ${area.category} (current: ${area.averageScore}%)`
        );
      });
    }
  }

  // Template-based comment generation
  _getStrengthComment(area, score) {
    const templates = this.feedbackTemplates.strengths[area] || 
                     this.feedbackTemplates.strengths.general;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  _getImprovementComment(area, score) {
    const templates = this.feedbackTemplates.improvements[area] || 
                     this.feedbackTemplates.improvements.general;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  _getRecommendationsForArea(area, score) {
    return this.improvementStrategies[area] || 
           this.improvementStrategies.general;
  }

  _getCompetencyRecommendations(competency, score) {
    return this.improvementStrategies[competency] || 
           this.improvementStrategies.general;
  }

  _getRecommendationsForCategory(category, score) {
    return this.improvementStrategies[category] || 
           this.improvementStrategies.general;
  }

  // Initialize feedback templates
  _initializeFeedbackTemplates() {
    return {
      strengths: {
        clinical_skills: [
          'Excellent clinical reasoning and diagnostic skills demonstrated',
          'Strong patient assessment and physical examination techniques',
          'Proficient in clinical procedures and interventions',
          'Thorough and accurate diagnostic workup'
        ],
        communication: [
          'Exceptional patient communication and empathy',
          'Clear and effective team communication',
          'Professional and compassionate patient interactions',
          'Excellent documentation and charting skills'
        ],
        professionalism: [
          'Maintains high standards of medical professionalism',
          'Excellent time management and organizational skills',
          'Strong ethical decision-making and patient advocacy',
          'Demonstrates leadership and teamwork abilities'
        ],
        general: [
          'Strong performance across multiple competencies',
          'Demonstrates good clinical judgment and decision-making',
          'Shows excellent learning and adaptation skills'
        ]
      },
      improvements: {
        clinical_skills: [
          'Work on more comprehensive differential diagnoses',
          'Practice systematic patient assessment techniques',
          'Improve accuracy in diagnostic test interpretation',
          'Develop more efficient clinical decision-making'
        ],
        communication: [
          'Improve patient education and explanation skills',
          'Work on more structured communication approaches',
          'Enhance documentation completeness and clarity',
          'Develop more effective team communication strategies'
        ],
        professionalism: [
          'Focus on time management and efficiency',
          'Work on stress management and composure',
          'Improve adherence to safety protocols',
          'Develop more consistent professional demeanor'
        ],
        general: [
          'Focus on consistent practice and skill development',
          'Work on identified areas for improvement',
          'Seek additional learning opportunities in weak areas'
        ]
      }
    };
  }

  // Initialize improvement strategies
  _initializeImprovementStrategies() {
    return {
      clinical_skills: [
        'Practice with simulated cases focusing on diagnostic reasoning',
        'Review evidence-based clinical guidelines and protocols',
        'Work on systematic approach to patient assessment',
        'Participate in clinical skills workshops or training'
      ],
      communication: [
        'Practice patient communication with standardized patients',
        'Review effective communication techniques and frameworks',
        'Work on structured patient education approaches',
        'Participate in communication skills training sessions'
      ],
      professionalism: [
        'Focus on time management and prioritization exercises',
        'Review ethical decision-making frameworks',
        'Practice stress management and composure techniques',
        'Participate in professional development workshops'
      ],
      general: [
        'Create a personalized learning plan targeting weak areas',
        'Seek mentorship or coaching from experienced clinicians',
        'Use spaced repetition for knowledge retention',
        'Engage in reflective practice after each session'
      ]
    };
  }

  // Initialize learning resources
  _initializeLearningResources() {
    return {
      clinical_skills: [
        'Clinical Skills Handbook',
        'Procedural Videos Library',
        'Diagnostic Reasoning Modules',
        'Physical Exam Tutorials'
      ],
      communication: [
        'Patient Communication Guide',
        'Team Communication Framework',
        'Documentation Standards Manual',
        'Empathy Building Exercises'
      ],
      professionalism: [
        'Time Management Toolkit',
        'Ethical Decision Making Guide',
        'Professionalism Standards',
        'Stress Management Resources'
      ],
      general: [
        'Learning Platform Courses',
        'Clinical Case Library',
        'Skill Assessment Tools',
        'Peer Learning Groups'
      ]
    };
  }

  // Get feedback for a user with advanced filtering
  async getUserFeedback(userId, options = {}) {
    try {
      const {
        limit = 10,
        timeframe = '30d',
        minScore = 0,
        maxScore = 100,
        feedbackType
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      const query = {
        userId,
        generatedAt: { $gte: startDate },
        overallScore: { $gte: minScore, $lte: maxScore }
      };

      if (feedbackType) {
        query.feedbackType = feedbackType;
      }

      const feedback = await FeedbackModel.find(query)
        .populate('caseId', 'title specialty difficulty')
        .populate('evaluatorId', 'name role')
        .sort({ generatedAt: -1 })
        .limit(limit);

      return feedback;
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Error retrieving user feedback');
      throw error;
    }
  }

  // Generate feedback comparison report
  async generateFeedbackComparison(userId, timeframe = '90d') {
    try {
      const feedbacks = await this.getUserFeedback(userId, { 
        timeframe, 
        limit: 50 
      });

      if (feedbacks.length === 0) {
        return { message: 'No feedback data available for comparison' };
      }

      const comparison = {
        totalSessions: feedbacks.length,
        averageScore: Math.round(feedbacks.reduce((sum, fb) => sum + fb.overallScore, 0) / feedbacks.length),
        scoreTrend: this._calculateScoreTrend(feedbacks),
        commonStrengths: this._identifyCommonPatterns(feedbacks, 'strengths'),
        commonImprovements: this._identifyCommonPatterns(feedbacks, 'areasForImprovement'),
        recommendationSummary: this._summarizeRecommendations(feedbacks),
        progressAssessment: this._assessProgress(feedbacks)
      };

      return comparison;
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Error generating feedback comparison');
      throw error;
    }
  }

  _calculateScoreTrend(feedbacks) {
    const sorted = feedbacks.sort((a, b) => a.generatedAt - b.generatedAt);
    const scores = sorted.map(fb => fb.overallScore);
    
    if (scores.length < 2) return 'insufficient_data';

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const avgFirst = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    if (avgSecond > avgFirst + 5) return 'improving';
    if (avgSecond < avgFirst - 5) return 'declining';
    return 'stable';
  }

  _identifyCommonPatterns(feedbacks, field) {
    const patterns = new Map();

    feedbacks.forEach(fb => {
      const items = fb[field] || [];
      items.forEach(item => {
        const key = typeof item === 'string' ? item : item.area || item.criterion;
        patterns.set(key, (patterns.get(key) || 0) + 1);
      });
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, frequency: count }));
  }

  _summarizeRecommendations(feedbacks) {
    const recs = new Map();

    feedbacks.forEach(fb => {
      fb.specificRecommendations?.forEach(rec => {
        recs.set(rec, (recs.get(rec) || 0) + 1);
      });
    });

    return Array.from(recs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([recommendation, frequency]) => ({ recommendation, frequency }));
  }

  _assessProgress(feedbacks) {
    const recentScores = feedbacks
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, 5)
      .map(fb => fb.overallScore);

    if (recentScores.length < 3) return 'insufficient_data';

    const avgRecent = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const allScores = feedbacks.map(fb => fb.overallScore);
    const avgOverall = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

    if (avgRecent > avgOverall + 8) return 'significant_improvement';
    if (avgRecent > avgOverall + 3) return 'moderate_improvement';
    if (avgRecent < avgOverall - 8) return 'significant_decline';
    if (avgRecent < avgOverall - 3) return 'moderate_decline';
    return 'consistent_performance';
  }
}

export default new AdvancedFeedbackService();