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

/**
 * @swagger
 * /performance-review/review:
 *   get:
 *     summary: Get comprehensive performance review
 *     description: Retrieves a comprehensive performance review for the authenticated user, including overall scores, strengths, weaknesses, and improvement areas.
 *     tags: [Performance Review]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance review retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overallScore:
 *                   type: number
 *                   format: float
 *                   description: Overall performance score
 *                 strengths:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of strengths identified
 *                 weaknesses:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of areas needing improvement
 *                 recentProgress:
 *                   type: object
 *                   properties:
 *                     trend:
 *                       type: string
 *                       enum: [improving, declining, stable]
 *                     percentageChange:
 *                       type: number
 *                       format: float
 *                 comparisonData:
 *                   type: object
 *                   properties:
 *                     peerAverage:
 *                       type: number
 *                       format: float
 *                     percentile:
 *                       type: number
 *                       format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/review', protect, getPerformanceReview);

/**
 * @swagger
 * /performance-review/review/case/{caseId}:
 *   get:
 *     summary: Get detailed performance review for a specific case
 *     description: Retrieves detailed performance metrics and feedback for a specific case completed by the user.
 *     tags: [Performance Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to get performance review for
 *     responses:
 *       200:
 *         description: Case performance review retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 caseId:
 *                   type: string
 *                 caseTitle:
 *                   type: string
 *                 completionDate:
 *                   type: string
 *                   format: date-time
 *                 score:
 *                   type: number
 *                   format: float
 *                 timeSpent:
 *                   type: number
 *                   description: Time spent on case in seconds
 *                 detailedFeedback:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       score:
 *                         type: number
 *                       feedback:
 *                         type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Case not found or no performance data available
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/review/case/:caseId', protect, getCasePerformanceReview);

/**
 * @swagger
 * /performance-review/review/peer-comparison:
 *   get:
 *     summary: Get peer comparison data
 *     description: Retrieves performance comparison data between the authenticated user and their peers.
 *     tags: [Performance Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter comparison by medical specialty
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, all]
 *           default: 30d
 *         description: Time range for comparison data
 *     responses:
 *       200:
 *         description: Peer comparison data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userStats:
 *                   type: object
 *                   properties:
 *                     averageScore:
 *                       type: number
 *                       format: float
 *                     casesCompleted:
 *                       type: integer
 *                     rank:
 *                       type: integer
 *                 peerStats:
 *                   type: object
 *                   properties:
 *                     averageScore:
 *                       type: number
 *                       format: float
 *                     casesCompleted:
 *                       type: integer
 *                     totalPeers:
 *                       type: integer
 *                 percentile:
 *                   type: number
 *                   format: float
 *                 comparisonChart:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       metric:
 *                         type: string
 *                       userValue:
 *                         type: number
 *                       peerAverage:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/review/peer-comparison', protect, getPeerComparisonReview);

/**
 * @swagger
 * /performance-review/review/improvement-progress:
 *   get:
 *     summary: Get improvement progress over time
 *     description: Retrieves historical data showing the user's performance improvement progress over time.
 *     tags: [Performance Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [30d, 90d, 180d, 365d, all]
 *           default: 90d
 *         description: Time range for progress data
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Granularity of the progress data
 *     responses:
 *       200:
 *         description: Improvement progress data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeSeries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       score:
 *                         type: number
 *                         format: float
 *                       casesCompleted:
 *                         type: integer
 *                 overallTrend:
 *                   type: string
 *                   enum: [improving, declining, stable]
 *                 improvementRate:
 *                   type: number
 *                   format: float
 *                   description: Percentage improvement rate over the time range
 *                 milestones:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       achievement:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/review/improvement-progress', protect, getImprovementProgress);

/**
 * @swagger
 * /performance-review/review/reflection-prompts:
 *   get:
 *     summary: Generate self-reflection prompts
 *     description: Generates personalized self-reflection prompts based on the user's recent performance data.
 *     tags: [Performance Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of reflection prompts to generate
 *       - in: query
 *         name: focusArea
 *         schema:
 *           type: string
 *         description: Specific area to focus reflection prompts on
 *     responses:
 *       200:
 *         description: Reflection prompts generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prompts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       context:
 *                         type: string
 *                       suggestedAction:
 *                         type: string
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/review/reflection-prompts', protect, generateReflectionPrompts);

export default router;