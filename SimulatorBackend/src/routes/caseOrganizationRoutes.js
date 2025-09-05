import express from 'express';
import caseOrganizationService from '../services/CaseOrganizationService.js';
import Case from '../models/CaseModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/case-organization/categories
 * @desc Create a new case category
 * @access Private (Educator, Admin)
 */
router.post('/categories',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const category = await caseOrganizationService.createCategory(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create category'
      });
    }
  }
);

/**
 * @route GET /api/case-organization/categories
 * @desc Get all case categories
 * @access Private
 */
router.get('/categories', async (req, res) => {
  try {
    const { includeInactive, parentOnly } = req.query;

    const categories = await caseOrganizationService.getCategories({
      includeInactive: includeInactive === 'true',
      parentOnly: parentOnly === 'true'
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve categories'
    });
  }
});

/**
 * @route PUT /api/case-organization/categories/:categoryId
 * @desc Update a case category
 * @access Private (Educator, Admin)
 */
router.put('/categories/:categoryId',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const category = await caseOrganizationService.updateCategory(categoryId, req.body, req.user);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update category'
      });
    }
  }
);

/**
 * @route DELETE /api/case-organization/categories/:categoryId
 * @desc Delete a case category
 * @access Private (Educator, Admin)
 */
router.delete('/categories/:categoryId',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      await caseOrganizationService.deleteCategory(categoryId, req.user);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete category'
      });
    }
  }
);

/**
 * @route POST /api/case-organization/cases/:caseId/categories
 * @desc Add categories to a case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/categories',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { categoryIds } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds)) {
        return res.status(400).json({
          success: false,
          message: 'categoryIds must be an array'
        });
      }

      const updatedCase = await caseOrganizationService.addCategoriesToCase(caseId, categoryIds, req.user);

      res.json({
        success: true,
        message: 'Categories added to case successfully',
        data: updatedCase
      });
    } catch (error) {
      console.error('Add categories to case error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add categories to case'
      });
    }
  }
);

/**
 * @route DELETE /api/case-organization/cases/:caseId/categories
 * @desc Remove categories from a case
 * @access Private (Educator, Admin)
 */
router.delete('/cases/:caseId/categories',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { categoryIds } = req.body;

      if (!categoryIds || !Array.isArray(categoryIds)) {
        return res.status(400).json({
          success: false,
          message: 'categoryIds must be an array'
        });
      }

      const updatedCase = await caseOrganizationService.removeCategoriesFromCase(caseId, categoryIds, req.user);

      res.json({
        success: true,
        message: 'Categories removed from case successfully',
        data: updatedCase
      });
    } catch (error) {
      console.error('Remove categories from case error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove categories from case'
      });
    }
  }
);

/**
 * @route POST /api/case-organization/cases/:caseId/tags
 * @desc Add tags to a case
 * @access Private (Educator, Admin)
 */
router.post('/cases/:caseId/tags',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          message: 'tags must be an array'
        });
      }

      const updatedCase = await caseOrganizationService.addTagsToCase(caseId, tags, req.user);

      res.json({
        success: true,
        message: 'Tags added to case successfully',
        data: updatedCase
      });
    } catch (error) {
      console.error('Add tags to case error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add tags to case'
      });
    }
  }
);

/**
 * @route DELETE /api/case-organization/cases/:caseId/tags
 * @desc Remove tags from a case
 * @access Private (Educator, Admin)
 */
router.delete('/cases/:caseId/tags',
  requireAnyRole(['educator', 'admin']),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags)) {
        return res.status(400).json({
          success: false,
          message: 'tags must be an array'
        });
      }

      const updatedCase = await caseOrganizationService.removeTagsFromCase(caseId, tags, req.user);

      res.json({
        success: true,
        message: 'Tags removed from case successfully',
        data: updatedCase
      });
    } catch (error) {
      console.error('Remove tags from case error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove tags from case'
      });
    }
  }
);

/**
 * @route GET /api/case-organization/search
 * @desc Search cases by categories and tags
 * @access Private
 */
router.get('/search', async (req, res) => {
  try {
    const {
      categories,
      tags,
      specialty,
      difficulty,
      status,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {};
    if (categories) filters.categories = categories.split(',');
    if (tags) filters.tags = tags.split(',');
    if (specialty) filters.specialty = specialty;
    if (difficulty) filters.difficulty = difficulty;
    if (status) filters.status = status;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = sortOrder;

    const results = await caseOrganizationService.searchCases(filters, options, req.user);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search cases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search cases'
    });
  }
});

/**
 * @route GET /api/case-organization/categories/stats
 * @desc Get category statistics
 * @access Private (Admin)
 */
router.get('/categories/stats',
  requireAnyRole(['admin']),
  async (req, res) => {
    try {
      const stats = await caseOrganizationService.getCategoryStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get category statistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve category statistics'
      });
    }
  }
);

/**
 * @route POST /api/case-organization/categories/initialize-default
 * @desc Initialize default categories
 * @access Private (Admin)
 */
router.post('/categories/initialize-default',
  requireAnyRole(['admin']),
  async (req, res) => {
    try {
      const categories = await caseOrganizationService.initializeDefaultCategories(req.user);

      res.status(201).json({
        success: true,
        message: `${categories.length} default categories created successfully`,
        data: categories
      });
    } catch (error) {
      console.error('Initialize default categories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize default categories'
      });
    }
  }
);

/**
 * @route GET /api/case-organization/cases/:caseId/organization
 * @desc Get case organization details (categories, tags, etc.)
 * @access Private
 */
router.get('/cases/:caseId/organization', async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseDoc = await Case.findById(caseId)
      .populate('categories')
      .populate('createdBy', 'username profile.firstName profile.lastName')
      .lean();

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    if (!caseDoc.createdBy.equals(req.user._id) &&
        !caseDoc.collaborators?.some(collab => collab.user.equals(req.user._id)) &&
        caseDoc.status !== 'published' &&
        req.user.primaryRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const organizationData = {
      caseId: caseDoc._id,
      title: caseDoc.case_metadata.title,
      categories: caseDoc.categories,
      tags: caseDoc.tags || [],
      specialty: caseDoc.case_metadata.specialty,
      difficulty: caseDoc.case_metadata.difficulty,
      status: caseDoc.status,
      multimediaCount: caseDoc.multimediaContent?.length || 0,
      collaborators: caseDoc.collaborators?.length || 0,
      usageCount: caseDoc.usageCount || 0,
      lastAccessedAt: caseDoc.lastAccessedAt,
      createdAt: caseDoc.createdAt,
      lastModifiedAt: caseDoc.lastModifiedAt
    };

    res.json({
      success: true,
      data: organizationData
    });
  } catch (error) {
    console.error('Get case organization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve case organization data'
    });
  }
});

export default router;