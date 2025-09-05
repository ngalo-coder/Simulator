import RetakeService from '../services/retakeService.js';
import AnalyticsService from '../services/AnalyticsService.js';
import Session from '../models/SessionModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import { handleSuccess, handleError } from '../utils/responseHandler.js';
import logger from '../config/logger.js';

// Get comprehensive performance review for a user
export async function getPerformanceReview(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { timeframe = '30d', specialty = null } = req.query;

    // Get overall performance analytics
    const performanceAnalytics = await AnalyticsService.getUserPerformanceAnalytics(userId);
    
    // Get specialty performance breakdown
    const specialtyPerformance = await AnalyticsService.getSpecialtyPerformance(userId);
    
    // Get learning progress over time
    const learningProgress = await AnalyticsService.getLearningProgress(userId, timeframe);
    
    // Get weak areas analysis
    const weakAreas = await AnalyticsService.getWeakAreas(userId);

    const performanceReview = {
      overview: {
        totalSessions: performanceAnalytics.totalSessions,
        averageScore: performanceAnalytics.averageScore,
        performanceTrend: performanceAnalytics.performanceTrend,
        progressionLevel: performanceAnalytics.clinicianProgress?.currentProgressionLevel || 'Beginner'
      },
      specialtyBreakdown: specialtyPerformance,
      learningProgress: learningProgress,
      weakAreas: weakAreas,
      recommendations: await RetakeService.generateLearningRecommendations(userId, null, weakAreas),
      lastUpdated: new Date()
    };

    log.info('Performance review generated successfully');
    handleSuccess(res, performanceReview);
  } catch (error) {
    log.error(error, 'Error generating performance review');
    handleError(res, error, log);
  }
}

// Get detailed case performance with retake comparisons
export async function getCasePerformanceReview(req, res) {
  const log = req.log.child({ caseId: req.params.caseId, userId: req.user.id });
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Get all sessions for this case
    const sessions = await Session.find({
      user: userId,
      case_ref: caseId,
      sessionEnded: true
    })
    .populate('evaluation_ref')
    .populate('case_ref', 'case_metadata.title case_metadata.specialty case_metadata.difficulty')
    .sort({ retake_attempt_number: 1 });

    if (sessions.length === 0) {
      return handleError(res, { status: 404, message: 'No sessions found for this case' }, log);
    }

    // Get case details
    const caseDetails = sessions[0].case_ref;

    // Compare attempts if multiple sessions exist
    let attemptComparison = null;
    if (sessions.length > 1) {
      attemptComparison = await RetakeService.compareAttempts(caseId, userId);
    }

    // Get improvement areas for the latest session
    let improvementAreas = [];
    let adaptiveHints = [];
    
    if (sessions.length > 0) {
      const latestSession = sessions[sessions.length - 1];
      if (latestSession.evaluation_ref) {
        improvementAreas = await RetakeService.identifyImprovementAreas(latestSession._id);
        adaptiveHints = await RetakeService.generateAdaptiveHints(
          improvementAreas, 
          caseId, 
          sessions.length
        );
      }
    }

    const casePerformanceReview = {
      caseDetails: {
        title: caseDetails.case_metadata.title,
        specialty: caseDetails.case_metadata.specialty,
        difficulty: caseDetails.case_metadata.difficulty
      },
      sessionHistory: sessions.map(session => ({
        attemptNumber: session.retake_attempt_number,
        sessionId: session._id,
        completionDate: session.updatedAt,
        score: session.evaluation_ref?.metrics.overall_score || 0,
        performanceLabel: session.evaluation_ref?.metrics.performance_label || 'Not Assessed',
        isRetake: session.is_retake,
        improvementScore: session.improvement_score
      })),
      attemptComparison: attemptComparison,
      improvementAreas: improvementAreas,
      adaptiveHints: adaptiveHints,
      learningRecommendations: await RetakeService.generateLearningRecommendations(userId, caseId, improvementAreas)
    };

    log.info('Case performance review generated successfully');
    handleSuccess(res, casePerformanceReview);
  } catch (error) {
    log.error(error, 'Error generating case performance review');
    handleError(res, error, log);
  }
}

