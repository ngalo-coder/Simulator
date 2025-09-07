import express from 'express';
import { startQueueSession, getNextCaseInQueue, markCaseStatus, getQueueSession, getCaseHistory } from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file will be protected and expect a valid JWT

// Base path for these routes will be /api/users (defined in index.js)

/**
 * @swagger
 * /users/queue/session/start:
 *   post:
 *     summary: Initialize or resume a queue session
 *     description: Starts a new queue session or resumes an existing one for the authenticated user
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: The ID of the created or resumed queue session
 *                 status:
 *                   type: string
 *                   description: Session status (active, paused, completed)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/queue/session/start', authenticateToken, startQueueSession);

/**
 * @swagger
 * /users/queue/session/{sessionId}/next:
 *   post:
 *     summary: Get next case in queue session
 *     description: Retrieves the next case in the specified queue session
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the queue session
 *     responses:
 *       200:
 *         description: Next case retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Case'
 *       404:
 *         description: Session not found or no more cases in queue
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/queue/session/:sessionId/next', authenticateToken, getNextCaseInQueue);

/**
 * @swagger
 * /users/cases/{originalCaseIdString}/status:
 *   post:
 *     summary: Mark case interaction status
 *     description: Updates the status of a case interaction (completed, skipped, etc.)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: originalCaseIdString
 *         required: true
 *         schema:
 *           type: string
 *         description: The original case ID string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed, skipped, paused]
 *                 description: The new status of the case interaction
 *               notes:
 *                 type: string
 *                 description: Optional notes about the case interaction
 *     responses:
 *       200:
 *         description: Case status updated successfully
 *       400:
 *         description: Invalid status provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Case not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/cases/:originalCaseIdString/status', authenticateToken, markCaseStatus);

/**
 * @swagger
 * /users/queue/session/{sessionId}:
 *   get:
 *     summary: Get queue session details
 *     description: Retrieves details of a specific queue session
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the queue session
 *     responses:
 *       200:
 *         description: Queue session details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 currentCaseIndex:
 *                   type: number
 *                 totalCases:
 *                   type: number
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                 cases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Session not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/queue/session/:sessionId', authenticateToken, getQueueSession);

/**
 * @swagger
 * /users/cases/history/{userId}:
 *   get:
 *     summary: Get user's case history
 *     description: Retrieves the case interaction history for a user (admin can access other users' history)
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: The user ID (optional, defaults to current user, admin can specify other users)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of history items to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of items to skip for pagination (default 0)
 *     responses:
 *       200:
 *         description: Case history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caseId:
 *                         type: string
 *                       caseTitle:
 *                         type: string
 *                       status:
 *                         type: string
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: number
 *                         description: Duration in seconds
 *                 totalCount:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - insufficient permissions to access other user's history
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/cases/history/:userId?', authenticateToken, getCaseHistory);

export default router;
