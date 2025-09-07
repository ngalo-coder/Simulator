import express from 'express';
import CasePublishingService from '../services/CasePublishingService.js';
import { authenticateToken as authenticate, requireRoles as authorize } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/publishing/cases:
 *   get:
 *     summary: Get published cases with filtering and search
 *     description: Retrieve published cases with various filters including specialties, difficulties, program areas, locations, tags, access level, target audience, and date range. Supports pagination and sorting.
 *     tags: [Case Publishing]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: specialties
 *         schema:
 *           type: string
 *         description: Comma-separated list of specialties
 *       - in: query
 *         name: difficulties
 *         schema:
 *           type: string
 *         description: Comma-separated list of difficulty levels
 *       - in: query
 *         name: programAreas
 *         schema:
 *           type: string
 *         description: Comma-separated list of program areas
 *       - in: query
 *         name: locations
 *         schema:
 *           type: string
 *         description: Comma-separated list of locations
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: accessLevel
 *         schema:
 *           type: string
 *         description: Access level filter (e.g., public, private, institutional)
 *       - in: query
 *         name: targetAudience
 *         schema:
 *           type: string
 *         description: JSON string of target audience criteria
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for publication date filter
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for publication date filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: publishedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
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
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful retrieval of published cases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PublishedCasesResult'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases', async (req, res) => {
  try {
    const {
      query,
      specialties,
      difficulties,
      programAreas,
      locations,
      tags,
      accessLevel,
      targetAudience,
      dateFrom,
      dateTo,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      query,
      specialties: specialties ? specialties.split(',') : undefined,
      difficulties: difficulties ? difficulties.split(',') : undefined,
      programAreas: programAreas ? programAreas.split(',') : undefined,
      locations: locations ? locations.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      accessLevel,
      targetAudience: targetAudience ? JSON.parse(targetAudience) : undefined,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await CasePublishingService.getPublishedCases(filters, req.user);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get published cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch published cases',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/publishing/cases/recommendations:
 *   get:
 *     summary: Get case recommendations based on user profile
 *     description: Retrieve personalized case recommendations based on the authenticated user's profile, preferences, and past activity.
 *     tags: [Case Publishing]
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
 *         description: Maximum number of recommendations to return
 *     responses:
 *       200:
 *         description: Successful retrieval of case recommendations
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
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/recommendations', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recommendations = await CasePublishingService.getCaseRecommendations(
      req.user,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get case recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case recommendations',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/publishing/cases/popular:
 *   get:
 *     summary: Get popular published cases
 *     description: Retrieve the most popular published cases based on usage statistics, ratings, and access frequency.
 *     tags: [Case Publishing]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of popular cases to return
 *     responses:
 *       200:
 *         description: Successful retrieval of popular cases
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularCases = await CasePublishingService.getPopularCases(parseInt(limit));

    res.json({
      success: true,
      data: popularCases
    });
  } catch (error) {
    console.error('Get popular cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular cases',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/publishing/cases/{id}/access:
 *   get:
 *     summary: Check case access permissions
 *     description: Check if the current user (or anonymous user) has access to a specific published case. Returns access information without case data if not accessible.
 *     tags: [Case Publishing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to check access for
 *     responses:
 *       200:
 *         description: Access check completed successfully
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
 *                     accessible:
 *                       type: boolean
 *                       description: Whether access is granted
 *                     reason:
 *                       type: string
 *                       description: Reason for access grant or denial
 *                     requiresAuth:
 *                       type: boolean
 *                       description: Whether authentication is required
 *                     case:
 *                       $ref: '#/components/schemas/Case'
 *                       description: Case data if accessible, otherwise null
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/:id/access', async (req, res) => {
  try {
    const { id } = req.params;
    
    const accessInfo = await CasePublishingService.checkCaseAccess(id, req.user);

    res.json({
      success: true,
      data: accessInfo
    });
  } catch (error) {
    console.error('Check case access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check case access',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/publishing/cases/{id}/publish:
 *   post:
 *     summary: Publish a case
 *     description: Publish a case to make it available to users based on access rules. Requires educator or admin role with publish permission.
 *     tags: [Case Publishing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to publish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessLevel:
 *                 type: string
 *                 enum: [public, private, institutional]
 *                 description: Access level for the published case
 *               targetAudience:
 *                 type: object
 *                 description: Target audience criteria for the case
 *               publicationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional publication date (defaults to current time)
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the publication
 *     responses:
 *       200:
 *         description: Case published successfully
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
 *                   example: "Case published successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/cases/:id/publish',
  authenticate,
  authorize(['educator', 'admin']),
  requirePermission('cases', 'publish'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const publicationData = req.body;

      const publishedCase = await CasePublishingService.publishCase(
        id,
        publicationData,
        req.user._id
      );

      res.json({
        success: true,
        message: 'Case published successfully',
        data: publishedCase
      });
    } catch (error) {
      console.error('Publish case error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to publish case',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/publishing/cases/{id}/unpublish:
 *   post:
 *     summary: Unpublish/archive a case
 *     description: Unpublish or archive a case to remove it from public access. Requires educator or admin role with publish permission.
 *     tags: [Case Publishing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to unpublish
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for unpublishing the case
 *     responses:
 *       200:
 *         description: Case unpublished successfully
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
 *                   example: "Case unpublished successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/cases/:id/unpublish',
  authenticate,
  authorize(['educator', 'admin']),
  requirePermission('cases', 'publish'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const archivedCase = await CasePublishingService.unpublishCase(
        id,
        req.user._id,
        reason
      );

      res.json({
        success: true,
        message: 'Case unpublished successfully',
        data: archivedCase
      });
    } catch (error) {
      console.error('Unpublish case error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to unpublish case',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/publishing/stats:
 *   get:
 *     summary: Get case distribution statistics
 *     description: Retrieve statistics about case distribution including counts by specialty, difficulty, program area, access level, and publication status. Requires admin role.
 *     tags: [Case Publishing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of distribution statistics
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
 *                     totalPublished:
 *                       type: integer
 *                       description: Total number of published cases
 *                     bySpecialty:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     byDifficulty:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     byProgramArea:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     byAccessLevel:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     byStatus:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/stats',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const stats = await CasePublishingService.getDistributionStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get distribution stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distribution statistics',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/publishing/cases/{id}/track-usage:
 *   post:
 *     summary: Track case usage
 *     description: Track when a user accesses a case to update usage statistics. This is typically called automatically when a user views a case.
 *     tags: [Case Publishing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case being accessed
 *     responses:
 *       200:
 *         description: Case usage tracked successfully
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
 *                   example: "Case usage tracked successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/cases/:id/track-usage',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      await CasePublishingService.trackCaseUsage(id, req.user._id);

      res.json({
        success: true,
        message: 'Case usage tracked successfully'
      });
    } catch (error) {
      console.error('Track case usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track case usage',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/publishing/cases/{id}:
 *   get:
 *     summary: Get published case with access control
 *     description: Retrieve a published case with proper access control. If the user has access, the full case data is returned; otherwise, access information is provided.
 *     tags: [Case Publishing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to retrieve
 *     responses:
 *       200:
 *         description: Successful retrieval of case data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       403:
 *         description: Access denied to the case
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
 *                   example: "Access denied"
 *                 requiresAuth:
 *                   type: boolean
 *                   description: Whether authentication is required for access
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const accessInfo = await CasePublishingService.checkCaseAccess(id, req.user);

    if (!accessInfo.accessible) {
      return res.status(403).json({
        success: false,
        message: accessInfo.reason || 'Access denied',
        requiresAuth: accessInfo.requiresAuth
      });
    }

    // Track usage if user is authenticated
    if (req.user && req.user._id) {
      CasePublishingService.trackCaseUsage(id, req.user._id).catch(console.error);
    }

    res.json({
      success: true,
      data: accessInfo.case
    });
  } catch (error) {
    console.error('Get published case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch case',
      error: error.message
    });
  }
});

export default router;