import express from 'express';
import ProgressAnalyticsService from '../services/ProgressAnalyticsService.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(requireAuth);

/**
 * @swagger
 * /api/progress-analytics/realtime/{userId}:
 *   get:
 *     summary: Get real-time progress updates for a user
 *     description: Retrieve real-time progress data for a specific user including current activities, completion rates, and recent achievements. Students can only access their own data.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve progress data for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range for progress data (e.g., 7d, 30d, 90d)
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           default: week
 *         description: Granularity of data points (e.g., day, week, month)
 *     responses:
 *       200:
 *         description: Successful retrieval of real-time progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RealTimeProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - students can only access their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/progress-analytics/competency-trends/{userId}:
 *   get:
 *     summary: Analyze competency trends for a user
 *     description: Analyze competency development trends over time for a specific user, showing progress in different skill areas. Students can only access their own data.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to analyze competency trends for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 90d
 *         description: Time range for trend analysis (e.g., 30d, 90d, 1y)
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           default: week
 *         description: Granularity of data points (e.g., day, week, month)
 *     responses:
 *       200:
 *         description: Successful analysis of competency trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CompetencyTrends'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - students can only access their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/progress-analytics/benchmarks/{userId}:
 *   get:
 *     summary: Compare user performance against benchmarks
 *     description: Compare a user's performance against established benchmarks and peer groups in specific specialties, difficulty levels, or program areas. Students can only access their own data.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to compare against benchmarks
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by medical specialty for benchmark comparison
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty level for benchmark comparison
 *       - in: query
 *         name: programArea
 *         schema:
 *           type: string
 *         description: Filter by program area for benchmark comparison
 *     responses:
 *       200:
 *         description: Successful benchmark comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BenchmarkComparison'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - students can only access their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/progress-analytics/predictions/{userId}:
 *   get:
 *     summary: Predict learning outcomes based on current progress
 *     description: Generate predictions about future learning outcomes and competency development based on the user's current progress and performance patterns. Students can only access their own data.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to generate predictions for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 90d
 *         description: Time range of historical data to use for predictions
 *     responses:
 *       200:
 *         description: Successful generation of learning outcome predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPredictions'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - students can only access their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/progress-analytics/visualization/{userId}:
 *   get:
 *     summary: Get visualization-ready data for progress dashboard
 *     description: Retrieve formatted data optimized for visualization in progress dashboards, including charts, graphs, and progress indicators. Students can only access their own data.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to retrieve visualization data for
 *     responses:
 *       200:
 *         description: Successful retrieval of visualization data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VisualizationData'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - students can only access their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/progress-analytics/clear-cache:
 *   post:
 *     summary: Clear analytics cache (admin only)
 *     description: Clear cached progress analytics data to force refresh of all metrics and visualizations. Requires admin role.
 *     tags: [Progress Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress analytics cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progress analytics cache cleared successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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