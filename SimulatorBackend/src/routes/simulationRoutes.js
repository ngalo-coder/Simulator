import express from 'express';
import { protect, optionalAuth } from '../middleware/jwtAuthMiddleware.js';
import { validateEndSession, validateObjectId } from '../middleware/validation.js';
import { endSessionLimiter } from '../middleware/rateLimiter.js';
import { 
  getCases, 
  startSimulation,
  handleAsk,
  endSession,
  getCaseCategories,
  getPerformanceMetricsBySession
} from '../controllers/simulationController.js';

const router = express.Router();

router.get('/cases', protect, getCases);
router.get('/case-categories', protect, getCaseCategories);
router.post('/start', protect, startSimulation);
router.get('/ask', optionalAuth, handleAsk);
router.post('/end', protect, endSessionLimiter, validateEndSession, endSession);
router.get('/performance-metrics/session/:sessionId', protect, validateObjectId('sessionId'), getPerformanceMetricsBySession);

export default router;