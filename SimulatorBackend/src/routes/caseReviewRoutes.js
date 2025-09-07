import express from 'express';
import CaseReviewService from '../services/CaseReviewService.js';
import ContributedCase from '../models/ContributedCaseModel.js';
import { protect as requireAuth, optionalAuth as extractUserInfo } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/case-review/pending:
 *   get:
 *     summary: Get all pending reviews for the authenticated reviewer
 *     description: Retrieve all case reviews that are currently pending assignment to the authenticated reviewer. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of pending reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/pending', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const pendingReviews = await CaseReviewService.getPendingReviews(req.user.id);
    res.json(pendingReviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

/**
 * @swagger
 * /api/case-review/case/{caseId}:
 *   get:
 *     summary: Get reviews for a specific case
 *     description: Retrieve all reviews associated with a specific case. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to retrieve reviews for
 *     responses:
 *       200:
 *         description: Successful retrieval of case reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/case/:caseId', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { caseId } = req.params;
    const reviews = await CaseReviewService.getCaseReviews(caseId);
    res.json(reviews);
  } catch (error) {
    console.error('Get case reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch case reviews' });
  }
});

/**
 * @swagger
 * /api/case-review/assign/{caseId}:
 *   post:
 *     summary: Assign a case for review
 *     description: Assign a submitted case to the review queue with optional priority and deadline. Requires admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to assign for review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Priority level for the review
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: Optional deadline for completing the review
 *     responses:
 *       201:
 *         description: Case assigned for review successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Case assigned for review successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *                 case:
 *                   $ref: '#/components/schemas/Case'
 *                 reviewer:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data or case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.post('/assign/:caseId', extractUserInfo, requireAuth, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { priority, deadline } = req.body;

    const assignment = await CaseReviewService.assignCaseForReview(caseId, {
      priority,
      deadline: deadline ? new Date(deadline) : undefined
    });

    res.status(201).json({
      message: 'Case assigned for review successfully',
      review: assignment.review,
      case: assignment.case,
      reviewer: assignment.reviewer
    });
  } catch (error) {
    console.error('Assign case for review error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign case for review' });
  }
});

/**
 * @swagger
 * /api/case-review/{reviewId}/start:
 *   post:
 *     summary: Start a review
 *     description: Mark a review as started by the authenticated reviewer. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to start
 *     responses:
 *       200:
 *         description: Review started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review started successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:reviewId/start', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await CaseReviewService.startReview(reviewId, req.user.id);

    res.json({
      message: 'Review started successfully',
      review
    });
  } catch (error) {
    console.error('Start review error:', error);
    res.status(500).json({ error: error.message || 'Failed to start review' });
  }
});

/**
 * @swagger
 * /api/case-review/{reviewId}/complete:
 *   post:
 *     summary: Complete a review with decision
 *     description: Complete a review by providing a decision, feedback, and ratings. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *               - feedback
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected, needs_revision]
 *                 description: Final decision on the case
 *               feedback:
 *                 type: string
 *                 description: Detailed feedback for the case author
 *               ratings:
 *                 type: object
 *                 description: Optional ratings for different aspects of the case
 *                 properties:
 *                   accuracy:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   completeness:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   educationalValue:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *     responses:
 *       200:
 *         description: Review completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review completed with decision: approved"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *                 case:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Missing required fields or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:reviewId/complete', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { decision, feedback, ratings } = req.body;

    if (!decision || !feedback) {
      return res.status(400).json({ error: 'Decision and feedback are required' });
    }

    const result = await CaseReviewService.completeReview(
      reviewId,
      req.user.id,
      { decision, feedback, ratings }
    );

    res.json({
      message: `Review completed with decision: ${decision}`,
      review: result.review,
      case: result.case
    });
  } catch (error) {
    console.error('Complete review error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete review' });
  }
});

/**
 * @swagger
 * /api/case-review/{reviewId}/annotations:
 *   post:
 *     summary: Add annotation to a review
 *     description: Add an annotation to a specific part of a case during review. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to add annotation to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - fieldPath
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [comment, suggestion, correction, question]
 *                 description: Type of annotation
 *               fieldPath:
 *                 type: string
 *                 description: Path to the field being annotated
 *               content:
 *                 type: string
 *                 description: Annotation content
 *               suggestedValue:
 *                 type: string
 *                 description: Suggested value for correction annotations
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 description: Severity level for the annotation
 *     responses:
 *       201:
 *         description: Annotation added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Annotation added successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Missing required fields or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:reviewId/annotations', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { type, fieldPath, content, suggestedValue, severity } = req.body;

    if (!type || !fieldPath || !content) {
      return res.status(400).json({ error: 'Type, fieldPath, and content are required' });
    }

    const review = await CaseReviewService.addAnnotation(reviewId, req.user.id, {
      type,
      fieldPath,
      content,
      suggestedValue,
      severity: severity || 'medium'
    });

    res.status(201).json({
      message: 'Annotation added successfully',
      review
    });
  } catch (error) {
    console.error('Add annotation error:', error);
    res.status(500).json({ error: error.message || 'Failed to add annotation' });
  }
});

/**
 * @swagger
 * /api/case-review/{reviewId}/annotations/{annotationIndex}/resolve:
 *   patch:
 *     summary: Resolve an annotation
 *     description: Mark an annotation as resolved. Requires educator or admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review containing the annotation
 *       - in: path
 *         name: annotationIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the annotation to resolve
 *     responses:
 *       200:
 *         description: Annotation resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Annotation resolved successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - educator or admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:reviewId/annotations/:annotationIndex/resolve', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const { reviewId, annotationIndex } = req.params;
    const review = await CaseReviewService.resolveAnnotation(
      reviewId,
      parseInt(annotationIndex),
      req.user.id
    );

    res.json({
      message: 'Annotation resolved successfully',
      review
    });
  } catch (error) {
    console.error('Resolve annotation error:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve annotation' });
  }
});

/**
 * @swagger
 * /api/case-review/{reviewId}/reassign:
 *   patch:
 *     summary: Reassign a review to another reviewer
 *     description: Reassign a review to a different reviewer. Requires admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to reassign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newReviewerId
 *             properties:
 *               newReviewerId:
 *                 type: string
 *                 description: ID of the new reviewer
 *     responses:
 *       200:
 *         description: Review reassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review reassigned successfully"
 *                 review:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Missing required fields or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
router.patch('/:reviewId/reassign', extractUserInfo, requireAuth, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { newReviewerId } = req.body;

    if (!newReviewerId) {
      return res.status(400).json({ error: 'newReviewerId is required' });
    }

    const review = await CaseReviewService.reassignReview(
      reviewId,
      newReviewerId,
      req.user.id
    );

    res.json({
      message: 'Review reassigned successfully',
      review
    });
  } catch (error) {
    console.error('Reassign review error:', error);
    res.status(500).json({ error: error.message || 'Failed to reassign review' });
  }
});

/**
 * @swagger
 * /api/case-review/statistics:
 *   get:
 *     summary: Get review statistics for dashboard
 *     description: Retrieve statistics about case reviews for dashboard display. Requires admin or educator role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of review statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReviews:
 *                   type: integer
 *                 pendingReviews:
 *                   type: integer
 *                 completedReviews:
 *                   type: integer
 *                 averageReviewTime:
 *                   type: number
 *                   format: float
 *                 byPriority:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 byDecision:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin or educator role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', extractUserInfo, requireAuth, requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const statistics = await CaseReviewService.getReviewStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get review statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

/**
 * @swagger
 * /api/case-review/queue:
 *   get:
 *     summary: Get all cases needing review (for admin dashboard)
 *     description: Retrieve a paginated list of cases that need review, with filtering options. Requires admin role.
 *     tags: [Case Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by review status
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by case specialty
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by review priority
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
 *         description: Successful retrieval of review queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 total:
 *                   type: integer
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
router.get('/queue', extractUserInfo, requireAuth, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { status, specialty, priority, page = 1, limit = 20 } = req.query;
    
    const query = { status: 'submitted' };
    if (specialty && specialty !== 'all') {
      query['caseData.case_metadata.specialty'] = specialty;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const cases = await ContributedCase.find(query)
      .select('caseData.case_metadata.title caseData.case_metadata.specialty caseData.case_metadata.difficulty submittedAt priority')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ContributedCase.countDocuments(query);

    res.json({
      cases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get review queue error:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

export default router;