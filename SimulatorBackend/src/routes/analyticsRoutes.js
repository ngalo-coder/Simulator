import express from 'express';
import AnalyticsService from '../services/AnalyticsService.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(requireAuth);

/**
 * @swagger
 * /api/analytics/case-usage:
 *   get:
 *     summary: Get comprehensive case usage analytics
 *     description: Retrieve detailed analytics about case usage including access patterns, completion rates, and user engagement metrics. Requires admin or educator role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range for analytics (e.g., 7d, 30d, 90d, 1y)
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by medical specialty
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by case difficulty level
 *       - in: query
 *         name: programArea
 *         schema:
 *           type: string
 *         description: Filter by program area
 *     responses:
 *       200:
 *         description: Successful retrieval of case usage analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CaseUsageAnalytics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin or educator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/case-usage', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { 
      timeRange = '30d', 
      specialty, 
      difficulty, 
      programArea 
    } = req.query;

    const filters = {
      timeRange,
      specialty: specialty || undefined,
      difficulty: difficulty || undefined,
      programArea: programArea || undefined
    };

    const analytics = await AnalyticsService.getCaseUsageAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get case usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch case usage analytics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/case-effectiveness:
 *   get:
 *     summary: Get case effectiveness metrics
 *     description: Retrieve metrics measuring the effectiveness of cases including learning outcomes, user performance, and educational impact. Requires admin or educator role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: caseId
 *         schema:
 *           type: string
 *         description: Optional case ID to get metrics for a specific case
 *     responses:
 *       200:
 *         description: Successful retrieval of case effectiveness metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CaseEffectivenessMetrics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin or educator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/case-effectiveness', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { caseId } = req.query;
    
    const metrics = await AnalyticsService.getCaseEffectivenessMetrics(caseId || null);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get case effectiveness metrics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch case effectiveness metrics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/difficulty-analysis:
 *   get:
 *     summary: Get difficulty analysis for cases
 *     description: Analyze case difficulty patterns and user performance across different difficulty levels. Requires admin or educator role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by medical specialty
 *       - in: query
 *         name: programArea
 *         schema:
 *           type: string
 *         description: Filter by program area
 *     responses:
 *       200:
 *         description: Successful retrieval of difficulty analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DifficultyAnalysis'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin or educator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/difficulty-analysis', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { specialty, programArea } = req.query;
    
    const analysis = await AnalyticsService.getDifficultyAnalysis({
      specialty: specialty || undefined,
      programArea: programArea || undefined
    });
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Get difficulty analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch difficulty analysis'
    });
  }
});

/**
 * @swagger
 * /api/analytics/performance-trends:
 *   get:
 *     summary: Get performance trends over time
 *     description: Track performance trends across users and cases over specified time periods with configurable intervals. Requires admin or educator role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 90d
 *         description: Time range for trend analysis (e.g., 30d, 90d, 1y)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           default: week
 *         description: Time interval for data points (e.g., day, week, month)
 *     responses:
 *       200:
 *         description: Successful retrieval of performance trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PerformanceTrends'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin or educator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/performance-trends', requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const { timeRange = '90d', interval = 'week' } = req.query;
    
    const trends = await AnalyticsService.getPerformanceTrends(timeRange, interval);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get performance trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch performance trends'
    });
  }
});

/**
 * @swagger
 * /api/analytics/contributor-analytics:
 *   get:
 *     summary: Get contributor performance analytics
 *     description: Analyze performance metrics for case contributors including case quality, review efficiency, and overall impact. Requires admin role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of contributor analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContributorAnalytics'
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
router.get('/contributor-analytics', requireAnyRole(['admin']), async (req, res) => {
  try {
    const analytics = await AnalyticsService.getContributorAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get contributor analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contributor analytics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/review-quality:
 *   get:
 *     summary: Get review quality metrics
 *     description: Retrieve metrics assessing the quality and consistency of case reviews, including reviewer performance and decision accuracy. Requires admin role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Time range for review quality analysis
 *       - in: query
 *         name: reviewerId
 *         schema:
 *           type: string
 *         description: Optional reviewer ID to filter by specific reviewer
 *     responses:
 *       200:
 *         description: Successful retrieval of review quality metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReviewQualityMetrics'
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
router.get('/review-quality', requireAnyRole(['admin']), async (req, res) => {
  try {
    const { timeRange = '30d', reviewerId } = req.query;
    
    const metrics = await AnalyticsService.getReviewQualityMetrics({
      timeRange,
      reviewerId: reviewerId || undefined
    });
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get review quality metrics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch review quality metrics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/clear-cache:
 *   post:
 *     summary: Clear analytics cache
 *     description: Clear cached analytics data to force refresh of all analytics metrics. Requires admin role.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics cache cleared successfully
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
 *                   example: "Analytics cache cleared successfully"
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
    AnalyticsService.clearCache();
    
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
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