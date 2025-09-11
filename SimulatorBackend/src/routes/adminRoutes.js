import express from 'express';
import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';
import AnalyticsService from '../services/AnalyticsService.js';

const router = express.Router();

// Note: Contribution-related endpoints have been moved to adminContributionRoutes.js

// Get system statistics
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Use Promise.all for parallel execution
    const [      totalUsers,
      totalCases,
      totalSessions,
      recentUsers,
      activeUsers,
      casesBySpecialty,
      recentSessions,
      userGrowth
    ] = await Promise.all([
      User.countDocuments(dateFilter),
      Case.countDocuments(),
      // Use ClinicianProgress as authoritative source for total sessions completed
      ClinicianProgress.aggregate([
        { $group: { _id: null, totalSessions: { $sum: '$totalCasesCompleted' } } }
      ]).then(result => result[0]?.totalSessions || 0),
      
      // Recent users (last 30 days)
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      
      // Active users (users who have completed at least one case) from ClinicianProgress
      ClinicianProgress.countDocuments({ totalCasesCompleted: { $gt: 0 } }),
      
      // Cases by specialty
      Case.aggregate([
        {
          $group: {
            _id: '$case_metadata.specialty',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Recent sessions (last 7 days) - use ClinicianProgress with date filter
      ClinicianProgress.countDocuments({
        lastUpdatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        totalCasesCompleted: { $gt: 0 }
      }),
      
      // User growth over last 12 months
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);
    
    res.json({
      totalUsers,
      totalCases,
      totalSessions,
      recentUsers,
      activeUsers,
      recentSessions,
      casesBySpecialty,
      userGrowth,
      generatedAt: new Date().toISOString(),
      dateRange: startDate && endDate ? { startDate, endDate } : null
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Get real-time statistics (lightweight)
router.get('/stats/realtime', protect, isAdmin, async (req, res) => {
  try {
    const [activeUsers, recentSessions, pendingReviews] = await Promise.all([
      // Active users who have updated progress in last 24 hours
      ClinicianProgress.countDocuments({
        lastUpdatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        totalCasesCompleted: { $gt: 0 }
      }),
      
      // Recent sessions - users with progress updates in last hour
      ClinicianProgress.countDocuments({
        lastUpdatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      }),
      
      // Placeholder for pending reviews (can be implemented later)
      0
    ]);
    
    res.json({
      activeUsers,
      recentSessions,
      pendingReviews,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    res.status(500).json({ error: 'Failed to fetch real-time statistics' });
  }
});

// Get all users
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all cases for admin
router.get('/cases', protect, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, specialty, programArea } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (specialty) {
      query['case_metadata.specialty'] = specialty;
    }
    if (programArea) {
      query['case_metadata.program_area'] = programArea;
    }
    
    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Case.countDocuments(query);
    
    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Delete user
router.delete('/users/:userId', protect, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting other admin users
    if (user.role === 'admin' && user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Cannot delete other admin users' });
    }
    
    // Delete user's performance metrics
    await PerformanceMetrics.deleteMany({ user_ref: userId });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete case
router.delete('/cases/:caseId', protect, isAdmin, async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const case_ = await Case.findById(caseId);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Delete related performance metrics
    await PerformanceMetrics.deleteMany({ case_ref: caseId });
    
    // Delete the case
    await Case.findByIdAndDelete(caseId);
    
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Create admin user
router.post('/users/admin', protect, isAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }
    
    // Create new admin user
    const newUser = new User({
      username,
      email,
      password, // Will be hashed by the User model pre-save hook
      role: 'admin'
    });
    
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update user role
router.put('/users/:userId/role', protect, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow changing your own role
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }
    
    user.role = role;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: `User role updated to ${role} successfully`,
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * @swagger
 * /api/admin/cases/{caseId}:
 *   put:
 *     summary: Update case metadata
 *     description: Update case metadata including program area and specialty
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programArea:
 *                 type: string
 *                 example: 'Internal Medicine'
 *               specialty:
 *                 type: string
 *                 example: 'Cardiology'
 *     responses:
 *       200:
 *         description: Case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Case updated successfully'
 *                 case:
 *                   $ref: '#/components/schemas/Case'
 *       404:
 *         description: Case not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/cases/:caseId', protect, isAdmin, async (req, res) => {
  try {
    const { caseId } = req.params;
    const { programArea, specialty } = req.body;
    
    const case_ = await Case.findById(caseId);
    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Update case metadata
    if (programArea) {
      case_.case_metadata.program_area = programArea;
    }
    if (specialty) {
      case_.case_metadata.specialty = specialty;
    }
    
    await case_.save();
    
    res.json({
      message: 'Case updated successfully',
      case: case_
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/**
 * @swagger
 * /api/admin/users/scores:
 *   get:
 *     summary: Get users with their performance scores
 *     description: Retrieve all users with aggregated performance metrics and scores
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users with scores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: 'johndoe'
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: 'john@example.com'
 *                   role:
 *                     type: string
 *                     example: 'student'
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   totalCases:
 *                     type: integer
 *                     example: 25
 *                   averageScore:
 *                     type: number
 *                     format: float
 *                     example: 85.5
 *                   excellentCount:
 *                     type: integer
 *                     example: 15
 *                   excellentRate:
 *                     type: number
 *                     format: float
 *                     example: 60.0
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/scores', protect, isAdmin, async (req, res) => {
  try {
    // Use ClinicianProgress as the primary data source for accurate progress metrics
    const usersWithScores = await User.aggregate([
      {
        $lookup: {
          from: 'clinicianprogresses',
          localField: '_id',
          foreignField: 'userId',
          as: 'progress'
        }
      },
      {
        $lookup: {
          from: 'performancemetrics',
          localField: '_id',
          foreignField: 'user_ref',
          as: 'performances'
        }
      },
      {
        $addFields: {
          progressData: { $arrayElemAt: ['$progress', 0] },
          totalCases: {
            $cond: {
              if: { $gt: [{ $size: '$progress' }, 0] },
              then: { $arrayElemAt: ['$progress.totalCasesCompleted', 0] },
              else: { $size: '$performances' }
            }
          },
          averageScore: {
            $cond: {
              if: { $gt: [{ $size: '$progress' }, 0] },
              then: { $arrayElemAt: ['$progress.overallAverageScore', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$performances' }, 0] },
                  then: { $avg: '$performances.metrics.overall_score' },
                  else: 0
                }
              }
            }
          },
          excellentCount: {
            $size: {
              $filter: {
                input: '$performances',
                cond: { $gte: ['$$this.metrics.overall_score', 90] }
              }
            }
          }
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          totalCases: 1,
          averageScore: { $round: ['$averageScore', 2] },
          excellentCount: 1,
          excellentRate: {
            $cond: {
              if: { $gt: ['$totalCases', 0] },
              then: { $round: [{ $multiply: [{ $divide: ['$excellentCount', '$totalCases'] }, 100] }, 1] },
              else: 0
            }
          }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);
    
    res.json(usersWithScores);
  } catch (error) {
    console.error('Error fetching users with scores:', error);
    res.status(500).json({ error: 'Failed to fetch users with scores' });
  }
});

// Get aggregated analytics for the admin dashboard
router.get('/analytics', protect, isAdmin, async (req, res) => {
  try {
    const [
      caseUsage,
      performanceTrends,
      effectivenessMetrics
    ] = await Promise.all([
      AnalyticsService.getCaseUsageAnalytics(),
      AnalyticsService.getPerformanceTrends(),
      AnalyticsService.getCaseEffectivenessMetrics()
    ]);

    const userEngagement = performanceTrends.map(trend => ({
      name: trend._id.date,
      value: trend.sessionCount,
    }));

    const casePopularity = caseUsage.usage.map(specialty => ({
        name: specialty._id.specialty,
        value: specialty.count
    }));

    const performanceMetrics = {
        avgScore: effectivenessMetrics[0]?.averageScore || 0,
        avgTime: `${(effectivenessMetrics[0]?.avgCompletionTime / 60000).toFixed(2) || 0}min`,
        completionRate: `${((effectivenessMetrics[0]?.totalSessions / caseUsage.usage.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(2) || 0}%`,
    }

    res.json({
        userEngagement,
        casePopularity,
        performanceMetrics
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

export default router;