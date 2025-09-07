import express from 'express';
import ClinicianPerformance from '../models/ClinicianPerformanceModel.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import { protect } from '../middleware/jwtAuthMiddleware.js';

const router = express.Router();

// Add authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /performance/record-evaluation:
 *   post:
 *     summary: Record evaluation result and update performance
 *     description: Records a case evaluation result and updates clinician performance metrics
 *     tags: [Performance]
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
 *               - userEmail
 *               - userName
 *               - sessionId
 *               - caseId
 *               - caseTitle
 *               - specialty
 *               - overallRating
 *               - totalScore
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user being evaluated
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: Email of the user
 *               userName:
 *                 type: string
 *                 description: Name of the user
 *               sessionId:
 *                 type: string
 *                 description: ID of the simulation session
 *               caseId:
 *                 type: string
 *                 description: ID of the case
 *               caseTitle:
 *                 type: string
 *                 description: Title of the case
 *               specialty:
 *                 type: string
 *                 description: Medical specialty of the case
 *               module:
 *                 type: string
 *                 description: Module or category of the case
 *               programArea:
 *                 type: string
 *                 description: Program area or curriculum
 *               overallRating:
 *                 type: string
 *                 enum: [Excellent, Good, Needs Improvement]
 *                 description: Overall rating of the performance
 *               criteriaScores:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *                 description: Scores for individual evaluation criteria
 *               totalScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Total score out of 100
 *               duration:
 *                 type: number
 *                 description: Duration of the session in seconds
 *               messagesExchanged:
 *                 type: number
 *                 description: Number of messages exchanged during the session
 *     responses:
 *       200:
 *         description: Evaluation recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 contributorEligible:
 *                   type: boolean
 *                   description: Whether the user is eligible to contribute cases
 *                 eligibleSpecialties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 specialtyStats:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/SpecialtyStats'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/record-evaluation', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      sessionId,
      caseId,
      caseTitle,
      specialty,
      module,
      programArea,
      overallRating,
      criteriaScores,
      totalScore,
      duration,
      messagesExchanged
    } = req.body;

    // Find or create clinician performance record
    let performance = await ClinicianPerformance.findOne({ userId });
    
    if (!performance) {
      performance = new ClinicianPerformance({
        userId,
        email: userEmail,
        name: userName,
        evaluationHistory: [],
        specialtyStats: new Map(),
        contributorStatus: {
          isEligible: false,
          eligibleSpecialties: [],
          eligibilityCriteria: new Map()
        }
      });
    }

    // Add the evaluation
    const evaluationData = {
      sessionId,
      caseId,
      caseTitle,
      specialty,
      module,
      programArea,
      overallRating,
      criteriaScores: new Map(Object.entries(criteriaScores || {})),
      totalScore,
      duration,
      messagesExchanged,
      completedAt: new Date()
    };

    performance.addEvaluation(evaluationData);
    await performance.save();

    // Return updated eligibility status
    res.json({
      message: 'Evaluation recorded successfully',
      contributorEligible: performance.contributorStatus.isEligible,
      eligibleSpecialties: performance.contributorStatus.eligibleSpecialties,
      specialtyStats: Object.fromEntries(performance.specialtyStats)
    });

  } catch (error) {
    console.error('Error recording evaluation:', error);
    res.status(500).json({ error: 'Failed to record evaluation' });
  }
});

