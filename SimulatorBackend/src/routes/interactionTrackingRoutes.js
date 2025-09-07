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
 * @swagger
 * /interaction-tracking/track:
 *   post:
 *     summary: Track a user interaction
 *     description: Records a single user interaction event for analytics and engagement tracking
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interactionType
 *             properties:
 *               interactionType:
 *                 type: string
 *                 enum: [case_start, case_complete, case_pause, case_resume, case_abandon, help_request, feedback_submit, content_view, search, navigation]
 *               caseId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the case if interaction is case-related
 *               metadata:
 *                 type: object
 *                 description: Additional metadata about the interaction
 *     responses:
 *       201:
 *         description: Interaction tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/track-bulk:
 *   post:
 *     summary: Track multiple user interactions in bulk
 *     description: Records multiple user interaction events in a single request for efficient analytics tracking
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interactions
 *             properties:
 *               interactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - interactionType
 *                   properties:
 *                     interactionType:
 *                       type: string
 *                       enum: [case_start, case_complete, case_pause, case_resume, case_abandon, help_request, feedback_submit, content_view, search, navigation]
 *                     caseId:
 *                       type: string
 *                       format: objectid
 *                       description: ID of the case if interaction is case-related
 *                     metadata:
 *                       type: object
 *                       description: Additional metadata about the interaction
 *     responses:
 *       201:
 *         description: Bulk interactions tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Interaction'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/engagement/{userId}:
 *   get:
 *     summary: Get user engagement analytics
 *     description: Retrieves detailed engagement analytics for a specific user, including activity patterns and metrics
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the user to get engagement data for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 180d, 365d]
 *           default: 30d
 *         description: Time range for analytics data
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Granularity of the data points
 *     responses:
 *       200:
 *         description: Engagement analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EngagementAnalytics'
 *       403:
 *         description: Access denied - students can only view their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/global-patterns:
 *   get:
 *     summary: Get global engagement patterns
 *     description: Retrieves aggregated engagement patterns across all users for analytics and insights
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 180d, 365d]
 *           default: 30d
 *         description: Time range for analytics data
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by medical specialty
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by case difficulty level
 *     responses:
 *       200:
 *         description: Global engagement patterns retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GlobalEngagementPatterns'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/learning-insights/{userId}:
 *   get:
 *     summary: Get learning behavior insights for a user
 *     description: Retrieves detailed learning behavior insights and patterns for a specific user
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the user to get learning insights for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 180d, 365d]
 *           default: 90d
 *         description: Time range for learning insights data
 *     responses:
 *       200:
 *         description: Learning insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LearningInsights'
 *       403:
 *         description: Access denied - students can only view their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/recommendations/{userId}:
 *   get:
 *     summary: Get personalized learning recommendations
 *     description: Retrieves personalized learning recommendations based on user's interaction history and behavior
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the user to get recommendations for
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 180d, 365d]
 *           default: 30d
 *         description: Time range for recommendation data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of recommendations to return
 *     responses:
 *       200:
 *         description: Personalized recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Recommendations'
 *       403:
 *         description: Access denied - students can only view their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/history/{userId}:
 *   get:
 *     summary: Get user interaction history
 *     description: Retrieves paginated interaction history for a specific user, including all tracked events and activities
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the user to get interaction history for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Number of interactions to return per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Interaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Interaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       403:
 *         description: Access denied - students can only view their own data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /interaction-tracking/clear-cache:
 *   post:
 *     summary: Clear interaction tracking cache
 *     description: Clears all cached interaction tracking data (admin only operation)
 *     tags: [Interaction Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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