// Get peer comparison data
export async function getPeerComparisonReview(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { specialty = null } = req.query;

    const peerComparison = await AnalyticsService.getPeerComparison(userId, specialty);

    const peerReview = {
      userStats: peerComparison.userStats,
      peerCount: peerComparison.peerCount,
      userPercentile: peerComparison.userPercentile,
      averagePeerScore: peerComparison.averagePeerScore,
      topPerformers: peerComparison.topPerformers.slice(0, 5).map(peer => ({
        score: peer.averageScore,
        casesCompleted: peer.totalCases,
        excellentRatings: peer.excellentCount
      })),
      comparisonContext: {
        specialty: specialty || 'All Specialties',
        timeframe: 'Last 90 days',
        minimumCases: 5
      }
    };

    log.info('Peer comparison review generated successfully');
    handleSuccess(res, peerReview);
  } catch (error) {
    log.error(error, 'Error generating peer comparison review');
    handleError(res, error, log);
  }
}

// Get improvement progress over time
export async function getImprovementProgress(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { timeframe = '90d' } = req.query;

    // Get performance metrics for the timeframe
    const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 180;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await PerformanceMetrics.find({
      user_ref: userId,
      evaluated_at: { $gte: startDate }
    })
    .populate('case_ref', 'case_metadata.specialty case_metadata.difficulty')
    .sort({ evaluated_at: 1 });

    // Calculate improvement trends
    const weeklyTrends = this.calculateWeeklyTrends(metrics);
    const specialtyTrends = this.calculateSpecialtyTrends(metrics);
    const difficultyTrends = this.calculateDifficultyTrends(metrics);

    const improvementProgress = {
      timeframe: timeframe,
      totalCases: metrics.length,
      weeklyTrends: weeklyTrends,
      specialtyTrends: specialtyTrends,
      difficultyTrends: difficultyTrends,
      overallImprovement: this.calculateOverallImprovement(metrics),
      consistencyScore: this.calculateConsistencyScore(metrics)
    };

    log.info('Improvement progress analysis generated successfully');
    handleSuccess(res, improvementProgress);
  } catch (error) {
    log.error(error, 'Error generating improvement progress analysis');
    handleError(res, error, log);
  }
}

// Generate self-reflection prompts based on performance
export async function generateReflectionPrompts(req, res) {
  const log = req.log.child({ userId: req.user.id });
  try {
    const userId = req.user.id;
    const { caseId = null, sessionId = null } = req.query;

    let prompts = [];
    
    if (sessionId) {
      // Session-specific reflection prompts
      prompts = await this.generateSessionReflectionPrompts(sessionId);
    } else if (caseId) {
      // Case-specific reflection prompts
      prompts = await this.generateCaseReflectionPrompts(caseId, userId);
    } else {
      // General performance reflection prompts
      prompts = await this.generateGeneralReflectionPrompts(userId);
    }

    log.info('Reflection prompts generated successfully');
    handleSuccess(res, { prompts, generatedAt: new Date() });
  } catch (error) {
    log.error(error, 'Error generating reflection prompts');
    handleError(res, error, log);
  }
}

// Helper methods for improvement progress analysis
function calculateWeeklyTrends(metrics) {
  const weeklyData = {};
  
  metrics.forEach(metric => {
    const week = this.getWeekNumber(metric.evaluated_at);
    const weekKey = `Week ${week}`;
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        cases: 0,
        totalScore: 0,
        averageScore: 0
      };
    }
    
    weeklyData[weekKey].cases++;
    weeklyData[weekKey].totalScore += metric.metrics.overall_score || 0;
    weeklyData[weekKey].averageScore = weeklyData[weekKey].totalScore / weeklyData[weekKey].cases;
  });
  
  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    cases: data.cases,
    averageScore: Math.round(data.averageScore * 100) / 100
  }));
}

function calculateSpecialtyTrends(metrics) {
  const specialtyData = {};
  
  metrics.forEach(metric => {
    const specialty = metric.case_ref?.case_metadata.specialty || 'Unknown';
    
    if (!specialtyData[specialty]) {
      specialtyData[specialty] = {
        cases: 0,
        totalScore: 0,
        averageScore: 0
      };
    }
    
    specialtyData[specialty].cases++;
    specialtyData[specialty].totalScore += metric.metrics.overall_score || 0;
    specialtyData[specialty].averageScore = specialtyData[specialty].totalScore / specialtyData[specialty].cases;
  });
  
  return Object.entries(specialtyData).map(([specialty, data]) => ({
    specialty,
    cases: data.cases,
    averageScore: Math.round(data.averageScore * 100) / 100
  }));
}

