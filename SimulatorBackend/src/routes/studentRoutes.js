import express from 'express';
import studentDashboardService from '../services/StudentDashboardService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import helpGuidanceService from '../services/HelpGuidanceService.js'; // Fixed import
import adaptiveLearningService from '../services/AdaptiveLearningService.js';
import userPreferencesService from '../services/UserPreferencesService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only students and admins can access
router.use(requireAnyRole(['student', 'admin']));

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

/**
 * @route GET /api/student/learning-style
 * @desc Assess student's learning style
 * @access Private (Student, Admin)
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
 * @route POST /api/student/adjust-difficulty
 * @desc Adjust case difficulty based on performance
 * @access Private (Student, Admin)
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
 * @route POST /api/student/schedule-repetition
 * @desc Schedule spaced repetition for competency review
 * @access Private (Student, Admin)
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
 * @route GET /api/student/learning-efficiency
 * @desc Optimize learning efficiency
 * @access Private (Student, Admin)
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
 * @route GET /api/student/preferences
 * @desc Get user preferences
 * @access Private (Student, Admin)
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
 * @route PUT /api/student/preferences
 * @desc Update user preferences
 * @access Private (Student, Admin)
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
 * @route DELETE /api/student/preferences
 * @desc Reset user preferences to defaults
 * @access Private (Student, Admin)
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
 * @route PUT /api/student/preferences/theme
 * @desc Update theme preference
 * @access Private (Student, Admin)
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
 * @route PUT /api/student/preferences/layout
 * @desc Update layout preference
 * @access Private (Student, Admin)
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
 * @route PUT /api/student/preferences/font-size
 * @desc Update font size preference
 * @access Private (Student, Admin)
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
 * @route GET /api/student/preferences/css
 * @desc Get CSS custom properties for user theme
 * @access Private (Student, Admin)
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

export default router;