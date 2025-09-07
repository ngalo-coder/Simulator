import express from 'express';
import caseSearchService from '../services/CaseSearchService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/case-search/advanced:
 *   get:
 *     summary: Advanced case search with multiple filters
 *     description: Perform an advanced search for cases with various filters including categories, tags, specialty, difficulty, status, and more. Returns paginated results with facets if requested.
 *     tags: [Case Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of category IDs
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Case specialty filter
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Case difficulty level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Case status filter
 *       - in: query
 *         name: programArea
 *         schema:
 *           type: string
 *         description: Program area filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: User ID of case creator
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for case creation filter
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for case creation filter
 *       - in: query
 *         name: multimediaTypes
 *         schema:
 *           type: string
 *         description: Comma-separated list of multimedia types
 *       - in: query
 *         name: hasMultimedia
 *         schema:
 *           type: boolean
 *         description: Filter cases that have multimedia content
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum case rating
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum case rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (e.g., 'title', 'createdAt', 'rating')
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (asc or desc)
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
 *         name: includeFacets
 *         schema:
 *           type: boolean
 *         description: Whether to include facet information in response
 *     responses:
 *       200:
 *         description: Successful search operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SearchResults'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/advanced', async (req, res) => {
  try {
    const {
      q: query,
      categories,
      tags,
      specialty,
      difficulty,
      status,
      programArea,
      location,
      createdBy,
      dateFrom,
      dateTo,
      multimediaTypes,
      hasMultimedia,
      minRating,
      maxRating,
      sortBy,
      sortOrder,
      page,
      limit,
      includeFacets
    } = req.query;

    const filters = {};
    if (query) filters.query = query;
    if (categories) filters.categories = categories.split(',');
    if (tags) filters.tags = tags.split(',');
    if (specialty) filters.specialty = specialty;
    if (difficulty) filters.difficulty = difficulty;
    if (status) filters.status = status;
    if (programArea) filters.programArea = programArea;
    if (location) filters.location = location;
    if (createdBy) filters.createdBy = createdBy;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (multimediaTypes) filters.multimediaTypes = multimediaTypes.split(',');
    if (hasMultimedia !== undefined) filters.hasMultimedia = hasMultimedia === 'true';
    if (minRating) filters.minRating = parseFloat(minRating);
    if (maxRating) filters.maxRating = parseFloat(maxRating);
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (includeFacets !== undefined) options.includeFacets = includeFacets === 'true';

    const results = await caseSearchService.advancedSearch(filters, options, req.user);

    // Save search analytics
    if (query || Object.keys(filters).length > 1) {
      await caseSearchService.saveSearchAnalytics(query, filters, results.cases.length, req.user);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform advanced search'
    });
  }
});

/**
 * @swagger
 * /api/case-search/suggestions:
 *   get:
 *     summary: Get search suggestions based on partial query
 *     description: Returns search suggestions for auto-complete functionality based on a partial query string.
 *     tags: [Case Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Partial search query for suggestions
 *     responses:
 *       200:
 *         description: Successful retrieval of search suggestions
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
 *                     type: string
 *                   example: ["cardiology", "pediatric cardiology", "cardiac surgery"]
 *       400:
 *         description: Missing query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await caseSearchService.getSearchSuggestions(query, req.user);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get search suggestions'
    });
  }
});

/**
 * @swagger
 * /api/case-search/popular:
 *   get:
 *     summary: Get popular search terms and filters
 *     description: Retrieves the most popular search terms and commonly used filters based on search analytics.
 *     tags: [Case Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of popular search data
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
 *                     popularTerms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           term:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     popularFilters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filter:
 *                             type: string
 *                           value:
 *                             type: string
 *                           count:
 *                             type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/popular', async (req, res) => {
  try {
    const popularData = await caseSearchService.getPopularSearchTerms(req.user);

    res.json({
      success: true,
      data: popularData
    });
  } catch (error) {
    console.error('Get popular search terms error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get popular search terms'
    });
  }
});

/**
 * @swagger
 * /api/case-search/quick:
 *   get:
 *     summary: Quick search for cases
 *     description: Perform a quick text-based search for cases with minimal filtering options. Returns limited results for fast response.
 *     tags: [Case Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of results to return (default 10)
 *     responses:
 *       200:
 *         description: Successful quick search operation
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
 *                     cases:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Case'
 *                     total:
 *                       type: integer
 *                       description: Total number of matching cases
 *       400:
 *         description: Missing or invalid query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/quick', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = { query };
    const options = { limit: parseInt(limit), includeFacets: false };

    const results = await caseSearchService.advancedSearch(filters, options, req.user);

    res.json({
      success: true,
      data: {
        cases: results.cases,
        total: results.pagination.total
      }
    });
  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to perform quick search'
    });
  }
});

/**
 * @swagger
 * /api/case-search/filters:
 *   get:
 *     summary: Get available filter options
 *     description: Retrieves all available filter options for case search, including specialties, difficulties, statuses, program areas, multimedia types, categories, and tags.
 *     tags: [Case Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of filter options
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
 *                     specialties:
 *                       type: array
 *                       items:
 *                         type: string
 *                     difficulties:
 *                       type: array
 *                       items:
 *                         type: string
 *                     statuses:
 *                       type: array
 *                       items:
 *                         type: string
 *                     programAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     multimediaTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     dateRange:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: string
 *                             format: date
 *                           max:
 *                             type: string
 *                             format: date
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/filters', async (req, res) => {
  try {
    const baseQuery = caseSearchService.buildBaseQuery(req.user);

    // Get filter options from the database
    const filterOptions = await caseSearchService.generateFacets(baseQuery);

    res.json({
      success: true,
      data: {
        specialties: filterOptions.specialties || [],
        difficulties: filterOptions.difficulties || [],
        statuses: filterOptions.statuses || [],
        programAreas: filterOptions.programAreas || [],
        multimediaTypes: filterOptions.multimediaTypes || [],
        categories: filterOptions.categories || [],
        tags: filterOptions.tags || [],
        dateRange: filterOptions.dateRange || []
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get filter options'
    });
  }
});

export default router;