import express from 'express';
import AnalyticsService from '../services/AnalyticsService.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(requireAuth);

/**
 * @route GET /api/analytics/case-usage
 * @desc Get comprehensive case usage analytics
 * @access Private (Admin, Educator)
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
 * @route GET /api/analytics/case-effectiveness
 * @desc Get case effectiveness metrics
 * @access Private (Admin, Educator)
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
 * @route GET /api/analytics/difficulty-analysis
 * @desc Get difficulty analysis for cases
 * @access Private (Admin, Educator)
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
 * @route GET /api/analytics/performance-trends
 * @desc Get performance trends over time
 * @access Private (Admin, Educator)
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
 * @route GET /api/analytics/contributor-analytics
 * @desc Get contributor performance analytics
 * @access Private (Admin)
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
 * @route GET /api/analytics/review-quality
 * @desc Get review quality metrics
 * @access Private (Admin)
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
 * @route POST /api/analytics/clear-cache
 * @desc Clear analytics cache
 * @access Private (Admin)
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