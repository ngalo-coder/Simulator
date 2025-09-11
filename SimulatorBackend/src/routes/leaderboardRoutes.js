import express from 'express';
import { protect } from '../middleware/jwtAuthMiddleware.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import Case from '../models/CaseModel.js';
import User from '../models/UserModel.js';
import privacyService from '../services/privacyService.js';

const router = express.Router();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get leaderboard of top performers
 *     description: Retrieves a leaderboard of top performers with privacy controls, filtering, and score validation
 *     tags: [Leaderboard]
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
 *           default: 20
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
 *                   displayName:
 *                     type: string
 *                   isAnonymous:
 *                     type: boolean
 *                   totalCases:
 *                     type: number
 *                   excellentCount:
 *                     type: number
 *                   excellentRate:
 *                     type: string
 *                   averageScore:
 *                     type: string
 *                   isContributor:
 *                     type: boolean
 *                   privacyLevel:
 *                     type: string
 *                     enum: [public, educators, private]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, async (req, res) => {
  try {
    const { specialty, limit = 20 } = req.query;
    const requesterId = req.user?._id || req.user?.id;
    
    // Build query for filtering by specialty if provided
    let progressQuery = {};
    if (specialty && specialty.trim()) {
      // Find cases that match the specialty
      const specialtyCases = await Case.find({
        'case_metadata.specialty': { $regex: new RegExp(specialty.trim(), 'i') }
      }).select('_id');
      
      const caseIds = specialtyCases.map(c => c._id);
      
      if (caseIds.length > 0) {
        // Find users who have completed cases in this specialty
        const usersWithSpecialty = await PerformanceMetrics.distinct('user_ref', {
          case_ref: { $in: caseIds },
          'metrics.overall_score': { $exists: true, $ne: null }
        });
        
        progressQuery.userId = { $in: usersWithSpecialty };
      } else {
        // No cases found for this specialty, return empty result
        return res.json([]);
      }
    }

    // Get progress records with valid data only
    const progressRecords = await ClinicianProgress.find({
      ...progressQuery,
      totalCasesCompleted: { $gt: 0 }, // Only users with completed cases
      overallAverageScore: { $exists: true, $ne: null, $gte: 0 } // Valid scores only
    })
      .populate('userId', 'username email profile privacySettings')
      .sort({ overallAverageScore: -1 })
      .limit(parseInt(limit) * 2); // Get more records to account for privacy filtering

    const leaderboard = await Promise.all(progressRecords.map(async (progress) => {
      try {
        // Get privacy settings for the user
        const privacyData = await privacyService.getAnonymizedUserData(progress.userId._id);
        
        // Skip users who opted out of leaderboards
        if (!privacyData) {
          return null;
        }

        // Calculate excellence rate with score validation (per memory requirements)
        let excellentCount = 0;
        let totalValidCases = 0;
        
        if (specialty && specialty.trim()) {
          // Get specialty-specific metrics
          const specialtyCases = await Case.find({
            'case_metadata.specialty': { $regex: new RegExp(specialty.trim(), 'i') }
          }).select('_id');
          
          const caseIds = specialtyCases.map(c => c._id);
          
          const specialtyMetrics = await PerformanceMetrics.find({ 
            user_ref: progress.userId._id,
            case_ref: { $in: caseIds },
            'metrics.overall_score': { $exists: true, $ne: null, $type: 'number' }
          }).sort({ createdAt: -1 }).limit(50);
          
          specialtyMetrics.forEach(metric => {
            const score = metric.metrics?.overall_score;
            if (typeof score === 'number' && !isNaN(score)) {
              totalValidCases++;
              if (score >= 90) {
                excellentCount++;
              }
            }
          });
        } else {
          // Get all recent metrics for overall leaderboard
          const recentMetrics = await PerformanceMetrics.find({ 
            user_ref: progress.userId._id,
            'metrics.overall_score': { $exists: true, $ne: null, $type: 'number' }
          }).sort({ createdAt: -1 }).limit(50);

          recentMetrics.forEach(metric => {
            const score = metric.metrics?.overall_score;
            if (typeof score === 'number' && !isNaN(score)) {
              totalValidCases++;
              if (score >= 90) {
                excellentCount++;
              }
            }
          });
        }

        // Use validated case count or fall back to progress total
        const totalCases = totalValidCases > 0 ? totalValidCases : progress.totalCasesCompleted || 0;
        
        // Validate and format average score (per memory requirements)
        let averageScore = 0;
        if (typeof progress.overallAverageScore === 'number' && !isNaN(progress.overallAverageScore)) {
          averageScore = Math.round(progress.overallAverageScore * 10) / 10; // Round to 1 decimal
        }

        // Calculate excellence rate
        const excellentRate = totalCases > 0 ? 
          Math.round((excellentCount / totalCases) * 1000) / 10 : 0; // Round to 1 decimal

        return {
          userId: progress.userId._id.toString(),
          name: progress.userId.username || 'Anonymous User',
          displayName: privacyData.displayName || progress.userId.username || 'Anonymous User',
          isAnonymous: privacyData.isAnonymous,
          totalCases: totalCases,
          excellentCount: excellentCount,
          excellentRate: excellentRate.toFixed(1),
          averageScore: averageScore.toFixed(1),
          isContributor: false, // TODO: Implement contributor detection
          privacyLevel: privacyData.profileVisibility || 'public',
          showRealName: !privacyData.isAnonymous
        };
      } catch (error) {
        console.error(`Error processing user ${progress.userId._id}:`, error);
        return null;
      }
    }));

    // Filter out null entries and apply privacy rules
    const validEntries = leaderboard
      .filter(entry => entry !== null)
      .filter(entry => {
        // Apply privacy filtering based on requester's role
        if (entry.privacyLevel === 'private') {
          return entry.userId === requesterId?.toString();
        }
        if (entry.privacyLevel === 'educators') {
          // Only show to educators, admins, or the user themselves
          return req.user?.role === 'educator' || 
                 req.user?.role === 'admin' || 
                 entry.userId === requesterId?.toString();
        }
        return true; // public entries visible to all
      });

    // Sort by excellence rate first, then by total cases, then by average score
    validEntries.sort((a, b) => {
      const excellentRateA = parseFloat(a.excellentRate);
      const excellentRateB = parseFloat(b.excellentRate);
      
      if (excellentRateB !== excellentRateA) {
        return excellentRateB - excellentRateA;
      }
      
      if (b.totalCases !== a.totalCases) {
        return b.totalCases - a.totalCases;
      }
      
      return parseFloat(b.averageScore) - parseFloat(a.averageScore);
    });

    // Limit final results
    const finalResults = validEntries.slice(0, parseInt(limit));

    res.json(finalResults);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;