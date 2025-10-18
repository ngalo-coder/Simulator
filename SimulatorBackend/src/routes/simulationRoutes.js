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

/**
 * @swagger
 * /api/simulation/cases:
 *   get:
 *     summary: Get available simulation cases
 *     description: Retrieve a list of available cases for simulation, filtered by user access and preferences.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of simulation cases
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
router.get('/cases', protect, getCases);

/**
 * @swagger
 * /api/simulation/case-categories:
 *   get:
 *     summary: Get case categories for simulation
 *     description: Retrieve categories of cases available for simulation, often used for filtering or organization.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of case categories
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/case-categories', optionalAuth, getCaseCategories);

/**
 * @swagger
 * /api/simulation/start:
 *   post:
 *     summary: Start a simulation session
 *     description: Initiate a new simulation session for a specific case. Returns session details and initial state.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: ID of the case to simulate
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: Optional difficulty level override
 *     responses:
 *       201:
 *         description: Simulation session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SimulationSession'
 *       400:
 *         description: Invalid case ID or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/start', protect, startSimulation);

/**
 * @swagger
 * /api/simulation/ask:
 *   get:
 *     summary: Ask a question during simulation
 *     description: Get AI-generated responses or guidance during an active simulation session. Supports both authenticated and anonymous users.
 *     tags: [Simulation]
 *     parameters:
 *       - in: query
 *         name: question
 *         schema:
 *           type: string
 *         required: true
 *         description: The question to ask about the simulation
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Optional session ID for context-aware responses
 *     responses:
 *       200:
 *         description: Successful response to question
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
 *                     answer:
 *                       type: string
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Missing question parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/ask', optionalAuth, handleAsk);

/**
 * @swagger
 * /api/simulation/end:
 *   post:
 *     summary: End a simulation session
 *     description: Conclude an active simulation session and calculate performance metrics. Rate limited to prevent abuse.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID of the session to end
 *               finalState:
 *                 type: object
 *                 description: Final state of the simulation for analysis
 *     responses:
 *       200:
 *         description: Simulation session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SimulationResult'
 *       400:
 *         description: Invalid session ID or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Too many requests - rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/end', protect, endSessionLimiter, validateEndSession, endSession);

/**
 * @swagger
 * /api/simulation/performance-metrics/session/{sessionId}:
 *   get:
 *     summary: Get performance metrics for a session
 *     description: Retrieve detailed performance metrics and analytics for a completed simulation session.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the simulation session
 *     responses:
 *       200:
 *         description: Successful retrieval of performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 *       400:
 *         description: Invalid session ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/performance-metrics/session/:sessionId', protect, validateObjectId('sessionId'), getPerformanceMetricsBySession);

/**
 * @swagger
 * /api/simulation/treatment-plan/{sessionId}:
 *   post:
 *     summary: Submit a treatment plan for a session
 *     description: Submit a treatment plan for evaluation during or after a simulation session.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the simulation session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TreatmentPlan'
 *     responses:
 *       200:
 *         description: Treatment plan submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TreatmentEvaluation'
 *       400:
 *         description: Invalid treatment plan or session ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/treatment-plan/:sessionId', protect, validateObjectId('sessionId'), validateTreatmentPlan, submitTreatmentPlan);

/**
 * @swagger
 * /api/simulation/treatment-outcomes/{sessionId}:
 *   get:
 *     summary: Get treatment outcomes for a session
 *     description: Retrieve the outcomes and results of treatment plans submitted for a simulation session.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the simulation session
 *     responses:
 *       200:
 *         description: Successful retrieval of treatment outcomes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TreatmentOutcomes'
 *       400:
 *         description: Invalid session ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/treatment-outcomes/:sessionId', protect, validateObjectId('sessionId'), getTreatmentOutcomes);

// Retake session routes
/**
 * @swagger
 * /api/simulation/retake/start:
 *   post:
 *     summary: Start a retake simulation session
 *     description: Initiate a retake session for a previously completed case to practice and improve performance.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: ID of the case to retake
 *               previousSessionId:
 *                 type: string
 *                 description: Optional ID of the previous session for comparison
 *     responses:
 *       201:
 *         description: Retake session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SimulationSession'
 *       400:
 *         description: Invalid case ID or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/retake/start', protect, startRetakeSession);

/**
 * @swagger
 * /api/simulation/retake/sessions/{caseId}:
 *   get:
 *     summary: Get retake sessions for a case
 *     description: Retrieve all retake sessions for a specific case, useful for tracking improvement over time.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case
 *     responses:
 *       200:
 *         description: Successful retrieval of retake sessions
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
 *                     $ref: '#/components/schemas/SimulationSession'
 *       400:
 *         description: Invalid case ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/retake/sessions/:caseId', protect, getCaseRetakeSessions);

/**
 * @swagger
 * /api/simulation/retake/calculate-improvement:
 *   post:
 *     summary: Calculate improvement metrics for retakes
 *     description: Calculate improvement metrics between original and retake sessions to measure learning progress.
 *     tags: [Simulation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalSessionId
 *               - retakeSessionId
 *             properties:
 *               originalSessionId:
 *                 type: string
 *                 description: ID of the original simulation session
 *               retakeSessionId:
 *                 type: string
 *                 description: ID of the retake simulation session
 *     responses:
 *       200:
 *         description: Improvement metrics calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ImprovementMetrics'
 *       400:
 *         description: Invalid session IDs or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Sessions not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/retake/calculate-improvement', protect, calculateImprovementMetrics);

export default router;