import express from 'express';
import StudentProgressService from '../services/StudentProgressService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAnyRole } from '../middleware/rbacMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply RBAC middleware to ensure only students and admins can access
router.use(requireAnyRole(['student', 'admin']));

/**
 * @route GET /api/student-progress
 * @desc Get comprehensive student progress data
 * @access Private (Student, Admin)
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
 * @route POST /api/student-progress/case-attempt
 * @desc Record a new case attempt with detailed metrics
 * @access Private (Student, Admin)
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
 * @route POST /api/student-progress/competency
 * @desc Update competency progress
 * @access Private (Student, Admin)
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
 * @route POST /api/student-progress/achievement
 * @desc Add a new achievement
 * @access Private (Student, Admin)
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
 * @route POST /api/student-progress/milestone
 * @desc Add a new milestone
 * @access Private (Student, Admin)
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
 * @route GET /api/student-progress/summary
 * @desc Get progress summary
 * @access Private (Student, Admin)
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
 * @route GET /api/student-progress/history
 * @desc Get case attempt history
 * @access Private (Student, Admin)
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
 * @route GET /api/student-progress/achievements
 * @desc Get achievements and milestones
 * @access Private (Student, Admin)
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
 * @route POST /api/student-progress/reset
 * @desc Reset progress (admin only)
 * @access Private (Admin)
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