/**
 * @swagger
 * /performance/summary/{userId}:
 *   get:
 *     summary: Get clinician's performance summary
 *     description: Retrieves a comprehensive performance summary for a clinician, including overall stats, specialty stats, and recent evaluations
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get performance summary for
 *     responses:
 *       200:
 *         description: Performance summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 overallStats:
 *                   type: object
 *                   properties:
 *                     totalEvaluations:
 *                       type: number
 *                     excellentCount:
 *                       type: number
 *                     goodCount:
 *                       type: number
 *                     needsImprovementCount:
 *                       type: number
 *                     excellentRate:
 *                       type: number
 *                       format: float
 *                 specialtyStats:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/SpecialtyStats'
 *                 contributorStatus:
 *                   type: object
 *                   properties:
 *                     isEligible:
 *                       type: boolean
 *                     eligibleSpecialties:
 *                       type: array
 *                       items:
 *                         type: string
 *                     qualificationDate:
 *                       type: string
 *                       format: date-time
 *                     eligibilityCriteria:
 *                       type: object
 *                 contributionStats:
 *                   type: object
 *                   properties:
 *                     totalSubmissions:
 *                       type: number
 *                     approvedSubmissions:
 *                       type: number
 *                     rejectedSubmissions:
 *                       type: number
 *                     pendingSubmissions:
 *                       type: number
 *                 recentEvaluations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caseTitle:
 *                         type: string
 *                       specialty:
 *                         type: string
 *                       rating:
 *                         type: string
 *                       score:
 *                         type: number
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Performance record not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First try to get data from ClinicianPerformance (new system)
    let performance = await ClinicianPerformance.findOne({ userId });
    
    // If not found, create summary from ClinicianProgress (legacy system)
    if (!performance) {
      const progress = await ClinicianProgress.findOne({ userId });
      const recentMetrics = await PerformanceMetrics.find({ user_ref: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('case_ref', 'case_metadata.title case_metadata.specialty');

      if (!progress) {
        return res.status(404).json({ error: 'Performance record not found' });
      }

      // Convert ClinicianProgress to PerformanceSummary format
      const totalEvaluations = progress.totalCasesCompleted;
      const excellentCount = recentMetrics.filter(m => m.metrics?.overall_score >= 90).length;
      const goodCount = recentMetrics.filter(m => m.metrics?.overall_score >= 70 && m.metrics?.overall_score < 90).length;
      const needsImprovementCount = recentMetrics.filter(m => m.metrics?.overall_score < 70).length;

      // Group metrics by specialty
      const specialtyStats = {};
      recentMetrics.forEach(metric => {
        const specialty = metric.case_ref?.case_metadata?.specialty || 'General';
        if (!specialtyStats[specialty]) {
          specialtyStats[specialty] = {
            totalCases: 0,
            excellentCount: 0,
            averageScore: 0,
            scores: []
          };
        }
        specialtyStats[specialty].totalCases++;
        specialtyStats[specialty].scores.push(metric.metrics?.overall_score || 0);
        if (metric.metrics?.overall_score >= 90) {
          specialtyStats[specialty].excellentCount++;
        }
      });

      // Calculate averages
      Object.keys(specialtyStats).forEach(specialty => {
        const stats = specialtyStats[specialty];
        stats.averageScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
        delete stats.scores; // Remove scores array from response
      });

      const summary = {
        userId: userId,
        name: req.user?.name || 'User',
        email: req.user?.email || '',
        
        overallStats: {
          totalEvaluations,
          excellentCount,
          goodCount,
          needsImprovementCount,
          excellentRate: totalEvaluations > 0 ? (excellentCount / totalEvaluations * 100).toFixed(1) : 0
        },
        
        specialtyStats,
        
        contributorStatus: {
          isEligible: false,
          eligibleSpecialties: [],
          qualificationDate: null,
          eligibilityCriteria: {}
        },
        
        contributionStats: {
          totalSubmissions: 0,
          approvedSubmissions: 0,
          rejectedSubmissions: 0,
          pendingSubmissions: 0
        },
        
        recentEvaluations: recentMetrics.map(m => ({
          caseTitle: m.case_ref?.case_metadata?.title || 'Unknown Case',
          specialty: m.case_ref?.case_metadata?.specialty || 'General',
          rating: m.metrics?.overall_score >= 90 ? 'Excellent' : 
                  m.metrics?.overall_score >= 70 ? 'Good' : 'Needs Improvement',
          score: m.metrics?.overall_score || 0,
          completedAt: m.createdAt
        }))
      };

      return res.json(summary);
    }

    // Original ClinicianPerformance logic
    const totalEvaluations = performance.evaluationHistory.length;
    const excellentCount = performance.evaluationHistory.filter(e => e.overallRating === 'Excellent').length;
    const goodCount = performance.evaluationHistory.filter(e => e.overallRating === 'Good').length;
    const needsImprovementCount = performance.evaluationHistory.filter(e => e.overallRating === 'Needs Improvement').length;

    const summary = {
      userId: performance.userId,
      name: performance.name,
      email: performance.email,
      
      overallStats: {
        totalEvaluations,
        excellentCount,
        goodCount,
        needsImprovementCount,
        excellentRate: totalEvaluations > 0 ? (excellentCount / totalEvaluations * 100).toFixed(1) : 0
      },
      
      specialtyStats: Object.fromEntries(performance.specialtyStats),
      
      contributorStatus: {
        isEligible: performance.contributorStatus.isEligible,
        eligibleSpecialties: performance.contributorStatus.eligibleSpecialties,
        qualificationDate: performance.contributorStatus.qualificationDate,
        eligibilityCriteria: Object.fromEntries(performance.contributorStatus.eligibilityCriteria)
      },
      
      contributionStats: performance.contributionStats,
      
      recentEvaluations: performance.evaluationHistory
        .slice(-10)
        .reverse()
        .map(e => ({
          caseTitle: e.caseTitle,
          specialty: e.specialty,
          rating: e.overallRating,
          score: e.totalScore,
          completedAt: e.completedAt
        }))
    };

    res.json(summary);

  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

/**
 * @swagger
 * /performance/eligibility/{userId}/{specialty}:
 *   get:
 *     summary: Check contributor eligibility for specific specialty
 *     description: Checks if a user is eligible to contribute cases for a specific medical specialty
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check eligibility for
 *       - in: path
 *         name: specialty
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical specialty to check eligibility for
 *     responses:
 *       200:
 *         description: Eligibility check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 *                 specialty:
 *                   type: string
 *                 criteria:
 *                   type: object
 *                   properties:
 *                     excellentCount:
 *                       type: number
 *                     recentExcellent:
 *                       type: boolean
 *                     consistentPerformance:
 *                       type: boolean
 *                     qualificationMet:
 *                       type: boolean
 *                 requirements:
 *                   type: object
 *                   properties:
 *                     excellentRatingsNeeded:
 *                       type: number
 *                     needsRecentExcellent:
 *                       type: boolean
 *                     needsConsistentPerformance:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Performance record not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/eligibility/:userId/:specialty', async (req, res) => {
  try {
    const { userId, specialty } = req.params;
    
    const performance = await ClinicianPerformance.findOne({ userId });
    
    if (!performance) {
      return res.json({
        eligible: false,
        reason: 'No performance record found'
      });
    }

    const isEligible = performance.contributorStatus.eligibleSpecialties.includes(specialty);
    const criteria = performance.contributorStatus.eligibilityCriteria.get(specialty);

    res.json({
      eligible: isEligible,
      specialty,
      criteria: criteria || {
        excellentCount: 0,
        recentExcellent: false,
        consistentPerformance: false,
        qualificationMet: false
      },
      requirements: {
        excellentRatingsNeeded: Math.max(0, 3 - (criteria?.excellentCount || 0)),
        needsRecentExcellent: !criteria?.recentExcellent,
        needsConsistentPerformance: !criteria?.consistentPerformance
      }
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

/**
 * @swagger
 * /performance/leaderboard:
 *   get:
 *     summary: Get leaderboard of top performers
 *     description: Retrieves a leaderboard of top performers based on excellence rate and total cases
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter leaderboard by medical specialty (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of leaders to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   totalCases:
 *                     type: number
 *                   excellentCount:
 *                     type: number
 *                   excellentRate:
 *                     type: number
 *                     format: float
 *                   averageScore:
 *                     type: number
 *                     format: float
 *                   isContributor:
 *                     type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { specialty, limit = 10 } = req.query;
    
    // Get data from ClinicianProgress (which has the actual completion data)
    const progressRecords = await ClinicianProgress.find({})
      .populate('userId', 'username email')
      .limit(parseInt(limit))
      .sort({ overallAverageScore: -1 });

    const leaderboard = await Promise.all(progressRecords.map(async (progress) => {
      // Get recent performance metrics for this user to calculate excellence rate
      const recentMetrics = await PerformanceMetrics.find({ user_ref: progress.userId })
        .sort({ createdAt: -1 })
        .limit(20);

      const excellentCount = recentMetrics.filter(m => m.metrics?.overall_score >= 90).length;
      const totalCases = progress.totalCasesCompleted;
      
      return {
        userId: progress.userId,
        name: progress.userId?.username || 'Anonymous',
        totalCases: totalCases,
        excellentCount: excellentCount,
        excellentRate: totalCases > 0 ? (excellentCount / totalCases * 100).toFixed(1) : 0,
        averageScore: progress.overallAverageScore?.toFixed(1) || 0,
        isContributor: false // TODO: Check contributor status
      };
    }));

    // Sort by excellence rate, then by total cases
    leaderboard.sort((a, b) => {
      if (b.excellentRate !== a.excellentRate) {
        return b.excellentRate - a.excellentRate;
      }
      return b.totalCases - a.totalCases;
    });

    res.json(leaderboard.slice(0, parseInt(limit)));

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * @swagger
 * /performance/update-contribution/{userId}:
 *   post:
 *     summary: Update contribution stats when case is approved/rejected
 *     description: Updates contribution statistics when a user's case submission is approved or rejected
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose contribution stats to update
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
 *                 enum: [approved, rejected]
 *                 description: The status of the case submission
 *     responses:
 *       200:
 *         description: Contribution stats updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 contributionStats:
 *                   type: object
 *                   properties:
 *                     totalSubmissions:
 *                       type: number
 *                     approvedSubmissions:
 *                       type: number
 *                     rejectedSubmissions:
 *                       type: number
 *                     pendingSubmissions:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Performance record not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/update-contribution/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    const performance = await ClinicianPerformance.findOne({ userId });
    
    if (!performance) {
      return res.status(404).json({ error: 'Performance record not found' });
    }

    performance.updateContributionStats(status);
    await performance.save();

    res.json({
      message: 'Contribution stats updated',
      contributionStats: performance.contributionStats
    });

  } catch (error) {
    console.error('Error updating contribution stats:', error);
    res.status(500).json({ error: 'Failed to update contribution stats' });
  }
});

/**
 * @swagger
 * /performance/eligible-contributors/{specialty}:
 *   get:
 *     summary: Bulk eligibility check (for admin)
 *     description: Retrieves a list of all users eligible to contribute cases for a specific specialty (admin only)
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialty
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical specialty to check eligibility for
 *     responses:
 *       200:
 *         description: List of eligible contributors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   qualificationDate:
 *                     type: string
 *                     format: date-time
 *                   specialtyStats:
 *                     $ref: '#/components/schemas/SpecialtyStats'
 *                   contributionStats:
 *                     type: object
 *                     properties:
 *                       totalSubmissions:
 *                         type: number
 *                       approvedSubmissions:
 *                         type: number
 *                       rejectedSubmissions:
 *                         type: number
 *                       pendingSubmissions:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/eligible-contributors/:specialty', async (req, res) => {
  try {
    const { specialty } = req.params;
    
    const eligibleContributors = await ClinicianPerformance.getEligibleContributors(specialty);
    
    const contributors = eligibleContributors.map(p => ({
      userId: p.userId,
      name: p.name,
      email: p.email,
      qualificationDate: p.contributorStatus.qualificationDate,
      specialtyStats: p.specialtyStats.get(specialty) || {},
      contributionStats: p.contributionStats
    }));

    res.json(contributors);

  } catch (error) {
    console.error('Error fetching eligible contributors:', error);
    res.status(500).json({ error: 'Failed to fetch eligible contributors' });
  }
});

export default router;