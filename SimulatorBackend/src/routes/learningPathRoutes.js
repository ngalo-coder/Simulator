import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  createLearningPath,
  generateAdaptiveLearningPath,
  getLearningPaths,
  getLearningPath,
  updatePathProgress,
  getNextModule,
  adjustPathDifficulty
} from '../controllers/learningPathController.js';

const router = express.Router();

/**
 * @swagger
 * /api/learning-paths:
 *   post:
 *     summary: Create a new learning path
 *     description: Create a custom learning path with specific modules and progression criteria.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - modules
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the learning path
 *               description:
 *                 type: string
 *                 description: Description of the learning path
 *               modules:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/LearningModule'
 *                 description: Array of learning modules in the path
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Target audience for this learning path
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: Difficulty level of the learning path
 *     responses:
 *       201:
 *         description: Learning path created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/learning-paths', protect, createLearningPath);

/**
 * @swagger
 * /api/learning-paths/generate-adaptive:
 *   post:
 *     summary: Generate an adaptive learning path
 *     description: Generate a personalized learning path based on user's current knowledge, goals, and performance metrics.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific learning goals or competencies to target
 *               currentKnowledge:
 *                 type: object
 *                 description: Assessment of current knowledge levels
 *               preferredPace:
 *                 type: string
 *                 enum: [slow, moderate, fast]
 *                 description: Preferred learning pace
 *               timeCommitment:
 *                 type: number
 *                 description: Weekly time commitment in hours
 *     responses:
 *       200:
 *         description: Adaptive learning path generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/learning-paths/generate-adaptive', protect, generateAdaptiveLearningPath);

/**
 * @swagger
 * /api/learning-paths:
 *   get:
 *     summary: Get all learning paths for authenticated user
 *     description: Retrieve all learning paths associated with the authenticated user, including completed and in-progress paths.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval of learning paths
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
 *                     $ref: '#/components/schemas/LearningPath'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/learning-paths', protect, getLearningPaths);

/**
 * @swagger
 * /api/learning-paths/{id}:
 *   get:
 *     summary: Get a specific learning path
 *     description: Retrieve detailed information about a specific learning path including modules, progress, and performance data.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning path
 *     responses:
 *       200:
 *         description: Successful retrieval of learning path
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning path not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/learning-paths/:id', protect, getLearningPath);

/**
 * @swagger
 * /api/learning-paths/{id}/progress:
 *   patch:
 *     summary: Update learning path progress
 *     description: Update the progress of a learning path, typically when completing modules or achieving milestones.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning path
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completedModules
 *               - currentModule
 *             properties:
 *               completedModules:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of completed module IDs
 *               currentModule:
 *                 type: string
 *                 description: ID of the current active module
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Overall progress percentage
 *               lastActivity:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of last activity
 *     responses:
 *       200:
 *         description: Learning path progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning path not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/learning-paths/:id/progress', protect, updatePathProgress);

/**
 * @swagger
 * /api/learning-paths/{id}/next-module:
 *   get:
 *     summary: Get next recommended module
 *     description: Get the next recommended module in the learning path based on current progress and performance.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning path
 *     responses:
 *       200:
 *         description: Successful retrieval of next module recommendation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningModule'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning path not found or no next module available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/learning-paths/:id/next-module', protect, getNextModule);

/**
 * @swagger
 * /api/learning-paths/{id}/adjust-difficulty:
 *   patch:
 *     summary: Adjust learning path difficulty
 *     description: Adjust the difficulty level of a learning path based on user performance and feedback.
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning path
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newDifficulty
 *             properties:
 *               newDifficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: New difficulty level
 *               reason:
 *                 type: string
 *                 description: Reason for difficulty adjustment
 *               performanceData:
 *                 type: object
 *                 description: Performance data supporting the adjustment
 *     responses:
 *       200:
 *         description: Learning path difficulty adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LearningPath'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning path not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/learning-paths/:id/adjust-difficulty', protect, adjustPathDifficulty);

export default router;