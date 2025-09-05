import express from 'express';
import ProgressAnalyticsService from '../services/ProgressAnalyticsService.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(requireAuth);

/**
 * @route GET /api/progress-analytics/realtime/:userId
 * @desc Get real-time progress updates for a user
 * @access Private (Student, Educator, Admin)
 */
router.get('/realtime/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange, granularity } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own progress data'
      });
    }

    const options = {
      timeRange: timeRange || '30d',
      granularity: granularity || 'week'
    };

    const progressData = await ProgressAnalyticsService.getRealTimeProgress(userId, options);
    
    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Get real-time progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch real-time progress data'
    });
  }
});

/**
 * @route GET /api/progress-analytics/competency-trends/:userId
 * @desc Analyze competency trends for a user
 * @access Private (Student, Educator, Admin)
 */
router.get('/competency-trends/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange, granularity } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own progress data'
      });
    }

    const options = {
      timeRange: timeRange || '90d',
      granularity: granularity || 'week'
    };

    const trendData = await ProgressAnalyticsService.analyzeCompetencyTrends(userId, options);
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Analyze competency trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze competency trends'
    });
  }
});

/**
 * @route GET /api/progress-analytics/benchmarks/:userId
 * @desc Compare user performance against benchmarks
 * @access Private (Student, Educator, Admin)
 */
router.get('/benchmarks/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { specialty, difficulty, programArea } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own progress data'
      });
    }

    const options = {
      specialty: specialty || undefined,
      difficulty: difficulty || undefined,
      programArea: programArea || undefined
    };

    const benchmarkData = await ProgressAnalyticsService.compareToBenchmarks(userId, options);
    
    res.json({
      success: true,
      data: benchmarkData
    });
  } catch (error) {
    console.error('Compare to benchmarks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to compare against benchmarks'
    });
  }
});

/**
 * @route GET /api/progress-analytics/predictions/:userId
 * @desc Predict learning outcomes based on current progress
 * @access Private (Student, Educator, Admin)
 */
router.get('/predictions/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own progress data'
      });
    }

    const options = {
      timeRange: timeRange || '90d'
    };

    const predictionData = await ProgressAnalyticsService.predictLearningOutcomes(userId, options);
    
    res.json({
      success: true,
      data: predictionData
    });
  } catch (error) {
    console.error('Predict learning outcomes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to predict learning outcomes'
    });
  }
});

/**
 * @route GET /api/progress-analytics/visualization/:userId
 * @desc Get visualization-ready data for progress dashboard
 * @access Private (Student, Educator, Admin)
 */
router.get('/visualization/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own progress data'
      });
    }

    const visualizationData = await ProgressAnalyticsService.getVisualizationData(userId);
    
    res.json({
      success: true,
      data: visualizationData
    });
  } catch (error) {
    console.error('Get visualization data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate visualization data'
    });
  }
});

/**
 * @route POST /api/progress-analytics/clear-cache
 * @desc Clear analytics cache (admin only)
 * @access Private (Admin)
 */
router.post('/clear-cache', requireAnyRole(['admin']), async (req, res) => {
  try {
    ProgressAnalyticsService.clearCache();
    
    res.json({
      success: true,
      message: 'Progress analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear analytics cache error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear analytics cache'
    });
  }
});

export default router;