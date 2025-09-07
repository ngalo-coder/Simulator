import express from 'express';
import caseOrganizationService from '../services/CaseOrganizationService.js';
import Case from '../models/CaseModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/case-organization/categories:
 *   post:
 *     summary: Create a new case category
 *     description: Create a new category for organizing cases. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *                 example: "Cardiology"
 *               description:
 *                 type: string
 *                 description: Description of the category
 *                 example: "Cases related to heart diseases and conditions"
 *               parentCategory:
 *                 type: string
 *                 description: ID of parent category if this is a subcategory
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/categories:
 *   get:
 *     summary: Get all case categories
 *     description: Retrieve all case categories with optional filtering for inactive categories and parent-only categories.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Whether to include inactive categories
 *       - in: query
 *         name: parentOnly
 *         schema:
 *           type: boolean
 *         description: Whether to return only parent categories (no subcategories)
 *     responses:
 *       200:
 *         description: Successful retrieval of categories
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
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/categories/{categoryId}:
 *   put:
 *     summary: Update a case category
 *     description: Update an existing case category. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               description:
 *                 type: string
 *                 description: Description of the category
 *               parentCategory:
 *                 type: string
 *                 description: ID of parent category if this is a subcategory
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input data or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/categories/{categoryId}:
 *   delete:
 *     summary: Delete a case category
 *     description: Delete a case category. Requires educator or admin role. Categories with associated cases cannot be deleted.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *       400:
 *         description: Cannot delete category with associated cases or invalid category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/cases/{caseId}/categories:
 *   post:
 *     summary: Add categories to a case
 *     description: Add one or more categories to a specific case. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs to add to the case
 *                 example: ["category1", "category2"]
 *     responses:
 *       200:
 *         description: Categories added to case successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categories added to case successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/cases/{caseId}/categories:
 *   delete:
 *     summary: Remove categories from a case
 *     description: Remove one or more categories from a specific case. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs to remove from the case
 *                 example: ["category1", "category2"]
 *     responses:
 *       200:
 *         description: Categories removed from case successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categories removed from case successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/cases/{caseId}/tags:
 *   post:
 *     summary: Add tags to a case
 *     description: Add one or more tags to a specific case. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags to add to the case
 *                 example: ["urgent", "pediatric"]
 *     responses:
 *       200:
 *         description: Tags added to case successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tags added to case successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/cases/{caseId}/tags:
 *   delete:
 *     summary: Remove tags from a case
 *     description: Remove one or more tags from a specific case. Requires educator or admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to modify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags to remove from the case
 *                 example: ["urgent", "pediatric"]
 *     responses:
 *       200:
 *         description: Tags removed from case successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tags removed from case successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/search:
 *   get:
 *     summary: Search cases by categories and tags
 *     description: Search for cases using category and tag filters with additional options for specialty, difficulty, status, and pagination.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (e.g., 'title', 'createdAt')
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (asc or desc)
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
 * @swagger
 * /api/case-organization/categories/stats:
 *   get:
 *     summary: Get category statistics
 *     description: Retrieve statistics about case categories, including case counts per category. Requires admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of category statistics
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
 *                     totalCategories:
 *                       type: integer
 *                       description: Total number of categories
 *                     activeCategories:
 *                       type: integer
 *                       description: Number of active categories
 *                     casesPerCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: string
 *                           categoryName:
 *                             type: string
 *                           caseCount:
 *                             type: integer
 *                     averageCasesPerCategory:
 *                       type: number
 *                       format: float
 *                       description: Average number of cases per category
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/categories/initialize-default:
 *   post:
 *     summary: Initialize default categories
 *     description: Create a set of default categories for the system. Requires admin role.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default categories initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "5 default categories created successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/case-organization/cases/{caseId}/organization:
 *   get:
 *     summary: Get case organization details
 *     description: Retrieve organization details for a specific case including categories, tags, specialty, difficulty, status, and usage statistics.
 *     tags: [Case Organization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to retrieve organization data for
 *     responses:
 *       200:
 *         description: Successful retrieval of case organization data
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
 *                     caseId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     specialty:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     status:
 *                       type: string
 *                     multimediaCount:
 *                       type: integer
 *                     collaborators:
 *                       type: integer
 *                     usageCount:
 *                       type: integer
 *                     lastAccessedAt:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastModifiedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to access this case
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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