import express from 'express';
import CaseReviewService from '../services/CaseReviewService.js';
import ContributedCase from '../models/ContributedCaseModel.js';
import { protect as requireAuth, optionalAuth as extractUserInfo } from '../middleware/jwtAuthMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Get all pending reviews for the authenticated reviewer
router.get('/pending', extractUserInfo, requireAuth, requireAnyRole(['educator', 'admin']), async (req, res) => {
  try {
    const pendingReviews = await CaseReviewService.getPendingReviews(req.user.id);
    res.json(pendingReviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

// Get reviews for a specific case
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

// Assign a case for review
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

// Start a review
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

// Complete a review with decision
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

// Add annotation to a review
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

// Resolve an annotation
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

// Reassign a review to another reviewer
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

// Get review statistics for dashboard
router.get('/statistics', extractUserInfo, requireAuth, requireAnyRole(['admin', 'educator']), async (req, res) => {
  try {
    const statistics = await CaseReviewService.getReviewStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Get review statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

// Get all cases needing review (for admin dashboard)
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