import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import { validateObjectId, validateProgressUpdate } from '../middleware/validation.js';
import { progressLimiter } from '../middleware/rateLimiter.js';
import {
  getClinicianProgress,
  updateProgressAfterCase,
  getProgressRecommendations
} from '../controllers/clinicianProgressController.js';

const router = express.Router();

router.use(protect, progressLimiter);

/**
 * @swagger
 * /clinician-progress/recommendations/{userId}:
 *   get:
 *     summary: Get progress recommendations for clinician
 *     description: Retrieves personalized case recommendations based on the clinician's progress and performance
 *     tags: [Clinician Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the clinician/user to get recommendations for
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProgressRecommendations'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/recommendations/:userId', validateObjectId('userId'), getProgressRecommendations);

/**
 * @swagger
 * /clinician-progress/update:
 *   post:
 *     summary: Update progress after completing a case
 *     description: Updates clinician progress metrics after completing a case simulation
 *     tags: [Clinician Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - caseId
 *               - performanceMetricsId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the clinician/user
 *               caseId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the completed case
 *               performanceMetricsId:
 *                 type: string
 *                 format: objectid
 *                 description: ID of the performance metrics record
 *     responses:
 *       200:
 *         description: Progress updated successfully
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
 *                     progress:
 *                       $ref: '#/components/schemas/ClinicianProgress'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/update', validateProgressUpdate, updateProgressAfterCase);

/**
 * @swagger
 * /clinician-progress/{userId}:
 *   get:
 *     summary: Get clinician progress data
 *     description: Retrieves comprehensive progress data for a clinician including case completion, scores, and learning metrics
 *     tags: [Clinician Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         description: ID of the clinician/user to get progress for
 *     responses:
 *       200:
 *         description: Progress data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ClinicianProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId', validateObjectId('userId'), getClinicianProgress);

export default router;