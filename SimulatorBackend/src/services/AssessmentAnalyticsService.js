import SessionModel from '../models/SessionModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import CompetencyAssessment from '../models/CompetencyAssessmentModel.js';
import ScoringValidation from '../models/ScoringValidationModel.js';
import FeedbackModel from '../models/FeedbackModel.js';
import AnalyticsService from './AnalyticsService.js';
import logger from '../config/logger.js';

class AssessmentAnalyticsService {
  constructor() {
    this.performanceBenchmarks = {
      novice: { min: 0, max: 59 },
      competent: { min: 60, max: 74 },
      proficient: { min: 75, max: 84 },
      advanced: { min: 85, max: 94 },
      expert: { min: 95, max: 100 }
    };
  }

  // Get comprehensive assessment analytics for a user
  async getUserAssessmentAnalytics(userId, timeframe = '90d') {
    try {
      const startDate = this._calculateStartDate(timeframe);
      
      const [
        performanceTrends,
        competencyGaps,
        predictiveInsights,
        reliabilityStats
      ] = await Promise.all([
        this._analyzePerformanceTrends(userId, startDate),
        this._identifyCompetencyGaps(userId, startDate),
        this._generatePredictiveInsights(userId, startDate),
        this._calculateReliabilityStatistics(userId, startDate)
      ]);

      return {
        userId,
        timeframe,
        generatedAt: new Date(),
        performanceTrends,
        competencyGaps,
        predictiveInsights,
        reliabilityStats,
        overallAssessment: this._generateOverallAssessment(performanceTrends, competencyGaps)
      };
    } catch (error) {
      logger.error({ userId, error: error.message }, 'Error generating assessment analytics');
      throw error;
    }
  }

  // Analyze performance trends over time
  async _analyzePerformanceTrends(userId, startDate) {
    const sessions = await SessionModel.find({
      userId,
      completedAt: { $gte: startDate },
      'scoringResults.finalScore': { $exists: true }
    })
      .populate('caseId', 'title specialty difficulty')
      .sort({ completedAt: 1 });

    if (sessions.length === 0) {
      return { message: 'No scored sessions available for trend analysis' };
    }

    const trends = {
      overallScores: [],
      categoryTrends: {
        clinicalSkills: [],
        communication: [],
        professionalism: [],
        technicalSkills: []
      },
      difficultyPerformance: {},
      specialtyPerformance: {}
    };

    // Calculate overall score trends
    sessions.forEach(session => {
      const scoreData = {
        date: session.completedAt,
        score: session.scoringResults.finalScore,
        caseId: session.caseId._id,
        caseTitle: session.caseId.title,
        difficulty: session.caseId.difficulty,
        specialty: session.caseId.specialty
      };
      trends.overallScores.push(scoreData);

      // Track performance by difficulty
      if (!trends.difficultyPerformance[session.caseId.difficulty]) {
        trends.difficultyPerformance[session.caseId.difficulty] = {
          totalSessions: 0,
          totalScore: 0,
          sessions: []
        };
      }
      trends.difficultyPerformance[session.caseId.difficulty].totalSessions++;
      trends.difficultyPerformance[session.caseId.difficulty].totalScore += session.scoringResults.finalScore;
      trends.difficultyPerformance[session.caseId.difficulty].sessions.push(scoreData);

      // Track performance by specialty
      if (!trends.specialtyPerformance[session.caseId.specialty]) {
        trends.specialtyPerformance[session.caseId.specialty] = {
          totalSessions: 0,
          totalScore: 0,
          sessions: []
        };
      }
      trends.specialtyPerformance[session.caseId.specialty].totalSessions++;
      trends.specialtyPerformance[session.caseId.specialty].totalScore += session.scoringResults.finalScore;
      trends.specialtyPerformance[session.caseId.specialty].sessions.push(scoreData);
    });

    // Calculate average scores
    Object.keys(trends.difficultyPerformance).forEach(difficulty => {
      const data = trends.difficultyPerformance[difficulty];
      data.averageScore = Math.round(data.totalScore / data.totalSessions);
      delete data.totalScore;
    });

    Object.keys(trends.specialtyPerformance).forEach(specialty => {
      const data = trends.specialtyPerformance[specialty];
      data.averageScore = Math.round(data.totalScore / data.totalSessions);
      delete data.totalScore;
    });

    // Calculate trend metrics
    trends.metrics = this._calculateTrendMetrics(trends.overallScores);

    return trends;
  }

