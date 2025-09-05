import express from 'express';
import CasePublishingService from '../services/CasePublishingService.js';
import { authenticateToken as authenticate, requireRoles as authorize } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/publishing/cases
 * @desc    Get published cases with filtering and search
 * @access  Public (with access control)
 */
router.get('/cases', async (req, res) => {
  try {
    const {
      query,
      specialties,
      difficulties,
      programAreas,
      locations,
      tags,
      accessLevel,
      targetAudience,
      dateFrom,
      dateTo,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      query,
      specialties: specialties ? specialties.split(',') : undefined,
      difficulties: difficulties ? difficulties.split(',') : undefined,
      programAreas: programAreas ? programAreas.split(',') : undefined,
      locations: locations ? locations.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      accessLevel,
      targetAudience: targetAudience ? JSON.parse(targetAudience) : undefined,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await CasePublishingService.getPublishedCases(filters, req.user);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get published cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch published cases',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/publishing/cases/recommendations
 * @desc    Get case recommendations based on user profile
 * @access  Private
 */
router.get('/cases/recommendations', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await CasePublishingService.getCaseRecommendations(
      req.user,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get case recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/publishing/cases/popular
 * @desc    Get popular published cases
 * @access  Public
 */
router.get('/cases/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularCases = await CasePublishingService.getPopularCases(parseInt(limit));

    res.json({
      success: true,
      data: popularCases
    });
  } catch (error) {
    console.error('Get popular cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular cases',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/publishing/cases/:id/access
 * @desc    Check case access permissions
 * @access  Public (returns access info without case data if not accessible)
 */
router.get('/cases/:id/access', async (req, res) => {
  try {
    const { id } = req.params;
    
    const accessInfo = await CasePublishingService.checkCaseAccess(id, req.user);

    res.json({
      success: true,
      data: accessInfo
    });
  } catch (error) {
    console.error('Check case access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check case access',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/publishing/cases/:id/publish
 * @desc    Publish a case
 * @access  Private (Educator/Admin only)
 */
router.post(
  '/cases/:id/publish',
  authenticate,
  authorize(['educator', 'admin']),
  requirePermission('cases', 'publish'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const publicationData = req.body;

      const publishedCase = await CasePublishingService.publishCase(
        id,
        publicationData,
        req.user._id
      );

      res.json({
        success: true,
        message: 'Case published successfully',
        data: publishedCase
      });
    } catch (error) {
      console.error('Publish case error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to publish case',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/publishing/cases/:id/unpublish
 * @desc    Unpublish/archive a case
 * @access  Private (Educator/Admin only)
 */
router.post(
  '/cases/:id/unpublish',
  authenticate,
  authorize(['educator', 'admin']),
  requirePermission('cases', 'publish'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const archivedCase = await CasePublishingService.unpublishCase(
        id,
        req.user._id,
        reason
      );

      res.json({
        success: true,
        message: 'Case unpublished successfully',
        data: archivedCase
      });
    } catch (error) {
      console.error('Unpublish case error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to unpublish case',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/publishing/stats
 * @desc    Get case distribution statistics
 * @access  Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const stats = await CasePublishingService.getDistributionStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get distribution stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distribution statistics',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/publishing/cases/:id/track-usage
 * @desc    Track case usage (called when a user accesses a case)
 * @access  Private
 */
router.post(
  '/cases/:id/track-usage',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      await CasePublishingService.trackCaseUsage(id, req.user._id);

      res.json({
        success: true,
        message: 'Case usage tracked successfully'
      });
    } catch (error) {
      console.error('Track case usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track case usage',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/publishing/cases/:id
 * @desc    Get published case with access control
 * @access  Public (with access control)
 */
router.get('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const accessInfo = await CasePublishingService.checkCaseAccess(id, req.user);

    if (!accessInfo.accessible) {
      return res.status(403).json({
        success: false,
        message: accessInfo.reason || 'Access denied',
        requiresAuth: accessInfo.requiresAuth
      });
    }

    // Track usage if user is authenticated
    if (req.user && req.user._id) {
      CasePublishingService.trackCaseUsage(id, req.user._id).catch(console.error);
    }

    res.json({
      success: true,
      data: accessInfo.case
    });
  } catch (error) {
    console.error('Get published case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case',
      error: error.message
    });
  }
});

export default router;