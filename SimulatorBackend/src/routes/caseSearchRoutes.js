import express from 'express';
import caseSearchService from '../services/CaseSearchService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/case-search/advanced
 * @desc Advanced case search with multiple filters
 * @access Private
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
 * @route GET /api/case-search/suggestions
 * @desc Get search suggestions based on partial query
 * @access Private
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
 * @route GET /api/case-search/popular
 * @desc Get popular search terms and filters
 * @access Private
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
 * @route GET /api/case-search/quick
 * @desc Quick search for cases
 * @access Private
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
 * @route GET /api/case-search/filters
 * @desc Get available filter options
 * @access Private
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