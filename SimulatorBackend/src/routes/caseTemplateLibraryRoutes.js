import express from 'express';
import caseTemplateLibraryService from '../services/CaseTemplateLibraryService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/case-template-library
 * @desc Get template library with filtering and pagination
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      discipline,
      specialty,
      difficulty,
      tags,
      categories,
      searchQuery,
      isPublic,
      featured,
      popular,
      recent,
      sortBy,
      sortOrder,
      page,
      limit,
      includeStats
    } = req.query;

    const filters = {};
    if (discipline) filters.discipline = discipline;
    if (specialty) filters.specialty = specialty;
    if (difficulty) filters.difficulty = difficulty;
    if (tags) filters.tags = tags.split(',');
    if (categories) filters.categories = categories.split(',');
    if (searchQuery) filters.searchQuery = searchQuery;
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (featured !== undefined) filters.featured = featured === 'true';
    if (popular !== undefined) filters.popular = popular === 'true';
    if (recent !== undefined) filters.recent = recent === 'true';
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (includeStats !== undefined) options.includeStats = includeStats === 'true';

    const result = await caseTemplateLibraryService.getTemplateLibrary(filters, options, req.user);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get template library error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve template library'
    });
  }
});

/**
 * @route GET /api/case-template-library/featured
 * @desc Get featured templates
 * @access Private
 */
router.get('/featured', async (req, res) => {
  try {
    const featuredTemplates = await caseTemplateLibraryService.getFeaturedTemplates(req.user);

    res.json({
      success: true,
      data: featuredTemplates
    });
  } catch (error) {
    console.error('Get featured templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve featured templates'
    });
  }
});

/**
 * @route GET /api/case-template-library/recommended
 * @desc Get recommended templates for user
 * @access Private
 */
router.get('/recommended', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recommendedTemplates = await caseTemplateLibraryService.getRecommendedTemplates(
      req.user,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendedTemplates
    });
  } catch (error) {
    console.error('Get recommended templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve recommended templates'
    });
  }
});

/**
 * @route GET /api/case-template-library/popular
 * @desc Get popular templates
 * @access Private
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularTemplates = await caseTemplateLibraryService.getPopularTemplates(parseInt(limit));

    res.json({
      success: true,
      data: popularTemplates
    });
  } catch (error) {
    console.error('Get popular templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve popular templates'
    });
  }
});

/**
 * @route GET /api/case-template-library/category/:categoryId
 * @desc Get templates by category
 * @access Private
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit, sortBy } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (sortBy) options.sortBy = sortBy;

    const templates = await caseTemplateLibraryService.getTemplatesByCategory(
      categoryId,
      options,
      req.user
    );

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates by category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve templates by category'
    });
  }
});

/**
 * @route GET /api/case-template-library/search
 * @desc Search templates
 * @access Private
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, ...filters } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await caseTemplateLibraryService.searchTemplates(query, filters, req.user);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search templates error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search templates'
    });
  }
});

/**
 * @route GET /api/case-template-library/:templateId
 * @desc Get template details
 * @access Private
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const templateDetails = await caseTemplateLibraryService.getTemplateDetails(templateId, req.user);

    res.json({
      success: true,
      data: templateDetails
    });
  } catch (error) {
    console.error('Get template details error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Template not found'
    });
  }
});

/**
 * @route POST /api/case-template-library/:templateId/use
 * @desc Create a case from template
 * @access Private
 */
router.post('/:templateId/use', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { title, description } = req.body;

    const customization = {};
    if (title) customization.title = title;
    if (description) customization.description = description;

    const newCase = await caseTemplateLibraryService.createCaseFromTemplate(
      templateId,
      customization,
      req.user
    );

    res.status(201).json({
      success: true,
      message: 'Case created from template successfully',
      data: newCase
    });
  } catch (error) {
    console.error('Create case from template error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create case from template'
    });
  }
});

/**
 * @route POST /api/case-template-library/:templateId/rate
 * @desc Rate a template
 * @access Private
 */
router.post('/:templateId/rate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const updatedTemplate = await caseTemplateLibraryService.rateTemplate(
      templateId,
      rating,
      req.user
    );

    res.json({
      success: true,
      message: 'Template rated successfully',
      data: {
        averageRating: updatedTemplate.averageRating,
        totalRatings: updatedTemplate.totalRatings
      }
    });
  } catch (error) {
    console.error('Rate template error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to rate template'
    });
  }
});

/**
 * @route GET /api/case-template-library/stats/overview
 * @desc Get template library statistics
 * @access Private
 */
router.get('/stats/overview', async (req, res) => {
  try {
    // Get basic statistics
    const [
      totalTemplates,
      publicTemplates,
      popularTemplates,
      recentTemplates,
      topCategories,
      topSpecialties
    ] = await Promise.all([
      // Total templates
      caseTemplateLibraryService.getTemplateLibrary({}, { includeStats: false }, req.user)
        .then(result => result.pagination.total),

      // Public templates
      caseTemplateLibraryService.getTemplateLibrary(
        { isPublic: true },
        { includeStats: false },
        req.user
      ).then(result => result.pagination.total),

      // Popular templates
      caseTemplateLibraryService.getPopularTemplates(100).then(templates => templates.length),

      // Recent templates
      caseTemplateLibraryService.getTemplateLibrary(
        { recent: true },
        { includeStats: false },
        req.user
      ).then(result => result.pagination.total),

      // Top categories (simplified)
      Promise.resolve([]),

      // Top specialties (simplified)
      Promise.resolve([])
    ]);

    const stats = {
      totalTemplates,
      publicTemplates,
      privateTemplates: totalTemplates - publicTemplates,
      popularTemplates,
      recentTemplates,
      topCategories,
      topSpecialties,
      utilizationRate: totalTemplates > 0 ? (popularTemplates / totalTemplates * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get template library stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve template library statistics'
    });
  }
});

export default router;