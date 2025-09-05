import express from 'express';
import { protect, optionalAuth } from '../middleware/jwtAuthMiddleware.js';
import { validateEndSession, validateObjectId, validateTreatmentPlan } from '../middleware/validation.js';
import { endSessionLimiter } from '../middleware/rateLimiter.js';
import {
  getCases,
  startSimulation,
  handleAsk,
  endSession,
  getCaseCategories,
  getPerformanceMetricsBySession,
  submitTreatmentPlan,
  getTreatmentOutcomes,
  startRetakeSession,
  getCaseRetakeSessions,
  calculateImprovementMetrics
} from '../controllers/simulationController.js';

const router = express.Router();

router.get('/cases', protect, getCases);
router.get('/case-categories', protect, getCaseCategories);
router.post('/start', protect, startSimulation);
router.get('/ask', optionalAuth, handleAsk);
router.post('/end', protect, endSessionLimiter, validateEndSession, endSession);
router.get('/performance-metrics/session/:sessionId', protect, validateObjectId('sessionId'), getPerformanceMetricsBySession);
router.post('/treatment-plan/:sessionId', protect, validateObjectId('sessionId'), validateTreatmentPlan, submitTreatmentPlan);
router.get('/treatment-outcomes/:sessionId', protect, validateObjectId('sessionId'), getTreatmentOutcomes);

// Retake session routes
router.post('/retake/start', protect, startRetakeSession);
router.get('/retake/sessions/:caseId', protect, getCaseRetakeSessions);
router.post('/retake/calculate-improvement', protect, calculateImprovementMetrics);

export default router;