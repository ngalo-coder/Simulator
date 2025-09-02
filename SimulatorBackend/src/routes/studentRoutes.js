import express from 'express';
import studentDashboardService from '../services/StudentDashboardService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rbacMiddleware from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply RBAC middleware to ensure only students and admins can access
router.use(rbacMiddleware(['student', 'admin']));

/**
 * @route GET /api/student/dashboard
 * @desc Get student dashboard overview
 * @access Private (Student, Admin)
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
 * @route GET /api/student/cases
 * @desc Get available cases for student with filtering and pagination
 * @access Private (Student, Admin)
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
 * @route GET /api/student/recommendations
 * @desc Get personalized case recommendations
 * @access Private (Student, Admin)
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
 * @route GET /api/student/progress
 * @desc Get detailed progress information
 * @access Private (Student, Admin)
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
 * @route GET /api/student/achievements
 * @desc Get student achievements and badges
 * @access Private (Student, Admin)
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
 * @route GET /api/student/learning-path
 * @desc Get personalized learning path
 * @access Private (Student, Admin)
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
 * @route GET /api/student/activity
 * @desc Get recent activity history
 * @access Private (Student, Admin)
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
 * @route GET /api/student/discipline-config
 * @desc Get discipline-specific configuration
 * @access Private (Student, Admin)
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

export default router;impor
t helpGuidanceService from '../services/HelpGuidanceService.js';

/**
 * @route GET /api/student/help/contextual
 * @desc Get contextual help based on current page/context
 * @access Private (Student, Admin)
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
 * @route GET /api/student/help/search
 * @desc Search help content
 * @access Private (Student, Admin)
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
 * @route GET /api/student/help/categories
 * @desc Get all help categories
 * @access Private (Student, Admin)
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
 * @route GET /api/student/help/categories/:categoryId
 * @desc Get help content by category
 * @access Private (Student, Admin)
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
 * @route GET /api/student/help/tutorials/:tutorialId
 * @desc Get tutorial by ID
 * @access Private (Student, Admin)
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
 * @route GET /api/student/guidance
 * @desc Get personalized guidance based on student progress
 * @access Private (Student, Admin)
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