import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  getPerformanceReview,
  getCasePerformanceReview,
  getPeerComparisonReview,
  getImprovementProgress,
  generateReflectionPrompts
} from '../controllers/performanceReviewController.js';

const router = express.Router();

// Get comprehensive performance review for authenticated user
router.get('/review', protect, getPerformanceReview);

// Get detailed performance review for a specific case
router.get('/review/case/:caseId', protect, getCasePerformanceReview);

// Get peer comparison data
router.get('/review/peer-comparison', protect, getPeerComparisonReview);

// Get improvement progress over time
router.get('/review/improvement-progress', protect, getImprovementProgress);

// Generate self-reflection prompts
router.get('/review/reflection-prompts', protect, generateReflectionPrompts);

export default router;