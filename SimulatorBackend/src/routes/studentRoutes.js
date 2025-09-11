import express from 'express';
import studentDashboardService from '../services/StudentDashboardService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import helpGuidanceService from '../services/HelpGuidanceService.js'; // Fixed import
import adaptiveLearningService from '../services/AdaptiveLearningService.js';
import userPreferencesService from '../services/UserPreferencesService.js';
import ProgressPDFService from '../services/ProgressPDFService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only students and admins can access
router.use(requireAnyRole(['student', 'admin']));

/**
 * @swagger
 * /api/student/dashboard:
 *   get:
 *     summary: Get student dashboard overview
 *     description: Retrieve comprehensive dashboard overview including progress, recommendations, and recent activity
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       $ref: '#/components/schemas/ProgressSummary'
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Case'
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Activity'
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Achievement'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await studentDashboardService.getDashboardOverview(req.user);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard'
    });
  }
});

/**
 * @swagger
 * /api/student/cases:
 *   get:
 *     summary: Get available cases with filtering and pagination
 *     description: Retrieve paginated list of available cases with filtering options by difficulty and case type
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [beginner, intermediate, advanced]
 *         style: form
 *         explode: false
 *         description: Filter by difficulty levels (comma-separated)
 *       - in: query
 *         name: caseType
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [clinical, procedural, diagnostic, emergency]
 *         style: form
 *         explode: false
 *         description: Filter by case types (comma-separated)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, difficulty, title, popularity]
 *           default: 'createdAt'
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: 'desc'
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for case titles and descriptions
 *     responses:
 *       200:
 *         description: Cases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/cases', async (req, res) => {
  try {
    const filters = {
      difficulty: req.query.difficulty ? req.query.difficulty.split(',') : undefined,
      caseType: req.query.caseType ? req.query.caseType.split(',') : undefined
    };

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 12,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search || ''
    };

    const casesData = await studentDashboardService.getAvailableCases(req.user, filters, options);
    
    res.json({
      success: true,
      data: casesData
    });
  } catch (error) {
    console.error('Get available cases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load cases'
    });
  }
});

/**
 * @swagger
 * /api/student/recommendations:
 *   get:
 *     summary: Get personalized case recommendations
 *     description: Retrieve personalized case recommendations based on student's progress, preferences, and learning history
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 6
 *         description: Maximum number of recommendations to return
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/recommendations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const recommendations = await studentDashboardService.getRecommendedCases(req.user, limit);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load recommendations'
    });
  }
});

/**
 * @swagger
 * /api/student/progress:
 *   get:
 *     summary: Get detailed progress information
 *     description: Retrieve comprehensive progress summary including competency levels, case completion, and performance metrics
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProgressSummary'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/progress', async (req, res) => {
  try {
    const progressData = await studentDashboardService.getProgressSummary(req.user);
    
    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load progress'
    });
  }
});

/**
 * @swagger
 * /api/student/achievements:
 *   get:
 *     summary: Get student achievements and badges
 *     description: Retrieve earned achievements, badges, and progress towards next achievements
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Achievement'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await studentDashboardService.getAchievements(req.user);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load achievements'
    });
  }
});

/**
 * @swagger
 * /api/student/learning-path:
 *   get:
 *     summary: Get personalized learning path
 *     description: Retrieve personalized learning path with recommended cases and competencies based on student's progress
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning path retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/learning-path', async (req, res) => {
  try {
    const learningPath = await studentDashboardService.getLearningPath(req.user);
    
    res.json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load learning path'
    });
  }
});

/**
 * @swagger
 * /api/student/activity:
 *   get:
 *     summary: Get recent activity history
 *     description: Retrieve recent student activity including case attempts, completions, and other interactions
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of activities to return
 *     responses:
 *       200:
 *         description: Activity history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await studentDashboardService.getRecentActivity(req.user, limit);
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load activity'
    });
  }
});

/**
 * @swagger
 * /api/student/discipline-config:
 *   get:
 *     summary: Get discipline-specific configuration
 *     description: Retrieve configuration and settings specific to the student's healthcare discipline
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Discipline configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     discipline:
 *                       type: string
 *                       example: 'medicine'
 *                     config:
 *                       type: object
 *                       properties:
 *                         caseTypes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         competencies:
 *                           type: array
 *                           items:
 *                             type: string
 *                         defaultDifficulty:
 *                           type: string
 *                           example: 'intermediate'
 *       404:
 *         description: Discipline configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/discipline-config', async (req, res) => {
  try {
    const discipline = req.user.profile?.discipline || 'medicine';
    const config = studentDashboardService.disciplineConfig[discipline];
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Discipline configuration not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        discipline,
        config
      }
    });
  } catch (error) {
    console.error('Get discipline config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load discipline configuration'
    });
  }
});

/**
 * @swagger
 * /api/student/help/contextual:
 *   get:
 *     summary: Get contextual help
 *     description: Retrieve contextual help content based on current page, case, or difficulty level
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Current page context (e.g., 'dashboard', 'case-view')
 *       - in: query
 *         name: caseId
 *         schema:
 *           type: string
 *         description: ID of the current case for context-specific help
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Difficulty level for context-specific help
 *     responses:
 *       200:
 *         description: Contextual help retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HelpContent'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/help/contextual', async (req, res) => {
  try {
    const context = {
      page: req.query.page,
      caseId: req.query.caseId,
      difficulty: req.query.difficulty
    };

    const helpData = await helpGuidanceService.getContextualHelp(req.user, context);
    
    res.json({
      success: true,
      data: helpData
    });
  } catch (error) {
    console.error('Get contextual help error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load contextual help'
    });
  }
});

/**
 * @swagger
 * /api/student/help/search:
 *   get:
 *     summary: Search help content
 *     description: Search through help articles, tutorials, and guidance content
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HelpContent'
 *       400:
 *         description: Search query is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/help/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchResults = await helpGuidanceService.searchHelp(query, req.user);
    
    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Search help error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search help content'
    });
  }
});

/**
 * @swagger
 * /api/student/help/categories:
 *   get:
 *     summary: Get all help categories
 *     description: Retrieve list of all available help categories for browsing help content
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Help categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HelpCategory'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/help/categories', async (req, res) => {
  try {
    const categories = helpGuidanceService.getHelpCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get help categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load help categories'
    });
  }
});

/**
 * @swagger
 * /api/student/help/categories/{categoryId}:
 *   get:
 *     summary: Get help content by category
 *     description: Retrieve all help content belonging to a specific category
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the help category
 *     responses:
 *       200:
 *         description: Category help content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/HelpCategoryContent'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/help/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const categoryHelp = await helpGuidanceService.getHelpByCategory(categoryId, req.user);
    
    res.json({
      success: true,
      data: categoryHelp
    });
  } catch (error) {
    console.error('Get help by category error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Category not found'
    });
  }
});

/**
 * @swagger
 * /api/student/help/tutorials/{tutorialId}:
 *   get:
 *     summary: Get tutorial by ID
 *     description: Retrieve detailed tutorial content by its unique identifier
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tutorialId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tutorial
 *     responses:
 *       200:
 *         description: Tutorial retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tutorial'
 *       404:
 *         description: Tutorial not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/help/tutorials/:tutorialId', async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const tutorial = await helpGuidanceService.getTutorial(tutorialId, req.user);
    
    res.json({
      success: true,
      data: tutorial
    });
  } catch (error) {
    console.error('Get tutorial error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Tutorial not found'
    });
  }
});

/**
 * @swagger
 * /api/student/guidance:
 *   get:
 *     summary: Get personalized guidance
 *     description: Receive personalized learning guidance and recommendations based on current progress and performance
 *     tags: [Student Help]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized guidance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Guidance'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/guidance', async (req, res) => {
  try {
    const guidance = await helpGuidanceService.getPersonalizedGuidance(req.user);
    
    res.json({
      success: true,
      data: guidance
    });
  } catch (error) {
    console.error('Get personalized guidance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load personalized guidance'
    });
  }
});

/**
 * @swagger
 * /api/student/learning-style:
 *   get:
 *     summary: Assess student's learning style
 *     description: Assess and retrieve the student's preferred learning style based on interaction patterns
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning style assessed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     learningStyle:
 *                       type: string
 *                       enum: [visual, auditory, kinesthetic, reading]
 *                       example: 'visual'
 *                     confidence:
 *                       type: number
 *                       format: float
 *                       example: 0.85
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 'Use more visual aids in cases'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/learning-style', async (req, res) => {
  try {
    const learningStyle = await adaptiveLearningService.assessLearningStyle(req.user);
    
    res.json({
      success: true,
      data: learningStyle
    });
  } catch (error) {
    console.error('Assess learning style error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assess learning style'
    });
  }
});

/**
 * @swagger
 * /api/student/adjust-difficulty:
 *   post:
 *     summary: Adjust case difficulty based on performance
 *     description: Adjust the difficulty level of cases based on student performance metrics
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *               - performanceScore
 *             properties:
 *               caseId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439011'
 *               performanceScore:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.75
 *     responses:
 *       200:
 *         description: Difficulty adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     newDifficulty:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced]
 *                       example: 'intermediate'
 *                     adjustmentReason:
 *                       type: string
 *                       example: 'Performance indicates readiness for higher difficulty'
 *       400:
 *         description: Invalid input - Case ID and performance score are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/adjust-difficulty', async (req, res) => {
  try {
    const { caseId, performanceScore } = req.body;
    
    if (!caseId || performanceScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and performance score are required'
      });
    }

    const caseDoc = await mongoose.model('Case').findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const adjustment = await adaptiveLearningService.adjustDifficulty(req.user, caseDoc, performanceScore);
    
    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('Adjust difficulty error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust difficulty'
    });
  }
});

/**
 * @swagger
 * /api/student/schedule-repetition:
 *   post:
 *     summary: Schedule spaced repetition for competency review
 *     description: Schedule spaced repetition sessions for competency reinforcement based on performance
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - competency
 *               - performanceScore
 *             properties:
 *               competency:
 *                 type: string
 *                 example: 'patient_assessment'
 *               performanceScore:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 1
 *                 example: 0.6
 *     responses:
 *       200:
 *         description: Repetition scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     nextReviewDate:
 *                       type: string
 *                       format: date-time
 *                       example: '2025-09-08T10:00:00Z'
 *                     intervalDays:
 *                       type: integer
 *                       example: 3
 *                     competency:
 *                       type: string
 *                       example: 'patient_assessment'
 *       400:
 *         description: Invalid input - Competency and performance score are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/schedule-repetition', async (req, res) => {
  try {
    const { competency, performanceScore } = req.body;
    
    if (!competency || performanceScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Competency and performance score are required'
      });
    }

    const schedule = await adaptiveLearningService.scheduleSpacedRepetition(req.user, competency, performanceScore);
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Schedule repetition error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule repetition'
    });
  }
});

/**
 * @swagger
 * /api/student/learning-efficiency:
 *   get:
 *     summary: Optimize learning efficiency
 *     description: Retrieve optimized learning efficiency recommendations based on student performance patterns
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Learning efficiency optimized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimalStudyTimes:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 'morning'
 *                     recommendedDuration:
 *                       type: integer
 *                       example: 45
 *                     efficiencyScore:
 *                       type: number
 *                       format: float
 *                       example: 0.92
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 'Take breaks every 45 minutes'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/learning-efficiency', async (req, res) => {
  try {
    const efficiency = await adaptiveLearningService.optimizeLearningEfficiency(req.user);
    
    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    console.error('Optimize learning efficiency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize learning efficiency'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences:
 *   get:
 *     summary: Get user preferences
 *     description: Retrieve all user preferences including theme, layout, font size, and notification settings
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await userPreferencesService.getUserPreferences(req.user);
    
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load preferences'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update multiple user preferences at once with validation
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 example: 'dark'
 *               layout:
 *                 type: string
 *                 enum: [compact, spacious, standard]
 *                 example: 'standard'
 *               fontSize:
 *                 type: string
 *                 enum: [small, medium, large, x-large]
 *                 example: 'medium'
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                     example: true
 *                   push:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Invalid preference updates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'Invalid preference updates'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/preferences', async (req, res) => {
  try {
    const updates = req.body;
    const validationErrors = userPreferencesService.validatePreferences(updates);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preference updates',
        errors: validationErrors
      });
    }

    const updatedPreferences = await userPreferencesService.updateUserPreferences(req.user, updates);
    
    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update preferences'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences:
 *   delete:
 *     summary: Reset user preferences to defaults
 *     description: Reset all user preferences to system default values
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *                 message:
 *                   type: string
 *                   example: 'Preferences reset to defaults'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/preferences', async (req, res) => {
  try {
    const defaultPreferences = await userPreferencesService.resetToDefaults(req.user);
    
    res.json({
      success: true,
      data: defaultPreferences,
      message: 'Preferences reset to defaults'
    });
  } catch (error) {
    console.error('Reset preferences error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset preferences'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences/theme:
 *   put:
 *     summary: Update theme preference
 *     description: Update the user's theme preference (light, dark, or system)
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 example: 'dark'
 *     responses:
 *       200:
 *         description: Theme preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Theme is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/preferences/theme', async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme) {
      return res.status(400).json({
        success: false,
        message: 'Theme is required'
      });
    }

    const updatedPreferences = await userPreferencesService.updateTheme(req.user, theme);
    
    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update theme'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences/layout:
 *   put:
 *     summary: Update layout preference
 *     description: Update the user's layout preference (compact, spacious, or standard)
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - layout
 *             properties:
 *               layout:
 *                 type: string
 *                 enum: [compact, spacious, standard]
 *                 example: 'standard'
 *     responses:
 *       200:
 *         description: Layout preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Layout is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/preferences/layout', async (req, res) => {
  try {
    const { layout } = req.body;
    
    if (!layout) {
      return res.status(400).json({
        success: false,
        message: 'Layout is required'
      });
    }

    const updatedPreferences = await userPreferencesService.updateLayout(req.user, layout);
    
    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Update layout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update layout'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences/font-size:
 *   put:
 *     summary: Update font size preference
 *     description: Update the user's font size preference (small, medium, large, or x-large)
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fontSize
 *             properties:
 *               fontSize:
 *                 type: string
 *                 enum: [small, medium, large, x-large]
 *                 example: 'medium'
 *     responses:
 *       200:
 *         description: Font size preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Font size is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/preferences/font-size', async (req, res) => {
  try {
    const { fontSize } = req.body;
    
    if (!fontSize) {
      return res.status(400).json({
        success: false,
        message: 'Font size is required'
      });
    }

    const updatedPreferences = await userPreferencesService.updateFontSize(req.user, fontSize);
    
    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Update font size error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update font size'
    });
  }
});

/**
 * @swagger
 * /api/student/preferences/css:
 *   get:
 *     summary: Get CSS custom properties for user theme
 *     description: Retrieve generated CSS custom properties based on the user's theme preferences
 *     tags: [Student Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSS generated successfully
 *         content:
 *           text/css:
 *             schema:
 *               type: string
 *               example: ":root { --primary-color: #007bff; --background-color: #ffffff; }"
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/preferences/css', async (req, res) => {
  try {
    const css = await userPreferencesService.generateThemeCSS(req.user);
    
    res.set('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Generate theme CSS error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate theme CSS'
    });
  }
});

/**
 * @swagger
 * /api/student/progress/download-pdf:
 *   get:
 *     summary: Download progress report as PDF
 *     description: Generate and download a comprehensive progress report in PDF format containing analytics, achievements, recommendations, and performance metrics
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [comprehensive, summary]
 *           default: comprehensive
 *         description: Report format type
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [30d, 90d, all]
 *           default: 90d
 *         description: Data time range for the report
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="progress-report-john-doe-2024-01-15.pdf"'
 *           Content-Type:
 *             description: PDF content type
 *             schema:
 *               type: string
 *               example: 'application/pdf'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Student or Admin role required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/progress/download-pdf', async (req, res) => {
  try {
    const { format = 'comprehensive', timeRange = '90d' } = req.query;
    
    // Generate filename with user info and timestamp
    const username = req.user.username || 'student';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `progress-report-${username}-${timestamp}.pdf`;
    
    console.log(`Generating PDF progress report for user: ${req.user._id}`);
    
    // Generate PDF buffer
    const pdfBuffer = await ProgressPDFService.generateProgressReport(req.user._id, {
      format,
      timeRange,
      user: req.user
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
    console.log(`PDF progress report generated successfully for user: ${req.user._id}`);
    
  } catch (error) {
    console.error('Generate progress PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate progress report'
    });
  }
});

export default router;