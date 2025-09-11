import express from 'express';
import User from '../models/UserModel.js';
import Case from '../models/CaseModel.js';
import PerformanceMetrics from '../models/PerformanceMetricsModel.js';
import ClinicianProgress from '../models/ClinicianProgressModel.js';
import caseTemplateService from '../services/CaseTemplateService.js';
import caseManagementService from '../services/CaseManagementService.js';
import { protect, isAdmin } from '../middleware/jwtAuthMiddleware.js';

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

// ==================== ADMIN CASE CREATION ENDPOINTS ====================

/**
 * @swagger
 * /api/admin/cases/templates:
 *   get:
 *     summary: Get available case templates for admin case creation
 *     description: Retrieve all available case templates organized by discipline
 *     tags: [Admin Case Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       discipline:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       template:
 *                         type: object
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/cases/templates', protect, isAdmin, async (req, res) => {
  try {
    const templates = caseTemplateService.getAllTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching case templates:', error);
    res.status(500).json({ error: 'Failed to fetch case templates' });
  }
});

/**
 * @swagger
 * /api/admin/cases/create:
 *   post:
 *     summary: Create a new case (Admin)
 *     description: Create a new simulation case from template or custom data
 *     tags: [Admin Case Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - discipline
 *               - title
 *             properties:
 *               discipline:
 *                 type: string
 *                 enum: [medicine, nursing, laboratory, radiology, pharmacy]
 *                 example: 'medicine'
 *               title:
 *                 type: string
 *                 example: 'Acute Myocardial Infarction Case'
 *               description:
 *                 type: string
 *                 example: 'A comprehensive case study for cardiology training'
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: 'intermediate'
 *               estimatedDuration:
 *                 type: number
 *                 example: 45
 *               specialty:
 *                 type: string
 *                 example: 'Cardiology'
 *               programArea:
 *                 type: string
 *                 example: 'Internal Medicine'
 *               customData:
 *                 type: object
 *                 description: Custom case data to merge with template
 *     responses:
 *       201:
 *         description: Case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Case created successfully'
 *                 caseId:
 *                   type: string
 *                   example: '64a7b8c9d1234567890abcde'
 *                 case:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/cases/create', protect, isAdmin, async (req, res) => {
  try {
    const {
      discipline,
      title,
      description,
      difficulty = 'intermediate',
      estimatedDuration = 45,
      specialty,
      programArea,
      customData = {}
    } = req.body;

    // Validate required fields
    if (!discipline || !title) {
      return res.status(400).json({
        success: false,
        message: 'Discipline and title are required'
      });
    }

    // Prepare case data for creation
    const caseCreationData = {
      discipline,
      customData: {
        case_metadata: {
          title,
          description: description || '',
          difficulty,
          estimated_duration: estimatedDuration,
          specialty: specialty || discipline,
          program_area: programArea || discipline
        },
        description: description || '',
        ...customData
      }
    };

    // Create case using the template service and case management service
    const templateCase = caseTemplateService.createCaseFromTemplate(
      discipline,
      caseCreationData.customData,
      req.user
    );

    // Use case management service to create the case in the database
    const createdCase = await caseManagementService.createCase(templateCase, req.user);

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      caseId: createdCase._id,
      case: createdCase
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create case'
    });
  }
});

/**
 * @swagger
 * /api/admin/cases/{caseId}/edit:
 *   put:
 *     summary: Edit an existing case (Admin)
 *     description: Update case data including metadata and clinical content
 *     tags: [Admin Case Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               estimatedDuration:
 *                 type: number
 *               specialty:
 *                 type: string
 *               programArea:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, pending_review, approved, published, archived, rejected]
 *               caseData:
 *                 type: object
 *                 description: Updated case content data
 *     responses:
 *       200:
 *         description: Case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Case updated successfully'
 *                 case:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Case not found
 *       500:
 *         description: Server error
 */
router.put('/cases/:caseId/edit', protect, isAdmin, async (req, res) => {
  try {
    const { caseId } = req.params;
    const updateData = req.body;

    // Find the case
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Prepare update data
    const caseUpdateData = {
      lastModifiedBy: req.user._id,
      lastModifiedAt: new Date()
    };

    // Update metadata if provided
    if (updateData.title || updateData.description || updateData.difficulty || 
        updateData.estimatedDuration || updateData.specialty || updateData.programArea) {
      caseUpdateData.case_metadata = {
        ...existingCase.case_metadata.toObject(),
        ...(updateData.title && { title: updateData.title }),
        ...(updateData.description && { description: updateData.description }),
        ...(updateData.difficulty && { difficulty: updateData.difficulty }),
        ...(updateData.estimatedDuration && { estimated_duration: updateData.estimatedDuration }),
        ...(updateData.specialty && { specialty: updateData.specialty }),
        ...(updateData.programArea && { program_area: updateData.programArea })
      };
    }

    // Update description if provided
    if (updateData.description) {
      caseUpdateData.description = updateData.description;
    }

    // Update status if provided
    if (updateData.status) {
      caseUpdateData.status = updateData.status;
    }

    // Merge any additional case data
    if (updateData.caseData) {
      Object.assign(caseUpdateData, updateData.caseData);
    }

    // Use case management service to update the case
    const updatedCase = await caseManagementService.updateCase(caseId, caseUpdateData, req.user);

    res.json({
      success: true,
      message: 'Case updated successfully',
      case: updatedCase
    });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update case'
    });
  }
});

/**
 * @swagger
 * /api/admin/cases/{caseId}/publish:
 *   post:
 *     summary: Publish a case (Admin)
 *     description: Publish a case making it available for simulation
 *     tags: [Admin Case Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the case to publish
 *     responses:
 *       200:
 *         description: Case published successfully
 *       404:
 *         description: Case not found
 *       400:
 *         description: Case cannot be published (validation failed)
 *       500:
 *         description: Server error
 */
router.post('/cases/:caseId/publish', protect, isAdmin, async (req, res) => {
  try {
    const { caseId } = req.params;

    // Use case management service to publish the case
    const result = await caseManagementService.publishCase(caseId, req.user);

    res.json({
      success: true,
      message: 'Case published successfully',
      case: result
    });
  } catch (error) {
    console.error('Error publishing case:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to publish case'
    });
  }
});

export default router;