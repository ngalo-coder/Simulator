import express from 'express';
import { startQueueSession, getNextCaseInQueue, markCaseStatus, getQueueSession, getCaseHistory } from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';


const router = express.Router();

// All routes in this file will be protected and expect a valid JWT

// Base path for these routes will be /api/users (defined in index.js)

// Initialize or Resume Queue Session
// POST /api/users/queue/session/start
router.post('/queue/session/start', authenticateToken, startQueueSession);

// Get Next Case in Queue Session
// POST /api/users/queue/session/:sessionId/next
router.post('/queue/session/:sessionId/next', authenticateToken, getNextCaseInQueue);

// Mark Case Interaction Status
// POST /api/users/cases/:originalCaseIdString/status
router.post('/cases/:originalCaseIdString/status', authenticateToken, markCaseStatus);

// Get Queue Session Details
// GET /api/users/queue/session/:sessionId
router.get('/queue/session/:sessionId', authenticateToken, getQueueSession);

// Get User's Case History
// GET /api/users/cases/history
// GET /api/users/cases/history/:userId (for admin)
router.get('/cases/history/:userId?', authenticateToken, getCaseHistory);

export default router;
