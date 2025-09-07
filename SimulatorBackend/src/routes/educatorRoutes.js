import express from 'express';
import educatorDashboardService from '../services/EducatorDashboardService.js';
import caseManagementService from '../services/CaseManagementService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';


const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only educators and admins can access
router.use(requireAnyRole(['educator', 'admin']));

/**
 * @swagger
 * /educator/dashboard:
 *   get:
 *     summary: Get educator dashboard overview
 *     description: Retrieves comprehensive dashboard data for educators including metrics, statistics, and recent activity
 *     tags: [Educator]
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
 *                 data:
 *                   $ref: '#/components/schemas/EducatorDashboard'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await educatorDashboardService.getDashboardOverview(req.user);
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get educator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load dashboard'
    });
  }
});

/**
 * @swagger
 * /educator/students:
 *   get:
 *     summary: Get assigned students with filtering and pagination
 *     description: Retrieves a paginated list of students assigned to the educator with filtering options
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Number of students per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [profile.lastName, profile.firstName, createdAt, lastActivity]
 *           default: profile.lastName
 *         description: Field to sort students by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for student name or email
 *       - in: query
 *         name: discipline
 *         schema:
 *           type: string
 *         description: Filter by medical discipline
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *           default: all
 *         description: Filter by student status
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedStudents'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/students', async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || 'profile.lastName',
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      discipline: req.query.discipline || '',
      status: req.query.status || 'all'
    };

    const studentsData = await educatorDashboardService.getAssignedStudents(req.user, options);
    
    res.json({
      success: true,
      data: studentsData
    });
  } catch (error) {
    console.error('Get assigned students error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load students'
    });
  }
});

/**
 * @swagger
 * /educator/students/{studentId}/progress:
 *   get:
 *     summary: Get detailed progress for a specific student
 *     description: Retrieves comprehensive progress data for a specific student including case completion, scores, and learning patterns
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the student to get progress for
 *     responses:
 *       200:
 *         description: Student progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/students/:studentId/progress', async (req, res) => {
  try {
    const { studentId } = req.params;
    const progress = await educatorDashboardService.getStudentProgress(studentId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load student progress'
    });
  }
});

/**
 * @swagger
 * /educator/cases:
 *   get:
 *     summary: Get educator's cases with management interface data
 *     description: Retrieves a paginated list of cases managed by the educator with filtering and sorting options
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Number of cases per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [updatedAt, createdAt, title, difficulty, status]
 *           default: updatedAt
 *         description: Field to sort cases by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, draft, review, approved, published, archived]
 *           default: all
 *         description: Filter by case status
 *       - in: query
 *         name: discipline
 *         schema:
 *           type: string
 *         description: Filter by medical discipline
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
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedCases'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases', async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || 'updatedAt',
      sortOrder: req.query.sortOrder || 'desc',
      status: req.query.status || 'all',
      discipline: req.query.discipline || ''
    };

    const casesData = await educatorDashboardService.getCaseManagementData(req.user, options);
    
    res.json({
      success: true,
      data: casesData
    });
  } catch (error) {
    console.error('Get educator cases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load cases'
    });
  }
});

/**
 * @swagger
 * /educator/cases:
 *   post:
 *     summary: Create a new case
 *     description: Creates a new medical simulation case with the provided data
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaseInput'
 *     responses:
 *       201:
 *         description: Case created successfully
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
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases', async (req, res) => {
  try {
    const caseData = req.body;
    const newCase = await caseManagementService.createCase(caseData, req.user);
    
    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: newCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create case'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}:
 *   put:
 *     summary: Update an existing case
 *     description: Updates an existing medical simulation case with the provided data
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaseInput'
 *     responses:
 *       200:
 *         description: Case updated successfully
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
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const updateData = req.body;
    
    const updatedCase = await caseManagementService.updateCase(caseId, updateData, req.user);
    
    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update case'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}:
 *   delete:
 *     summary: Delete (archive) a case
 *     description: Archives a case, making it inaccessible but preserving data for analytics
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to archive
 *     responses:
 *       200:
 *         description: Case archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid case ID or cannot archive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/cases/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    await caseManagementService.deleteCase(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case archived successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to archive case'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/submit-review:
 *   post:
 *     summary: Submit case for review
 *     description: Submits a case for formal review by administrators or other educators
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to submit for review
 *     responses:
 *       200:
 *         description: Case submitted for review successfully
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
 *         description: Case cannot be submitted for review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases/:caseId/submit-review', async (req, res) => {
  try {
    const { caseId } = req.params;
    const updatedCase = await caseManagementService.submitForReview(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case submitted for review successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Submit case for review error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit case for review'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/review:
 *   post:
 *     summary: Review and approve/reject a case
 *     description: Reviews a case by approving or rejecting it with optional comments
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to take on the case
 *               comments:
 *                 type: string
 *                 description: Optional comments for the review
 *     responses:
 *       200:
 *         description: Case reviewed successfully
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
 *         description: Invalid review data or action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases/:caseId/review', async (req, res) => {
  try {
    const { caseId } = req.params;
    const reviewData = req.body;
    
    const updatedCase = await caseManagementService.reviewCase(caseId, reviewData, req.user);
    
    res.json({
      success: true,
      message: `Case ${reviewData.action}ed successfully`,
      data: updatedCase
    });
  } catch (error) {
    console.error('Review case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to review case'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/publish:
 *   post:
 *     summary: Publish an approved case
 *     description: Publishes an approved case to make it available for students to access and use
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to publish
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Case cannot be published (not approved or invalid state)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases/:caseId/publish', async (req, res) => {
  try {
    const { caseId } = req.params;
    const publishedCase = await caseManagementService.publishCase(caseId, req.user);
    
    res.json({
      success: true,
      message: 'Case published successfully',
      data: publishedCase
    });
  } catch (error) {
    console.error('Publish case error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish case'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/analytics:
 *   get:
 *     summary: Get detailed analytics for a specific case
 *     description: Retrieves comprehensive analytics data for a specific case including completion rates, scores, and student performance metrics
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to get analytics for
 *     responses:
 *       200:
 *         description: Case analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CaseAnalytics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/:caseId/analytics', async (req, res) => {
  try {
    const { caseId } = req.params;
    const analytics = await educatorDashboardService.getCaseAnalytics(caseId, req.user);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get case analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load case analytics'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/collaborators:
 *   post:
 *     summary: Add collaborator to a case
 *     description: Adds another educator as a collaborator to a case, allowing them to edit and manage the case
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to add collaborator to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collaboratorId
 *             properties:
 *               collaboratorId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the user to add as collaborator
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [edit, view, manage]
 *                 description: Permissions to grant to the collaborator
 *     responses:
 *       200:
 *         description: Collaborator added successfully
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
 *         description: Invalid collaborator data or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases/:caseId/collaborators', async (req, res) => {
  try {
    const { caseId } = req.params;
    const collaboratorData = req.body;
    
    const updatedCase = await caseManagementService.addCollaborator(caseId, collaboratorData, req.user);
    
    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add collaborator'
    });
  }
});

/**
 * @swagger
 * /educator/cases/{caseId}/collaborators/{collaboratorId}:
 *   delete:
 *     summary: Remove collaborator from a case
 *     description: Removes a collaborator from a case, revoking their access and permissions
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the case to remove collaborator from
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the collaborator to remove
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
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
 *         description: Invalid request or cannot remove collaborator
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       404:
 *         description: Case or collaborator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/cases/:caseId/collaborators/:collaboratorId', async (req, res) => {
  try {
    const { caseId, collaboratorId } = req.params;
    
    const updatedCase = await caseManagementService.removeCollaborator(caseId, collaboratorId, req.user);
    
    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove collaborator'
    });
  }
});

/**
 * @swagger
 * /educator/analytics:
 *   get:
 *     summary: Get comprehensive analytics for educator
 *     description: Retrieves comprehensive analytics data including performance metrics, case statistics, and student statistics
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                     performanceMetrics:
 *                       $ref: '#/components/schemas/PerformanceMetrics'
 *                     caseStatistics:
 *                       $ref: '#/components/schemas/CaseStatistics'
 *                     studentStatistics:
 *                       $ref: '#/components/schemas/StudentStatistics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/analytics', async (req, res) => {
  try {
    const [
      performanceMetrics,
      caseStatistics,
      studentStatistics
    ] = await Promise.all([
      educatorDashboardService.getPerformanceMetrics(req.user),
      educatorDashboardService.getCaseStatistics(req.user),
      educatorDashboardService.getStudentStatistics(req.user)
    ]);
    
    res.json({
      success: true,
      data: {
        performanceMetrics,
        caseStatistics,
        studentStatistics
      }
    });
  } catch (error) {
    console.error('Get educator analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load analytics'
    });
  }
});

/**
 * @swagger
 * /educator/classes:
 *   post:
 *     summary: Create a new class/group
 *     description: Creates a new class or group for organizing students and assigning cases
 *     tags: [Educator]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the class
 *               description:
 *                 type: string
 *                 description: Optional description of the class
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectid
 *                 description: Array of student IDs to add to the class
 *     responses:
 *       201:
 *         description: Class created successfully
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
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Invalid class data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/classes', async (req, res) => {
  try {
    const classData = req.body;
    const newClass = await educatorDashboardService.createClass(classData, req.user);
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create class'
    });
  }
});

/**
 * @swagger
 * /educator/classes:
 *   get:
 *     summary: Get educator's classes
 *     description: Retrieves all classes/groups created by the educator
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/classes', async (req, res) => {
  try {
    const classes = await educatorDashboardService.getEducatorClasses(req.user);
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Get educator classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load classes'
    });
  }
});

/**
 * @swagger
 * /educator/statistics:
 *   get:
 *     summary: Get case statistics for educator
 *     description: Retrieves statistics about cases managed by the educator including counts by status and usage metrics
 *     tags: [Educator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CaseStatistics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Access denied - requires educator or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await caseManagementService.getCaseStatistics(req.user);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get case statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load statistics'
    });
  }
});

export default router;