  // Identify competency gaps based on performance
  async _identifyCompetencyGaps(userId, startDate) {
    const competencyAssessment = await CompetencyAssessment.findOne({ userId });
    if (!competencyAssessment) {
      return { message: 'No competency assessment data available' };
    }

    const sessions = await SessionModel.find({
      userId,
      completedAt: { $gte: startDate },
      'scoringResults.finalScore': { $exists: true }
    }).populate('caseId', 'specialty');

    const gaps = competencyAssessment.competencies
      .filter(comp => comp.confidenceScore < 70)
      .map(comp => ({
        competency: comp.competencyName,
        area: comp.area,
        currentLevel: comp.currentLevel,
        targetLevel: comp.targetLevel,
        confidenceScore: comp.confidenceScore,
        gapSize: 70 - comp.confidenceScore,
        lastAssessed: comp.lastAssessed,
        performanceEvidence: this._gatherPerformanceEvidence(comp.competencyName, sessions),
        recommendedActions: this._generateCompetencyRecommendations(comp.competencyName, comp.confidenceScore)
      }));

    return {
      totalGaps: gaps.length,
      gaps: gaps.sort((a, b) => b.gapSize - a.gapSize),
      priorityGaps: gaps.filter(gap => gap.gapSize > 20).slice(0, 3)
    };
  }

  // Generate predictive insights for learning outcomes
  async _generatePredictiveInsights(userId, startDate) {
    const sessions = await SessionModel.find({
      userId,
      completedAt: { $gte: startDate },
      'scoringResults.finalScore': { $exists: true }
    }).sort({ completedAt: 1 });

    if (sessions.length < 5) {
      return { message: 'Insufficient data for predictive analysis' };
    }

    const scores = sessions.map(s => s.scoringResults.finalScore);
    const currentPerformance = scores.slice(-5); // Last 5 sessions

    const predictions = {
      currentLevel: this._determinePerformanceLevel(currentPerformance.reduce((a, b) => a + b, 0) / currentPerformance.length),
      projectedLevel: this._predictFutureLevel(scores),
      timeToProficiency: this._estimateTimeToProficiency(scores),
      riskFactors: this._identifyRiskFactors(sessions),
      successProbability: this._calculateSuccessProbability(scores)
    };

    return predictions;
  }

  // Calculate reliability and validity statistics
  async _calculateReliabilityStatistics(userId, startDate) {
    const validations = await ScoringValidation.find({
      $or: [
        { primaryEvaluatorId: userId },
        { 'secondaryScores.evaluatorId': userId }
      ],
      createdAt: { $gte: startDate }
    });

    if (validations.length === 0) {
      return { message: 'No validation data available' };
    }

    const reliabilityStats = {
      totalValidations: validations.length,
      interRaterReliability: this._calculateAverageReliability(validations),
      scoreConsistency: this._calculateScoreConsistency(validations),
      validationFlags: this._analyzeValidationPatterns(validations),
      evaluatorPerformance: await this._evaluateEvaluatorPerformance(userId, validations)
    };

    return reliabilityStats;
  }

