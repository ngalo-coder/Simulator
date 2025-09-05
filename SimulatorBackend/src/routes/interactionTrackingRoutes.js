import express from 'express';
import InteractionTrackingService from '../services/InteractionTrackingService.js';
import UserInteractionTracking from '../models/UserInteractionTrackingModel.js';
import { protect as requireAuth } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all interaction tracking routes
router.use(requireAuth);

/**
 * @route POST /api/interaction-tracking/track
 * @desc Track a user interaction
 * @access Private (All authenticated users)
 */
router.post('/track', requireAnyRole(['student', 'educator', 'admin']), async (req, res) => {
  try {
    const interactionData = {
      userId: req.user._id,
      ...req.body
    };

    // Validate required fields
    if (!interactionData.interactionType) {
      return res.status(400).json({
        success: false,
        message: 'Interaction type is required'
      });
    }

    const trackedInteraction = await InteractionTrackingService.trackInteraction(interactionData);
    
    res.status(201).json({
      success: true,
      data: trackedInteraction,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track interaction'
    });
  }
});

/**
 * @route POST /api/interaction-tracking/track-bulk
 * @desc Track multiple user interactions in bulk
 * @access Private (All authenticated users)
 */
router.post('/track-bulk', requireAnyRole(['student', 'educator', 'admin']), async (req, res) => {
  try {
    const { interactions } = req.body;

    if (!interactions || !Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Interactions array is required'
      });
    }

    // Add user ID to each interaction
    const interactionsWithUser = interactions.map(interaction => ({
      userId: req.user._id,
      ...interaction
    }));

    const result = await InteractionTrackingService.trackBulkInteractions(interactionsWithUser);
    
    res.status(201).json({
      success: true,
      data: result,
      message: `${interactions.length} interactions tracked successfully`
    });
  } catch (error) {
    console.error('Track bulk interactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to track bulk interactions'
    });
  }
});

/**
 * @route GET /api/interaction-tracking/engagement/:userId
 * @desc Get user engagement analytics
 * @access Private (Student, Educator, Admin)
 */
router.get('/engagement/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange, granularity } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own engagement data'
      });
    }

    const options = {
      timeRange: timeRange || '30d',
      granularity: granularity || 'day'
    };

    const analytics = await InteractionTrackingService.getUserEngagementAnalytics(userId, options);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch engagement analytics'
    });
  }
});

/**
 * @route GET /api/interaction-tracking/global-patterns
 * @desc Get global engagement patterns
 * @access Private (Educator, Admin)
 */
router.get('/global-patterns', requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { timeRange, specialty, difficulty } = req.query;

    const filters = {
      timeRange: timeRange || '30d',
      specialty: specialty || undefined,
      difficulty: difficulty || undefined
    };

    const patterns = await InteractionTrackingService.analyzeGlobalEngagementPatterns(filters);
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Get global patterns error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch global engagement patterns'
    });
  }
});

/**
 * @route GET /api/interaction-tracking/learning-insights/:userId
 * @desc Get learning behavior insights for a user
 * @access Private (Student, Educator, Admin)
 */
router.get('/learning-insights/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own learning insights'
      });
    }

    const options = {
      timeRange: timeRange || '90d'
    };

    const insights = await InteractionTrackingService.getLearningBehaviorInsights(userId, options);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get learning insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch learning behavior insights'
    });
  }
});

/**
 * @route GET /api/interaction-tracking/recommendations/:userId
 * @desc Get personalized learning recommendations
 * @access Private (Student, Educator, Admin)
 */
router.get('/recommendations/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange, limit } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own recommendations'
      });
    }

    const options = {
      timeRange: timeRange || '30d',
      limit: parseInt(limit) || 5
    };

    const recommendations = await InteractionTrackingService.generatePersonalizedRecommendations(userId, options);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate personalized recommendations'
    });
  }
});

/**
 * @route GET /api/interaction-tracking/history/:userId
 * @desc Get user interaction history
 * @access Private (Student, Educator, Admin)
 */
router.get('/history/:userId', requireAnyRole(['student', 'educator', 'admin']), validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, page } = req.query;

    // Students can only access their own data
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Students can only view their own interaction history'
      });
    }

    const interactions = await UserInteractionTracking.getUserInteractions(
      userId, 
      parseInt(limit) || 100, 
      parseInt(page) || 1
    );
    
    res.json({
      success: true,
      data: interactions,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 100,
        total: interactions.length
      }
    });
  } catch (error) {
    console.error('Get interaction history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch interaction history'
    });
  }
});

/**
 * @route POST /api/interaction-tracking/clear-cache
 * @desc Clear interaction tracking cache (admin only)
 * @access Private (Admin)
 */
router.post('/clear-cache', requireAnyRole(['admin']), async (req, res) => {
  try {
    InteractionTrackingService.clearCache();
    
    res.json({
      success: true,
      message: 'Interaction tracking cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear interaction tracking cache'
    });
  }
});

export default router;