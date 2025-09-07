import express from 'express';
import caseTemplateLibraryService from '../services/CaseTemplateLibraryService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/case-template-library:
 *   get:
 *     summary: Get template library with filtering and pagination
 *     description: Retrieves a paginated list of case templates with various filtering options
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: discipline
 *         schema:
 *           type: string
 *         description: Filter by discipline
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by specialty
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty level
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories to filter by
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search query for template titles and descriptions
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter for featured templates only
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Filter for popular templates only
 *       - in: query
 *         name: recent
 *         schema:
 *           type: boolean
 *         description: Filter for recent templates only
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (e.g., 'title', 'createdAt', 'popularity')
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: includeStats
 *         schema:
 *           type: boolean
 *         description: Whether to include statistics in the response
 *     responses:
 *       200:
 *         description: Template library retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CaseTemplate'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     stats:
 *                       type: object
 *                       description: Statistics about the template library (if includeStats=true)
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/featured:
 *   get:
 *     summary: Get featured templates
 *     description: Retrieves a list of featured case templates
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Featured templates retrieved successfully
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
 *                     $ref: '#/components/schemas/CaseTemplate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/recommended:
 *   get:
 *     summary: Get recommended templates for user
 *     description: Retrieves personalized template recommendations based on user preferences and history
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         description: Maximum number of recommendations to return (default 5)
 *     responses:
 *       200:
 *         description: Recommended templates retrieved successfully
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
 *                     $ref: '#/components/schemas/CaseTemplate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/popular:
 *   get:
 *     summary: Get popular templates
 *     description: Retrieves the most popular case templates based on usage and ratings
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of popular templates to return (default 10)
 *     responses:
 *       200:
 *         description: Popular templates retrieved successfully
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
 *                     $ref: '#/components/schemas/CaseTemplate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/category/{categoryId}:
 *   get:
 *     summary: Get templates by category
 *     description: Retrieves case templates filtered by a specific category
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of templates to return
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (e.g., 'title', 'createdAt', 'popularity')
 *     responses:
 *       200:
 *         description: Templates by category retrieved successfully
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
 *                     $ref: '#/components/schemas/CaseTemplate'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/search:
 *   get:
 *     summary: Search templates
 *     description: Searches for case templates based on a query string and optional filters
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: discipline
 *         schema:
 *           type: string
 *         description: Filter by discipline
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by specialty
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty level
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories to filter by
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *     responses:
 *       200:
 *         description: Template search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     templates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CaseTemplate'
 *                     totalCount:
 *                       type: integer
 *                     searchQuery:
 *                       type: string
 *       400:
 *         description: Bad request - search query is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/{templateId}:
 *   get:
 *     summary: Get template details
 *     description: Retrieves detailed information about a specific case template
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template to retrieve
 *     responses:
 *       200:
 *         description: Template details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CaseTemplate'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/{templateId}/use:
 *   post:
 *     summary: Create a case from template
 *     description: Creates a new case instance based on a template with optional customizations
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template to use for creating the case
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Custom title for the new case (optional)
 *               description:
 *                 type: string
 *                 description: Custom description for the new case (optional)
 *     responses:
 *       201:
 *         description: Case created from template successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Bad request - invalid template or customization data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/{templateId}/rate:
 *   post:
 *     summary: Rate a template
 *     description: Submits a rating for a case template (1-5 stars)
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value between 1 and 5 stars
 *     responses:
 *       200:
 *         description: Template rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                       format: float
 *                     totalRatings:
 *                       type: integer
 *       400:
 *         description: Bad request - invalid rating value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/case-template-library/stats/overview:
 *   get:
 *     summary: Get template library statistics
 *     description: Retrieves overview statistics about the case template library
 *     tags: [Case Template Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template library statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTemplates:
 *                       type: integer
 *                       description: Total number of templates in the library
 *                     publicTemplates:
 *                       type: integer
 *                       description: Number of public templates
 *                     privateTemplates:
 *                       type: integer
 *                       description: Number of private templates
 *                     popularTemplates:
 *                       type: integer
 *                       description: Number of popular templates
 *                     recentTemplates:
 *                       type: integer
 *                       description: Number of recent templates
 *                     topCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topSpecialties:
 *                       type: array
 *                       items:
 *                         type: object
 *                     utilizationRate:
 *                       type: number
 *                       format: float
 *                       description: Percentage utilization rate of templates
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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