  // Helper methods
  _calculateStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '180d': return new Date(now.setDate(now.getDate() - 180));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setDate(now.getDate() - 90));
    }
  }

  _calculateTrendMetrics(scores) {
    if (scores.length < 2) {
      return {
        trend: 'insufficient_data',
        improvementRate: 0,
        consistency: 'unknown',
        volatility: 0
      };
    }

    const scoreValues = scores.map(s => s.score);
    const firstThird = scoreValues.slice(0, Math.floor(scoreValues.length / 3));
    const lastThird = scoreValues.slice(-Math.floor(scoreValues.length / 3));

    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    const improvementRate = ((avgLast - avgFirst) / avgFirst) * 100;

    // Calculate consistency (standard deviation)
    const mean = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
    const variance = scoreValues.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scoreValues.length;
    const stdDev = Math.sqrt(variance);

    return {
      trend: improvementRate > 5 ? 'improving' : improvementRate < -5 ? 'declining' : 'stable',
      improvementRate: Math.round(improvementRate),
      consistency: stdDev < 10 ? 'high' : stdDev < 20 ? 'moderate' : 'low',
      volatility: Math.round(stdDev),
      averageScore: Math.round(mean)
    };
  }

  _gatherPerformanceEvidence(competency, sessions) {
    const evidence = sessions.filter(session => 
      session.scoringResults?.criteriaScores?.some(c => 
        c.area.toLowerCase().includes(competency.toLowerCase()) ||
        c.criterionName.toLowerCase().includes(competency.toLowerCase())
      )
    ).map(session => ({
      sessionId: session._id,
      caseTitle: session.caseId?.title,
      score: session.scoringResults.criteriaScores.find(c => 
        c.area.toLowerCase().includes(competency.toLowerCase()) ||
        c.criterionName.toLowerCase().includes(competency.toLowerCase())
      )?.score || 0,
      date: session.completedAt
    }));

    return evidence.slice(0, 5); // Return top 5 evidence points
  }

  _generateCompetencyRecommendations(competency, score) {
    const recommendations = {
      clinical_skills: [
        'Practice with procedural simulation modules',
        'Review clinical guidelines and protocols',
        'Participate in hands-on workshops',
        'Seek mentorship from experienced clinicians'
      ],
      communication: [
        'Practice patient communication scenarios',
        'Review effective communication frameworks',
        'Participate in role-playing exercises',
        'Seek feedback on communication style'
      ],
      professionalism: [
        'Review ethical decision-making frameworks',
        'Practice time management techniques',
        'Participate in professional development workshops',
        'Seek mentorship on professional conduct'
      ],
      general: [
        'Create a personalized learning plan',
        'Use spaced repetition for knowledge retention',
        'Engage in reflective practice after each session',
        'Seek diverse learning opportunities'
      ]
    };

    const area = competency.toLowerCase().includes('clinical') ? 'clinical_skills' :
                 competency.toLowerCase().includes('communication') ? 'communication' :
                 competency.toLowerCase().includes('professional') ? 'professionalism' : 'general';

    return recommendations[area].slice(0, 2); // Return top 2 recommendations
  }

  _determinePerformanceLevel(score) {
    for (const [level, range] of Object.entries(this.performanceBenchmarks)) {
      if (score >= range.min && score <= range.max) {
        return level;
      }
    }
    return 'novice';
  }

  _predictFutureLevel(scores) {
    if (scores.length < 10) return 'insufficient_data';

    const recentScores = scores.slice(-10);
    const trend = this._calculateTrendMetrics(recentScores.map((s, i) => ({ score: s, date: new Date() })));

    if (trend.improvementRate > 10) return 'rapid_improvement';
    if (trend.improvementRate > 5) return 'steady_improvement';
    if (trend.improvementRate < -5) return 'potential_decline';
    return 'maintaining_current_level';
  }

  _estimateTimeToProficiency(scores) {
    if (scores.length < 8) return 'insufficient_data';

    const recentAvg = scores.slice(-8).reduce((a, b) => a + b, 0) / 8;
    const improvementRate = this._calculateTrendMetrics(scores.map((s, i) => ({ score: s, date: new Date() }))).improvementRate;

    if (recentAvg >= 85) return 'already_proficient';
    if (improvementRate <= 0) return 'indeterminate_no_improvement';

    const pointsNeeded = 85 - recentAvg;
    const weeksNeeded = Math.ceil(pointsNeeded / (improvementRate / 4)); // Assuming 4 weeks per improvement point

    if (weeksNeeded > 26) return 'long_term_6+_months';
    if (weeksNeeded > 12) return 'medium_term_3-6_months';
    return `short_term_${weeksNeeded}_weeks`;
  }

  _identifyRiskFactors(sessions) {
    const factors = [];
    const lowScores = sessions.filter(s => s.scoringResults.finalScore < 60);

    if (lowScores.length > sessions.length * 0.3) {
      factors.push('consistent_low_performance');
    }

    const decliningTrend = this._calculateTrendMetrics(
      sessions.map(s => ({ score: s.scoringResults.finalScore, date: s.completedAt }))
    ).trend === 'declining';

    if (decliningTrend) {
      factors.push('performance_decline');
    }

    const highVolatility = this._calculateTrendMetrics(
      sessions.map(s => ({ score: s.scoringResults.finalScore, date: s.completedAt }))
    ).volatility > 15;

    if (highVolatility) {
      factors.push('inconsistent_performance');
    }

    return factors.length > 0 ? factors : ['no_significant_risk_factors'];
  }

  _calculateSuccessProbability(scores) {
    if (scores.length < 5) return 50; // Default if insufficient data

    const recentScores = scores.slice(-5);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = this._calculateTrendMetrics(scores.map((s, i) => ({ score: s, date: new Date() })));

    let probability = avgScore; // Base probability on current performance

    // Adjust based on trend
    if (trend.trend === 'improving') probability += 10;
    if (trend.trend === 'declining') probability -= 10;

    // Adjust based on consistency
    if (trend.consistency === 'high') probability += 5;
    if (trend.consistency === 'low') probability -= 5;

    return Math.max(0, Math.min(100, Math.round(probability)));
  }

  _calculateAverageReliability(validations) {
    const reliabilities = validations.map(v => v.interRaterReliability).filter(r => r !== null);
    if (reliabilities.length === 0) return 0;

    return reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;
  }

  _calculateScoreConsistency(validations) {
    const scores = validations.flatMap(v => [
      v.primaryScore,
      ...v.secondaryScores.map(s => s.score)
    ]);

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return {
      averageScore: Math.round(mean),
      standardDeviation: Math.round(Math.sqrt(variance)),
      scoreRange: { min: Math.min(...scores), max: Math.max(...scores) }
    };
  }

  _analyzeValidationPatterns(validations) {
    const flags = {
      highVariance: validations.filter(v => v.flags?.includes('high_variance')).length,
      outliers: validations.filter(v => v.flags?.includes('outlier')).length,
      inconsistencies: validations.filter(v => v.flags?.includes('inconsistent')).length,
      needsReview: validations.filter(v => v.validationStatus === 'needs_review').length
    };

    return flags;
  }

  async _evaluateEvaluatorPerformance(userId, validations) {
    const userValidations = validations.filter(v => 
      v.primaryEvaluatorId.toString() === userId.toString() ||
      v.secondaryScores.some(s => s.evaluatorId.toString() === userId.toString())
    );

    if (userValidations.length === 0) {
      return { message: 'No evaluation data available for this user' };
    }

    const primaryEvals = userValidations.filter(v => v.primaryEvaluatorId.toString() === userId.toString());
    const secondaryEvals = userValidations.filter(v => 
      v.secondaryScores.some(s => s.evaluatorId.toString() === userId.toString())
    );

    return {
      totalEvaluations: userValidations.length,
      asPrimary: primaryEvals.length,
      asSecondary: secondaryEvals.length,
      averageReliability: this._calculateAverageReliability(userValidations),
      validationRate: Math.round((userValidations.filter(v => v.validationStatus === 'validated').length / userValidations.length) * 100),
      flagRate: Math.round((userValidations.filter(v => v.flags && v.flags.length > 0).length / userValidations.length) * 100)
    };
  }

  _generateOverallAssessment(performanceTrends, competencyGaps) {
    const assessment = {
      performanceLevel: 'unknown',
      readiness: 'unknown',
      developmentNeeds: 'unknown',
      recommendation: 'Continue current learning path'
    };

    if (performanceTrends.metrics && performanceTrends.metrics.averageScore) {
      assessment.performanceLevel = this._determinePerformanceLevel(performanceTrends.metrics.averageScore);
      assessment.readiness = performanceTrends.metrics.averageScore >= 75 ? 'ready_for_advancement' : 'needs_development';
    }

    if (competencyGaps.totalGaps > 0) {
      assessment.developmentNeeds = competencyGaps.priorityGaps.length > 0 ? 'high_priority' : 'moderate_priority';
      assessment.recommendation = `Focus on addressing ${competencyGaps.priorityGaps.length} priority competency gaps`;
    }

    return assessment;
  }

  // Get analytics for multiple users (for educators)
  async getBatchAssessmentAnalytics(userIds, timeframe = '90d') {
    try {
      const analytics = await Promise.all(
        userIds.map(userId => this.getUserAssessmentAnalytics(userId, timeframe))
      );

      return {
        totalUsers: userIds.length,
        timeframe,
        generatedAt: new Date(),
        userAnalytics: analytics,
        comparativeMetrics: this._generateComparativeMetrics(analytics)
      };
    } catch (error) {
      logger.error({ userIds, error: error.message }, 'Error generating batch assessment analytics');
      throw error;
    }
  }

  _generateComparativeMetrics(analytics) {
    const validAnalytics = analytics.filter(a => !a.message);
    if (validAnalytics.length === 0) {
      return { message: 'No valid analytics data for comparison' };
    }

    const scores = validAnalytics.map(a => a.performanceTrends.metrics?.averageScore || 0);
    const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      averageScore: Math.round(meanScore),
      scoreDistribution: this._calculateScoreDistribution(scores),
      performancePercentiles: this._calculatePercentiles(scores),
      topPerformers: validAnalytics
        .filter(a => (a.performanceTrends.metrics?.averageScore || 0) >= meanScore + 10)
        .slice(0, 5),
      needsSupport: validAnalytics
        .filter(a => (a.performanceTrends.metrics?.averageScore || 0) <= meanScore - 10)
        .slice(0, 5)
    };
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

  _calculatePercentiles(scores) {
    const sorted = [...scores].sort((a, b) => a - b);
    return {
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.9)]
    };
  }

  // Get validity analytics for assessment system
  async getValidityAnalytics(timeframe = '365d') {
    try {
      const startDate = this._calculateStartDate(timeframe);
      
      const [
        scoreDistributions,
        reliabilityTrends,
        criterionAnalysis
      ] = await Promise.all([
        this._analyzeScoreDistributions(startDate),
        this._analyzeReliabilityTrends(startDate),
        this._analyzeCriterionValidity(startDate)
      ]);

      return {
        timeframe,
        generatedAt: new Date(),
        scoreDistributions,
        reliabilityTrends,
        criterionAnalysis,
        validityIndicators: this._calculateValidityIndicators(scoreDistributions, reliabilityTrends)
      };
    } catch (error) {
      logger.error({ timeframe, error: error.message }, 'Error generating validity analytics');
      throw error;
    }
  }

  async _analyzeScoreDistributions(startDate) {
    const sessions = await SessionModel.find({
      completedAt: { $gte: startDate },
      'scoringResults.finalScore': { $exists: true }
    });

    const scores = sessions.map(s => s.scoringResults.finalScore);
    
    return {
      totalSessions: scores.length,
      meanScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      scoreDistribution: this._calculateScoreDistribution(scores),
      skewness: this._calculateSkewness(scores),
      kurtosis: this._calculateKurtosis(scores)
    };
  }

  async _analyzeReliabilityTrends(startDate) {
    const validations = await ScoringValidation.find({
      createdAt: { $gte: startDate },
      interRaterReliability: { $exists: true }
    }).sort({ createdAt: 1 });

    const monthlyReliability = {};
    validations.forEach(validation => {
      const month = validation.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyReliability[month]) {
        monthlyReliability[month] = { total: 0, count: 0 };
      }
      monthlyReliability[month].total += validation.interRaterReliability;
      monthlyReliability[month].count++;
    });

    const trends = Object.entries(monthlyReliability).map(([month, data]) => ({
      month,
      averageReliability: data.total / data.count,
      dataPoints: data.count
    }));

    return {
      totalValidations: validations.length,
      averageReliability: validations.reduce((sum, v) => sum + v.interRaterReliability, 0) / validations.length,
      monthlyTrends: trends,
      consistency: this._calculateReliabilityConsistency(trends.map(t => t.averageReliability))
    };
  }

  async _analyzeCriterionValidity(startDate) {
    // This would require more detailed data about criterion-level scoring
    // Placeholder implementation
    return {
      message: 'Criterion validity analysis requires detailed scoring data at criterion level',
      status: 'development_needed'
    };
  }

  _calculateValidityIndicators(scoreDistributions, reliabilityTrends) {
    return {
      scoreValidity: scoreDistributions.skewness > -1 && scoreDistributions.skewness < 1 ? 'good' : 'questionable',
      reliabilityValidity: reliabilityTrends.averageReliability > 0.7 ? 'good' : 'needs_improvement',
      distributionValidity: scoreDistributions.kurtosis > -2 && scoreDistributions.kurtosis < 2 ? 'good' : 'questionable',
      overallValidity: reliabilityTrends.averageReliability > 0.7 && 
                      scoreDistributions.skewness > -1 && scoreDistributions.skewness < 1 ? 'good' : 'needs_review'
    };
  }

  _calculateSkewness(scores) {
    if (scores.length < 3) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);
    const skewness = scores.reduce((sum, score) => sum + Math.pow((score - mean) / stdDev, 3), 0) / scores.length;
    
    return Math.round(skewness * 100) / 100;
  }

  _calculateKurtosis(scores) {
    if (scores.length < 4) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length);
    const kurtosis = scores.reduce((sum, score) => sum + Math.pow((score - mean) / stdDev, 4), 0) / scores.length - 3;
    
    return Math.round(kurtosis * 100) / 100;
  }

  _calculateReliabilityConsistency(reliabilities) {
    if (reliabilities.length < 2) return 'insufficient_data';
    
    const mean = reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length;
    const variance = reliabilities.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / reliabilities.length;
    
    return variance < 0.01 ? 'high' : variance < 0.05 ? 'moderate' : 'low';
  }
}

export default new AssessmentAnalyticsService();