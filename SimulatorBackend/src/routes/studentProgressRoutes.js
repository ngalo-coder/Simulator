import express from 'express';
import StudentProgressService from '../services/StudentProgressService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student Progress
 *   description: Student progress tracking and management
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only students and admins can access
router.use(requireAnyRole(['student', 'admin']));

/**
 * @swagger
 * /api/student-progress:
 *   get:
 *     summary: Get comprehensive student progress data
 *     description: Retrieves complete student progress information including competencies, achievements, and case history
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student progress data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const progress = await StudentProgressService.getOrCreateStudentProgress(req.user._id);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load student progress'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/case-attempt:
 *   post:
 *     summary: Record a new case attempt with detailed metrics
 *     description: Records a student's attempt at a case with comprehensive performance metrics
 *     tags: [Student Progress]
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
 *               - caseTitle
 *               - attemptNumber
 *               - score
 *               - status
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: ID of the case attempted
 *               caseTitle:
 *                 type: string
 *                 description: Title of the case
 *               attemptNumber:
 *                 type: integer
 *                 description: Attempt sequence number
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the attempt
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the attempt
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Score achieved (0-100)
 *               status:
 *                 type: string
 *                 enum: [completed, in_progress, abandoned]
 *                 description: Status of the attempt
 *               detailedMetrics:
 *                 type: object
 *                 description: Detailed performance metrics
 *               feedback:
 *                 type: string
 *                 description: Feedback received
 *               sessionId:
 *                 type: string
 *                 description: Session identifier
 *               competencies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     competencyId:
 *                       type: string
 *                     score:
 *                       type: number
 *     responses:
 *       200:
 *         description: Case attempt recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/case-attempt', async (req, res) => {
  try {
    const {
      caseId,
      caseTitle,
      attemptNumber,
      startTime,
      endTime,
      duration,
      score,
      status,
      detailedMetrics,
      feedback,
      sessionId,
      competencies
    } = req.body;

    const attemptData = {
      caseId,
      caseTitle,
      attemptNumber,
      startTime: startTime || new Date(),
      endTime,
      duration,
      score,
      status,
      detailedMetrics,
      feedback,
      sessionId,
      competencies
    };

    const progress = await StudentProgressService.recordCaseAttempt(req.user._id, attemptData);
    
    res.json({
      success: true,
      data: progress,
      message: 'Case attempt recorded successfully'
    });
  } catch (error) {
    console.error('Record case attempt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record case attempt'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/competency:
 *   post:
 *     summary: Update competency progress
 *     description: Updates a student's progress in a specific competency area
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - competencyId
 *               - score
 *             properties:
 *               competencyId:
 *                 type: string
 *                 description: ID of the competency
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Score achieved in the competency (0-100)
 *               casesAttempted:
 *                 type: integer
 *                 description: Number of cases attempted for this competency
 *     responses:
 *       200:
 *         description: Competency progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/competency', async (req, res) => {
  try {
    const { competencyId, score, casesAttempted } = req.body;
    
    const progress = await StudentProgressService.updateCompetencyProgress(
      req.user._id,
      competencyId,
      score,
      casesAttempted
    );
    
    res.json({
      success: true,
      data: progress,
      message: 'Competency progress updated successfully'
    });
  } catch (error) {
    console.error('Update competency progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update competency progress'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/achievement:
 *   post:
 *     summary: Add a new achievement
 *     description: Adds a new achievement to the student's progress record
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - achievementId
 *               - name
 *               - type
 *             properties:
 *               achievementId:
 *                 type: string
 *                 description: Unique identifier for the achievement
 *               name:
 *                 type: string
 *                 description: Name of the achievement
 *               description:
 *                 type: string
 *                 description: Description of the achievement
 *               type:
 *                 type: string
 *                 enum: [badge, certificate, milestone, award]
 *                 description: Type of achievement
 *               badgeUrl:
 *                 type: string
 *                 description: URL to achievement badge image
 *               tier:
 *                 type: string
 *                 enum: [bronze, silver, gold, platinum]
 *                 description: Achievement tier level
 *               rewardPoints:
 *                 type: integer
 *                 description: Points awarded for this achievement
 *     responses:
 *       200:
 *         description: Achievement added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/achievement', async (req, res) => {
  try {
    const {
      achievementId,
      name,
      description,
      type,
      badgeUrl,
      tier,
      rewardPoints
    } = req.body;

    const achievementData = {
      achievementId,
      name,
      description,
      type,
      earnedDate: new Date(),
      badgeUrl,
      tier,
      rewardPoints
    };

    const progress = await StudentProgressService.addAchievement(req.user._id, achievementData);
    
    res.json({
      success: true,
      data: progress,
      message: 'Achievement added successfully'
    });
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add achievement'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/milestone:
 *   post:
 *     summary: Add a new milestone
 *     description: Adds a new milestone to the student's progress record
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - milestoneId
 *               - name
 *             properties:
 *               milestoneId:
 *                 type: string
 *                 description: Unique identifier for the milestone
 *               name:
 *                 type: string
 *                 description: Name of the milestone
 *               description:
 *                 type: string
 *                 description: Description of the milestone
 *               criteria:
 *                 type: string
 *                 description: Criteria required to achieve this milestone
 *               rewardPoints:
 *                 type: integer
 *                 description: Points awarded for this milestone
 *     responses:
 *       200:
 *         description: Milestone added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/milestone', async (req, res) => {
  try {
    const {
      milestoneId,
      name,
      description,
      criteria,
      rewardPoints
    } = req.body;

    const milestoneData = {
      milestoneId,
      name,
      description,
      achievedDate: new Date(),
      criteria,
      rewardPoints
    };

    const progress = await StudentProgressService.addMilestone(req.user._id, milestoneData);
    
    res.json({
      success: true,
      data: progress,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add milestone'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/summary:
 *   get:
 *     summary: Get progress summary
 *     description: Retrieves a summary of the student's overall progress and statistics
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProgressSummary'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await StudentProgressService.getProgressSummary(req.user._id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load progress summary'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/history:
 *   get:
 *     summary: Get case attempt history
 *     description: Retrieves the student's recent case attempt history
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of history items to return (default 10)
 *     responses:
 *       200:
 *         description: Case attempt history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CaseAttempt'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await StudentProgressService.getCaseAttemptHistory(req.user._id, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get case attempt history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load case attempt history'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/achievements:
 *   get:
 *     summary: Get achievements and milestones
 *     description: Retrieves all achievements and milestones earned by the student
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements and milestones retrieved successfully
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
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Achievement'
 *                     milestones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Milestone'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await StudentProgressService.getAchievementsAndMilestones(req.user._id);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load achievements'
    });
  }
});

/**
 * @swagger
 * /api/student-progress/reset:
 *   post:
 *     summary: Reset progress (admin only)
 *     description: Resets a student's progress data (admin access required)
 *     tags: [Student Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose progress to reset (defaults to current user)
 *     responses:
 *       200:
 *         description: Progress reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/StudentProgress'
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset', requireAnyRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUserId = userId || req.user._id;
    
    const progress = await StudentProgressService.resetProgress(targetUserId);
    
    res.json({
      success: true,
      data: progress,
      message: 'Progress reset successfully'
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset progress'
    });
  }
});

export default router;