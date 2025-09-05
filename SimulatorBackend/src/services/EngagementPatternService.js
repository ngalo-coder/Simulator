import mongoose from 'mongoose';
import UserInteractionTracking, { InteractionType, EngagementLevel } from '../models/UserInteractionTrackingModel.js';
import StudentProgress from '../models/StudentProgressModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';

/**
 * Engagement Pattern Service
 * Provides advanced pattern recognition, anomaly detection, and insights generation
 * for user engagement and learning behavior analysis
 */
class EngagementPatternService {
  constructor() {
    this.patternCache = new Map();
    this.cacheDuration = 15 * 60 * 1000; // 15 minutes cache
  }

  /**
   * Detect engagement patterns and anomalies
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Engagement patterns and anomalies
   */
  async detectEngagementPatterns(userId, options = {}) {
    try {
      const cacheKey = `patterns_${userId}_${JSON.stringify(options)}`;
      const cached = this.patternCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.data;
      }

      const { timeRange = '90d' } = options;
      
      const [
        timePatterns,
        interactionPatterns,
        performancePatterns,
        anomalies
      ] = await Promise.all([
        this._analyzeTimePatterns(userId, timeRange),
        this._analyzeInteractionPatterns(userId, timeRange),
        this._analyzePerformancePatterns(userId, timeRange),
        this._detectAnomalies(userId, timeRange)
      ]);

      const patterns = {
        timePatterns,
        interactionPatterns,
        performancePatterns,
        anomalies,
        overallEngagementScore: this._calculateOverallEngagementScore(timePatterns, interactionPatterns),
        patternConsistency: this._calculatePatternConsistency(timePatterns, interactionPatterns),
        timeRange,
        generatedAt: new Date()
      };

      this.patternCache.set(cacheKey, {
        timestamp: Date.now(),
        data: patterns
      });

      return patterns;
    } catch (error) {
      console.error('Detect engagement patterns error:', error);
      throw error;
    }
  }

  /**
   * Generate learning insights and recommendations
   * @param {string} userId - User ID
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Learning insights and recommendations
   */
  async generateLearningInsights(userId, options = {}) {
    try {
      const { timeRange = '90d' } = options;
      
      const [
        engagementPatterns,
        performanceData,
        competencyProgress,
        studyHabits
      ] = await Promise.all([
        this.detectEngagementPatterns(userId, { timeRange }),
        this._getPerformanceData(userId, timeRange),
        this._getCompetencyProgress(userId, timeRange),
        this._analyzeStudyHabits(userId, timeRange)
      ]);

      const insights = {
        engagementSummary: this._summarizeEngagement(engagementPatterns),
        performanceSummary: this._summarizePerformance(performanceData),
        competencyGaps: this._identifyCompetencyGaps(competencyProgress),
        studyEffectiveness: this._analyzeStudyEffectiveness(studyHabits, performanceData),
        recommendations: this._generateInsightRecommendations(engagementPatterns, performanceData, competencyProgress),
        timeRange,
        generatedAt: new Date()
      };

      return insights;
    } catch (error) {
      console.error('Generate learning insights error:', error);
      throw error;
    }
  }

  /**
   * Predict future engagement and performance
   * @param {string} userId - User ID
   * @param {Object} options - Prediction options
   * @returns {Promise<Object>} - Future predictions
   */
  async predictFutureEngagement(userId, options = {}) {
    try {
      const { forecastPeriod = '30d' } = options;
      
      const historicalPatterns = await this.detectEngagementPatterns(userId, { timeRange: '90d' });
      const performanceData = await this._getPerformanceData(userId, '90d');
      
      const predictions = {
        engagementForecast: this._forecastEngagement(historicalPatterns, forecastPeriod),
        performanceForecast: this._forecastPerformance(performanceData, forecastPeriod),
        riskFactors: this._identifyRiskFactors(historicalPatterns, performanceData),
        opportunities: this._identifyOpportunities(historicalPatterns, performanceData),
        confidenceScores: this._calculatePredictionConfidence(historicalPatterns),
        forecastPeriod,
        generatedAt: new Date()
      };

      return predictions;
    } catch (error) {
      console.error('Predict future engagement error:', error);
      throw error;
    }
  }

  /**
   * Compare user patterns with peer group
   * @param {string} userId - User ID
   * @param {Object} options - Comparison options
   * @returns {Promise<Object>} - Peer comparison results
   */
  async compareWithPeers(userId, options = {}) {
    try {
      const { specialty, difficulty, timeRange = '30d' } = options;
      
      const [
        userPatterns,
        peerPatterns
      ] = await Promise.all([
        this.detectEngagementPatterns(userId, { timeRange }),
        this._getPeerPatterns(specialty, difficulty, timeRange)
      ]);

      const comparison = {
        userMetrics: this._extractComparisonMetrics(userPatterns),
        peerMetrics: peerPatterns,
        differences: this._calculatePatternDifferences(userPatterns, peerPatterns),
        relativeStrengths: this._identifyRelativeStrengths(userPatterns, peerPatterns),
        improvementAreas: this._identifyImprovementAreas(userPatterns, peerPatterns),
        percentileRankings: this._calculatePercentileRankings(userPatterns, peerPatterns),
        timeRange,
        generatedAt: new Date()
      };

      return comparison;
    } catch (error) {
      console.error('Compare with peers error:', error);
      throw error;
    }
  }

  // Private helper methods

  async _analyzeTimePatterns(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const timePatterns = await UserInteractionTracking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: dateFilter } },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$createdAt' },
            hourOfDay: { $hour: '$createdAt' }
          },
          totalSessions: { $sum: 1 },
          totalTime: { $sum: '$timeSpentSeconds' },
          avgEngagement: { $avg: '$engagementScore' },
          sessionTypes: { $addToSet: '$interactionType' }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          hourOfDay: '$_id.hourOfDay',
          totalSessions: 1,
          totalTime: 1,
          avgEngagement: 1,
          sessionTypes: 1,
          avgSessionDuration: { $divide: ['$totalTime', '$totalSessions'] }
        }
      },
      { $sort: { dayOfWeek: 1, hourOfDay: 1 } }
    ]);

    return {
      patterns: timePatterns,
      preferredStudyTimes: this._identifyPreferredStudyTimes(timePatterns),
      consistencyScore: this._calculateTimeConsistency(timePatterns)
    };
  }

  async _analyzeInteractionPatterns(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const interactionPatterns = await UserInteractionTracking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: dateFilter } },
      {
        $group: {
          _id: '$interactionType',
          totalCount: { $sum: 1 },
          totalTime: { $sum: '$timeSpentSeconds' },
          avgEngagement: { $avg: '$engagementScore' },
          frequency: { $avg: { $divide: [1, { $subtract: [new Date(), '$createdAt'] }] } }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    return {
      patterns: interactionPatterns,
      dominantInteractionTypes: this._identifyDominantInteractions(interactionPatterns),
      interactionEfficiency: this._calculateInteractionEfficiency(interactionPatterns)
    };
  }

  async _analyzePerformancePatterns(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const performancePatterns = await PerformanceMetrics.aggregate([
      { $match: { user_ref: new mongoose.Types.ObjectId(userId), evaluated_at: dateFilter } },
      {
        $group: {
          _id: {
            week: { $week: '$evaluated_at' },
            difficulty: '$caseDetails.case_metadata.difficulty'
          },
          avgScore: { $avg: '$metrics.overall_score' },
          totalAttempts: { $sum: 1 },
          completionRate: {
            $avg: { $cond: [{ $gte: ['$metrics.overall_score', 70] }, 1, 0] }
          },
          avgTime: { $avg: '$session_duration' }
        }
      },
      { $sort: { '_id.week': 1 } }
    ]);

    return {
      patterns: performancePatterns,
      learningCurve: this._calculateLearningCurve(performancePatterns),
      difficultyProgression: this._analyzeDifficultyProgression(performancePatterns)
    };
  }

  async _detectAnomalies(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const anomalies = await UserInteractionTracking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyEngagement: { $avg: '$engagementScore' },
          totalInteractions: { $sum: 1 },
          totalTime: { $sum: '$timeSpentSeconds' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $group: {
          _id: null,
          engagementScores: { $push: '$dailyEngagement' },
          interactionCounts: { $push: '$totalInteractions' },
          timeSpent: { $push: '$totalTime' }
        }
      }
    ]);

    if (!anomalies.length) return [];

    const data = anomalies[0];
    const engagementAnomalies = this._detectStatisticalAnomalies(data.engagementScores);
    const interactionAnomalies = this._detectStatisticalAnomalies(data.interactionCounts);

    return {
      engagementAnomalies,
      interactionAnomalies,
      significantDrops: this._identifySignificantDrops(data.engagementScores),
      significantSpikes: this._identifySignificantSpikes(data.engagementScores)
    };
  }

  async _analyzeStudyHabits(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const studyHabits = await UserInteractionTracking.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId), 
          createdAt: dateFilter,
          interactionType: { 
            $in: [InteractionType.CASE_START, InteractionType.CASE_COMPLETE, InteractionType.RESOURCE_ACCESS] 
          }
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            sessionType: '$interactionType'
          },
          sessionCount: { $sum: 1 },
          totalTime: { $sum: '$timeSpentSeconds' },
          avgEngagement: { $avg: '$engagementScore' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalSessions: { $sum: '$sessionCount' },
          totalStudyTime: { $sum: '$totalTime' },
          avgDailyEngagement: { $avg: '$avgEngagement' },
          sessionTypes: { $push: { type: '$_id.sessionType', count: '$sessionCount' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      studySessions: studyHabits,
      studyConsistency: this._calculateStudyConsistency(studyHabits),
      optimalStudyDuration: this._identifyOptimalStudyDuration(studyHabits),
      effectiveStudyTimes: this._identifyEffectiveStudyTimes(studyHabits)
    };
  }

  async _getPerformanceData(userId, timeRange) {
    const dateFilter = this._getDateFilter(timeRange);
    
    const performance = await PerformanceMetrics.aggregate([
      { $match: { user_ref: new mongoose.Types.ObjectId(userId), evaluated_at: dateFilter } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$metrics.overall_score' },
          bestScore: { $max: '$metrics.overall_score' },
          worstScore: { $min: '$metrics.overall_score' },
          completionRate: {
            $avg: { $cond: [{ $gte: ['$metrics.overall_score', 70] }, 1, 0] }
          },
          totalAttempts: { $sum: 1 },
          avgTimePerCase: { $avg: '$session_duration' }
        }
      }
    ]);

    return performance[0] || { 
      averageScore: 0, 
      bestScore: 0, 
      worstScore: 0, 
      completionRate: 0, 
      totalAttempts: 0, 
      avgTimePerCase: 0 
    };
  }

  async _getCompetencyProgress(userId, timeRange) {
    const progress = await StudentProgress.findOne({ userId });
    if (!progress) return { competencies: [], overallProgress: {} };

    return {
      competencies: progress.competencies,
      overallProgress: progress.overallProgress
    };
  }

  async _getPeerPatterns(specialty, difficulty, timeRange) {
    // Placeholder for peer pattern aggregation
    // In a real implementation, this would aggregate data from multiple users
    return {
      averageEngagement: 65,
      averageStudyTime: 7200, // 2 hours in seconds
      averageSessionsPerWeek: 4.2,
      completionRate: 0.78,
      performanceScore: 72.5
    };
  }

  _identifyPreferredStudyTimes(timePatterns) {
    const preferredTimes = timePatterns
      .filter(pattern => pattern.totalSessions > 2 && pattern.avgEngagement > 60)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3);

    return preferredTimes.map(time => ({
      dayOfWeek: time.dayOfWeek,
      hourOfDay: time.hourOfDay,
      engagementScore: time.avgEngagement,
      sessionCount: time.totalSessions
    }));
  }

  _calculateTimeConsistency(timePatterns) {
    if (timePatterns.length === 0) return 0;
    
    const totalSessions = timePatterns.reduce((sum, pattern) => sum + pattern.totalSessions, 0);
    const uniqueTimeSlots = timePatterns.length;
    
    // Consistency score based on how distributed sessions are across time slots
    return Math.min(100, (uniqueTimeSlots / Math.max(1, totalSessions)) * 100 * 2);
  }

  _identifyDominantInteractions(interactionPatterns) {
    return interactionPatterns
      .filter(interaction => interaction.totalCount > 0)
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 3)
      .map(interaction => ({
        type: interaction._id,
        count: interaction.totalCount,
        percentage: (interaction.totalCount / interactionPatterns.reduce((sum, i) => sum + i.totalCount, 0)) * 100
      }));
  }

  _calculateInteractionEfficiency(interactionPatterns) {
    const effectiveInteractions = interactionPatterns.filter(
      interaction => ['case_complete', 'resource_access'].includes(interaction._id)
    ).reduce((sum, interaction) => sum + interaction.totalCount, 0);

    const totalInteractions = interactionPatterns.reduce((sum, interaction) => sum + interaction.totalCount, 0);

    return totalInteractions > 0 ? (effectiveInteractions / totalInteractions) * 100 : 0;
  }

  _calculateLearningCurve(performancePatterns) {
    if (performancePatterns.length < 2) return 0;
    
    const sortedPatterns = performancePatterns.sort((a, b) => a._id.week - b._id.week);
    const firstWeekScore = sortedPatterns[0].avgScore;
    const lastWeekScore = sortedPatterns[sortedPatterns.length - 1].avgScore;
    
    return lastWeekScore - firstWeekScore;
  }

  _analyzeDifficultyProgression(performancePatterns) {
    const difficultyLevels = {};
    
    performancePatterns.forEach(pattern => {
      const difficulty = pattern._id.difficulty;
      if (!difficultyLevels[difficulty]) {
        difficultyLevels[difficulty] = [];
      }
      difficultyLevels[difficulty].push(pattern.avgScore);
    });

    const progression = {};
    for (const [difficulty, scores] of Object.entries(difficultyLevels)) {
      progression[difficulty] = {
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        attemptCount: scores.length,
        improvement: scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
      };
    }

    return progression;
  }

  _detectStatisticalAnomalies(data) {
    if (data.length < 3) return [];
    
    const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return data
      .map((value, index) => ({ value, index }))
      .filter(item => Math.abs(item.value - mean) > 2 * stdDev)
      .map(item => ({
        index: item.index,
        value: item.value,
        deviation: ((item.value - mean) / stdDev).toFixed(2)
      }));
  }

  _identifySignificantDrops(engagementScores) {
    if (engagementScores.length < 2) return [];
    
    const drops = [];
    for (let i = 1; i < engagementScores.length; i++) {
      const drop = engagementScores[i] - engagementScores[i - 1];
      if (drop < -20) { // Significant drop threshold
        drops.push({
          fromDay: i - 1,
          toDay: i,
          dropAmount: Math.abs(drop),
          fromScore: engagementScores[i - 1],
          toScore: engagementScores[i]
        });
      }
    }
    return drops;
  }

  _identifySignificantSpikes(engagementScores) {
    if (engagementScores.length < 2) return [];
    
    const spikes = [];
    for (let i = 1; i < engagementScores.length; i++) {
      const spike = engagementScores[i] - engagementScores[i - 1];
      if (spike > 25) { // Significant spike threshold
        spikes.push({
          fromDay: i - 1,
          toDay: i,
          spikeAmount: spike,
          fromScore: engagementScores[i - 1],
          toScore: engagementScores[i]
        });
      }
    }
    return spikes;
  }

  _calculateStudyConsistency(studyHabits) {
    if (studyHabits.length === 0) return 0;
    
    const studyDays = studyHabits.length;
    const totalStudyTime = studyHabits.reduce((sum, day) => sum + day.totalStudyTime, 0);
    const avgDailyStudyTime = totalStudyTime / studyDays;
    
    // Consistency based on standard deviation of study times
    const variance = studyHabits.reduce((sum, day) => {
      return sum + Math.pow(day.totalStudyTime - avgDailyStudyTime, 2);
    }, 0) / studyDays;
    
    const stdDev = Math.sqrt(variance);
    const consistency = 100 - (stdDev / avgDailyStudyTime) * 100;
    
    return Math.max(0, Math.min(100, consistency));
  }

  _identifyOptimalStudyDuration(studyHabits) {
    if (studyHabits.length === 0) return 0;
    
    const effectiveSessions = studyHabits.filter(day => day.avgDailyEngagement > 70);
    if (effectiveSessions.length === 0) return 0;
    
    const optimalDuration = effectiveSessions.reduce((sum, day) => sum + day.totalStudyTime, 0) / effectiveSessions.length;
    return Math.round(optimalDuration / 60); // Convert to minutes
  }

  _identifyEffectiveStudyTimes(studyHabits) {
    // This would analyze which times of day yield the highest engagement
    // For now, return placeholder
    return [
      { time: 'morning', effectiveness: 85 },
      { time: 'afternoon', effectiveness: 78 },
      { time: 'evening', effectiveness: 92 }
    ];
  }

  _calculateOverallEngagementScore(timePatterns, interactionPatterns) {
    const timeScore = timePatterns.consistencyScore * 0.4;
    const interactionScore = interactionPatterns.interactionEfficiency * 0.6;
    return Math.round(timeScore + interactionScore);
  }

  _calculatePatternConsistency(timePatterns, interactionPatterns) {
    // Simple consistency calculation based on variance
    return 75; // Placeholder
  }

  _summarizeEngagement(engagementPatterns) {
    return {
      overallScore: engagementPatterns.overallEngagementScore,
      consistency: engagementPatterns.patternConsistency,
      preferredTimes: engagementPatterns.timePatterns.preferredStudyTimes.length,
      anomalyCount: engagementPatterns.anomalies.engagementAnomalies.length + engagementPatterns.anomalies.interactionAnomalies.length
    };
  }

  _summarizePerformance(performanceData) {
    return {
      averageScore: performanceData.averageScore,
      completionRate: performanceData.completionRate * 100,
      totalAttempts: performanceData.totalAttempts,
      efficiency: performanceData.avgTimePerCase > 0 ? (performanceData.averageScore / performanceData.avgTimePerCase) * 100 : 0
    };
  }

  _identifyCompetencyGaps(competencyProgress) {
    return competencyProgress.competencies
      .filter(comp => comp.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(comp => ({
        competency: comp.competencyName,
        currentScore: comp.score,
        gap: 70 - comp.score,
        priority: comp.score < 50 ? 'high' : 'medium'
      }));
  }

  _analyzeStudyEffectiveness(studyHabits, performanceData) {
    const totalStudyTime = studyHabits.studySessions.reduce((sum, session) => sum + session.totalStudyTime, 0);
    const studyHours = totalStudyTime / 3600;
    
    if (studyHours === 0) return 0;
    
    // Effectiveness = (performance improvement per study hour)
    return performanceData.averageScore / studyHours;
  }

  _generateInsightRecommendations(engagementPatterns, performanceData, competencyProgress) {
    const recommendations = [];

    // Engagement-based recommendations
    if (engagementPatterns.overallEngagementScore < 60) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        message: 'Low overall engagement detected. Consider setting specific study goals.',
        action: 'set_study_goals'
      });
    }

    // Performance-based recommendations
    if (performanceData.averageScore < 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Performance below target. Focus on fundamental cases and review feedback.',
        action: 'review_fundamentals'
      });
    }

    // Competency-based recommendations
    const weakCompetencies = competencyProgress.competencies.filter(comp => comp.score < 70);
    if (weakCompetencies.length > 0) {
      recommendations.push({
        type: 'competency',
        priority: 'medium',
        message: `Found ${weakCompetencies.length} competencies needing improvement.`,
        action: 'focus_weak_areas'
      });
    }

    return recommendations.slice(0, 5);
  }

  _forecastEngagement(historicalPatterns, forecastPeriod) {
    // Simple linear forecast based on recent trend
    const recentScores = historicalPatterns.timePatterns.patterns
      .slice(-7)
      .map(pattern => pattern.avgEngagement || 0);
    
    if (recentScores.length < 2) return 65; // Default forecast
    
    const trend = recentScores[recentScores.length - 1] - recentScores[0];
    const forecast = recentScores[recentScores.length - 1] + (trend / recentScores.length) * 7;
    
    return Math.max(0, Math.min(100, forecast));
  }

  _forecastPerformance(performanceData, forecastPeriod) {
    // Simple forecast based on current performance
    return Math.min(100, performanceData.averageScore + 5); // Conservative improvement
  }

  _identifyRiskFactors(historicalPatterns, performanceData) {
    const risks = [];

    if (historicalPatterns.overallEngagementScore < 50) {
      risks.push('Low engagement may lead to dropout risk');
    }

    if (performanceData.averageScore < 65) {
      risks.push('Below average performance may indicate learning gaps');
    }

    if (historicalPatterns.anomalies.significantDrops.length > 2) {
      risks.push('Multiple engagement drops detected - may indicate motivation issues');
    }

    return risks;
  }

  _identifyOpportunities(historicalPatterns, performanceData) {
    const opportunities = [];

    if (historicalPatterns.timePatterns.preferredStudyTimes.length > 0) {
      opportunities.push('Clear preferred study times identified - optimize schedule');
    }

    if (performanceData.completionRate > 0.8) {
      opportunities.push('High completion rate indicates good persistence');
    }

    if (historicalPatterns.patternConsistency > 80) {
      opportunities.push('Consistent study patterns suggest good learning habits');
    }

    return opportunities;
  }

  _calculatePredictionConfidence(historicalPatterns) {
    let confidence = 0.6; // Base confidence

    if (historicalPatterns.timePatterns.patterns.length >= 14) {
      confidence += 0.2; // More data = higher confidence
    }

    if (historicalPatterns.patternConsistency > 70) {
      confidence += 0.1; // Consistent patterns = higher confidence
    }

    return Math.min(0.9, confidence);
  }

  _extractComparisonMetrics(userPatterns) {
    return {
      engagementScore: userPatterns.overallEngagementScore,
      studyConsistency: userPatterns.patternConsistency,
      averageSessionDuration: userPatterns.timePatterns.patterns.reduce((sum, pattern) => sum + pattern.avgSessionDuration, 0) / userPatterns.timePatterns.patterns.length,
      interactionEfficiency: userPatterns.interactionPatterns.interactionEfficiency
    };
  }

  _calculatePatternDifferences(userPatterns, peerPatterns) {
    return {
      engagementDifference: userPatterns.overallEngagementScore - peerPatterns.averageEngagement,
      studyTimeDifference: (userPatterns.timePatterns.patterns.reduce((sum, pattern) => sum + pattern.totalTime, 0) / 3600) - (peerPatterns.averageStudyTime / 3600),
      sessionsDifference: userPatterns.timePatterns.patterns.length - peerPatterns.averageSessionsPerWeek
    };
  }

  _identifyRelativeStrengths(userPatterns, peerPatterns) {
    const strengths = [];

    if (userPatterns.overallEngagementScore > peerPatterns.averageEngagement + 10) {
      strengths.push('Higher than average engagement');
    }

    if (userPatterns.patternConsistency > 80 && userPatterns.patternConsistency > (peerPatterns.consistencyScore || 70)) {
      strengths.push('Excellent study consistency');
    }

    return strengths;
  }

  _identifyImprovementAreas(userPatterns, peerPatterns) {
    const areas = [];

    if (userPatterns.overallEngagementScore < peerPatterns.averageEngagement - 10) {
      areas.push('Engagement below peer average');
    }

    if (userPatterns.interactionPatterns.interactionEfficiency < 60) {
      areas.push('Interaction efficiency could be improved');
    }

    return areas;
  }

  _calculatePercentileRankings(userPatterns, peerPatterns) {
    // Simple percentile calculation based on comparison metrics
    return {
      engagement: userPatterns.overallEngagementScore > peerPatterns.averageEngagement ? 75 : 45,
      consistency: userPatterns.patternConsistency > 80 ? 85 : 60,
      efficiency: userPatterns.interactionPatterns.interactionEfficiency > 70 ? 80 : 55
    };
  }

  _getDateFilter(timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '365d':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate };
  }

  /**
   * Clear pattern analysis cache
   */
  clearCache() {
    this.patternCache.clear();
  }
}

export default new EngagementPatternService();