import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import {
  createLearningGoal,
  getLearningGoals,
  getLearningGoal,
  updateLearningGoal,
  deleteLearningGoal,
  addActionStep,
  completeActionStep,
  generateSmartGoals,
  getGoalProgressStats,
  getOverdueGoals,
  getGoalsDueSoon
} from '../controllers/learningGoalController.js';

const router = express.Router();

/**
 * @swagger
 * /learning-goals/goals:
 *   post:
 *     summary: Create a new learning goal
 *     description: Creates a new learning goal for the authenticated user with SMART criteria
 *     tags: [Learning Goals]
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
 *               - description
 *               - targetDate
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the learning goal
 *               description:
 *                 type: string
 *                 description: Detailed description of the goal
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 description: Target completion date
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Priority level of the goal
 *               metrics:
 *                 type: object
 *                 description: SMART criteria metrics for the goal
 *               relatedCompetencies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of competency IDs related to this goal
 *     responses:
 *       201:
 *         description: Learning goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningGoal'
 *       400:
 *         description: Invalid goal data provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/goals', protect, createLearningGoal);

/**
 * @swagger
 * /learning-goals/goals:
 *   get:
 *     summary: Get all learning goals for authenticated user
 *     description: Retrieves all learning goals for the authenticated user with optional filtering
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, overdue]
 *         description: Filter goals by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter goals by priority
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of goals to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Learning goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LearningGoal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/goals', protect, getLearningGoals);

/**
 * @swagger
 * /learning-goals/goals/{id}:
 *   get:
 *     summary: Get a specific learning goal
 *     description: Retrieves detailed information about a specific learning goal
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning goal to retrieve
 *     responses:
 *       200:
 *         description: Learning goal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningGoal'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning goal not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/goals/:id', protect, getLearningGoal);

/**
 * @swagger
 * /learning-goals/goals/{id}:
 *   put:
 *     summary: Update a learning goal
 *     description: Updates an existing learning goal for the authenticated user
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning goal to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the learning goal
 *               description:
 *                 type: string
 *                 description: Detailed description of the goal
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 description: Target completion date
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Priority level of the goal
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived]
 *                 description: Status of the goal
 *               metrics:
 *                 type: object
 *                 description: SMART criteria metrics for the goal
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Progress percentage (0-100)
 *     responses:
 *       200:
 *         description: Learning goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningGoal'
 *       400:
 *         description: Invalid goal data provided
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning goal not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/goals/:id', protect, updateLearningGoal);

/**
 * @swagger
 * /learning-goals/goals/{id}:
 *   delete:
 *     summary: Delete a learning goal
 *     description: Permanently deletes a learning goal for the authenticated user
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning goal to delete
 *     responses:
 *       200:
 *         description: Learning goal deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning goal not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/goals/:id', protect, deleteLearningGoal);

/**
 * @swagger
 * /learning-goals/goals/{id}/actions:
 *   post:
 *     summary: Add action step to a goal
 *     description: Adds a new action step to an existing learning goal
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning goal to add action to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of the action step
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: Due date for the action step
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Priority of the action step
 *     responses:
 *       201:
 *         description: Action step added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningGoal'
 *       400:
 *         description: Invalid action step data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning goal not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/goals/:id/actions', protect, addActionStep);

/**
 * @swagger
 * /learning-goals/goals/{id}/actions/{stepIndex}/complete:
 *   patch:
 *     summary: Complete an action step
 *     description: Marks an action step as completed and updates goal progress
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the learning goal
 *       - in: path
 *         name: stepIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index of the action step to complete (0-based)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional notes about completing the action step
 *     responses:
 *       200:
 *         description: Action step completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningGoal'
 *       400:
 *         description: Invalid step index or action already completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Learning goal or action step not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/goals/:id/actions/:stepIndex/complete', protect, completeActionStep);

/**
 * @swagger
 * /learning-goals/goals/generate-smart:
 *   post:
 *     summary: Generate SMART goals based on performance
 *     description: Generates SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals based on the user's performance data
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 3
 *         description: Number of SMART goals to generate
 *       - in: query
 *         name: focusArea
 *         schema:
 *           type: string
 *         description: Specific competency or area to focus goal generation on
 *     responses:
 *       200:
 *         description: SMART goals generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LearningGoal'
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/goals/generate-smart', protect, generateSmartGoals);

/**
 * @swagger
 * /learning-goals/goals/stats/progress:
 *   get:
 *     summary: Get goal progress statistics
 *     description: Retrieves statistics about the user's learning goal progress and completion rates
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 365d, all]
 *           default: 30d
 *         description: Time range for progress statistics
 *     responses:
 *       200:
 *         description: Goal progress statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalGoals:
 *                   type: integer
 *                 completedGoals:
 *                   type: integer
 *                 activeGoals:
 *                   type: integer
 *                 overdueGoals:
 *                   type: integer
 *                 completionRate:
 *                   type: number
 *                   format: float
 *                   description: Percentage of completed goals (0-100)
 *                 averageCompletionTime:
 *                   type: number
 *                   description: Average time to complete goals in days
 *                 progressByPriority:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: number
 *                       format: float
 *                     medium:
 *                       type: number
 *                       format: float
 *                     low:
 *                       type: number
 *                       format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/goals/stats/progress', protect, getGoalProgressStats);

/**
 * @swagger
 * /learning-goals/goals/overdue:
 *   get:
 *     summary: Get overdue goals
 *     description: Retrieves all learning goals that are past their target completion date
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of overdue goals to return
 *     responses:
 *       200:
 *         description: Overdue goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LearningGoal'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/goals/overdue', protect, getOverdueGoals);

/**
 * @swagger
 * /learning-goals/goals/due-soon:
 *   get:
 *     summary: Get goals due soon
 *     description: Retrieves learning goals that are due within the next 7 days
 *     tags: [Learning Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of due soon goals to return
 *     responses:
 *       200:
 *         description: Goals due soon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LearningGoal'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/goals/due-soon', protect, getGoalsDueSoon);

export default router;