function calculateDifficultyTrends(metrics) {
  const difficultyData = {
    Easy: { cases: 0, totalScore: 0, averageScore: 0 },
    Intermediate: { cases: 0, totalScore: 0, averageScore: 0 },
    Hard: { cases: 0, totalScore: 0, averageScore: 0 }
  };
  
  metrics.forEach(metric => {
    const difficulty = metric.case_ref?.case_metadata.difficulty || 'Unknown';
    
    if (difficultyData[difficulty]) {
      difficultyData[difficulty].cases++;
      difficultyData[difficulty].totalScore += metric.metrics.overall_score || 0;
      difficultyData[difficulty].averageScore = difficultyData[difficulty].totalScore / difficultyData[difficulty].cases;
    }
  });
  
  return Object.entries(difficultyData)
    .filter(([_, data]) => data.cases > 0)
    .map(([difficulty, data]) => ({
      difficulty,
      cases: data.cases,
      averageScore: Math.round(data.averageScore * 100) / 100
    }));
}

function calculateOverallImprovement(metrics) {
  if (metrics.length < 2) return 0;
  
  const firstMonth = metrics.slice(0, Math.floor(metrics.length / 2));
  const lastMonth = metrics.slice(-Math.floor(metrics.length / 2));
  
  const firstAverage = firstMonth.reduce((sum, m) => sum + (m.metrics.overall_score || 0), 0) / firstMonth.length;
  const lastAverage = lastMonth.reduce((sum, m) => sum + (m.metrics.overall_score || 0), 0) / lastMonth.length;
  
  return Math.round((lastAverage - firstAverage) * 100) / 100;
}

function calculateConsistencyScore(metrics) {
  if (metrics.length < 3) return 0;
  
  const scores = metrics.map(m => m.metrics.overall_score || 0);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
  
  // Convert to a 0-100 scale where 100 is perfect consistency
  return Math.max(0, 100 - (variance * 2));
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Reflection prompt generation methods
async function generateSessionReflectionPrompts(sessionId) {
  const session = await Session.findById(sessionId).populate('evaluation_ref');
  if (!session) return [];
  
  const prompts = [
    {
      type: 'strength',
      question: 'What aspect of this session do you feel you handled particularly well?',
      context: 'Focus on specific skills or decisions that were effective'
    },
    {
      type: 'improvement',
      question: 'If you could redo this session, what would you do differently?',
      context: 'Consider both clinical reasoning and communication aspects'
    },
    {
      type: 'learning',
      question: 'What key learning point will you take away from this case?',
      context: 'Think about how this applies to future similar cases'
    }
  ];
  
  if (session.evaluation_ref) {
    prompts.push({
      type: 'feedback',
      question: 'How does the AI evaluation compare to your self-assessment?',
      context: 'Compare your perceived performance with the objective assessment'
    });
  }
  
  return prompts;
}

async function generateCaseReflectionPrompts(caseId, userId) {
  const sessions = await Session.find({
    user: userId,
    case_ref: caseId,
    sessionEnded: true
  }).populate('evaluation_ref');
  
  if (sessions.length === 0) return [];
  
  const prompts = [
    {
      type: 'progression',
      question: 'How did your approach change between attempts?',
      context: 'Consider both what improved and what still needs work'
    },
    {
      type: 'mastery',
      question: 'What does mastery of this case look like to you?',
      context: 'Think beyond just scores to comprehensive understanding'
    },
    {
      type: 'application',
      question: 'How will you apply what you learned from this case in real practice?',
      context: 'Consider both technical skills and patient interaction'
    }
  ];
  
  if (sessions.length > 1) {
    prompts.push({
      type: 'comparison',
      question: 'What specific improvements did you make between attempts?',
      context: 'Focus on measurable changes in your performance'
    });
  }
  
  return prompts;
}

async function generateGeneralReflectionPrompts(userId) {
  const performance = await AnalyticsService.getUserPerformanceAnalytics(userId);
  const weakAreas = await AnalyticsService.getWeakAreas(userId);
  
  const prompts = [
    {
      type: 'overview',
      question: 'Looking at your overall performance, what patterns do you notice?',
      context: 'Consider trends across different specialties and difficulty levels'
    },
    {
      type: 'growth',
      question: 'What area has shown the most improvement recently?',
      context: 'Celebrate progress and identify what contributed to it'
    }
  ];
  
  if (weakAreas.length > 0) {
    prompts.push({
      type: 'development',
      question: 'Based on your performance in ' + weakAreas[0].name + ', what specific steps will you take to improve?',
      context: 'Create actionable goals for your weakest area'
    });
  }
  
  prompts.push({
    type: 'planning',
    question: 'What learning goals will you set for the next month?',
    context: 'Make your goals specific, measurable, and achievable'
  });
  
  return prompts;
}