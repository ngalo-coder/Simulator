import express from 'express';
import multer from 'multer';
import adminUserManagementService from '../services/AdminUserManagementService.js';
import { requireAdmin, populateUser } from '../middleware/authMiddleware.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Apply admin authentication to all routes
router.use(populateUser());
router.use(requireAdmin);

/**
 * User Listing and Search
 */

/**
 * Get paginated list of users with filtering
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      role,
      discipline,
      isActive,
      emailVerified,
      createdAfter,
      createdBefore
    } = req.query;

    const filters = {};
    if (role) filters.role = Array.isArray(role) ? role : [role];
    if (discipline) filters.discipline = Array.isArray(discipline) ? discipline : [discipline];
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (emailVerified !== undefined) filters.emailVerified = emailVerified === 'true';
    if (createdAfter) filters.createdAfter = createdAfter;
    if (createdBefore) filters.createdBefore = createdBefore;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search
    };

    const result = await adminUserManagementService.getUsers(filters, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

/**
 * Get user by ID
 * GET /api/admin/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await adminUserManagementService.getUserById(req.params.userId);

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
});

/**
 * User Creation and Editing
 */

/**
 * Create new user
 * POST /api/admin/users
 */
router.post('/users', async (req, res) => {
  try {
    const user = await adminUserManagementService.createUser(req.body, req.user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message.includes('required') || 
        error.message.includes('already exists') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

/**
 * Update user
 * PUT /api/admin/users/:userId
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const user = await adminUserManagementService.updateUser(
      req.params.userId,
      req.body,
      req.user
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

/**
 * Delete user
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    await adminUserManagementService.deleteUser(req.params.userId, req.user);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset a user's password to a new value (admin action)
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose password to reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: 'newSecurePassword123'
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: 'Password reset successfully'
 *       400:
 *         description: New password is required or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/:userId/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    await adminUserManagementService.resetUserPassword(
      req.params.userId,
      newPassword,
      req.user
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (error.message.includes('Password must be')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

/**
 * Bulk Operations
 */

/**
 * @swagger
 * /api/admin/users/bulk/status:
 *   post:
 *     summary: Bulk activate/deactivate users
 *     description: Activate or deactivate multiple users in bulk operation
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - isActive
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: 'Updated status for 2 users'
 *                 updatedCount:
 *                   type: integer
 *                   example: 2
 *                 failedCount:
 *                   type: integer
 *                   example: 0
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/bulk/status', async (req, res) => {
  try {
    const { userIds, isActive } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean'
      });
    }

    const result = await adminUserManagementService.bulkUpdateActiveStatus(
      userIds,
      isActive,
      req.user
    );

    res.json(result);

  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/bulk/roles:
 *   post:
 *     summary: Bulk role assignment
 *     description: Add or remove roles from multiple users in bulk operation
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - role
 *               - operation
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
 *               role:
 *                 type: string
 *                 enum: [student, educator, admin]
 *                 example: 'admin'
 *               operation:
 *                 type: string
 *                 enum: [add, remove]
 *                 example: 'add'
 *     responses:
 *       200:
 *         description: Roles updated successfully
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
 *                   example: 'Added admin role to 2 users'
 *                 updatedCount:
 *                   type: integer
 *                   example: 2
 *                 failedCount:
 *                   type: integer
 *                   example: 0
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/bulk/roles', async (req, res) => {
  try {
    const { userIds, role, operation } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required'
      });
    }

    if (!operation || !['add', 'remove'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Operation must be "add" or "remove"'
      });
    }

    const result = await adminUserManagementService.bulkRoleAssignment(
      userIds,
      role,
      operation,
      req.user
    );

    res.json(result);

  } catch (error) {
    console.error('Bulk role assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign roles'
    });
  }
});

/**
 * Import/Export Operations
 */

/**
 * @swagger
 * /api/admin/users/export:
 *   get:
 *     summary: Export users to CSV
 *     description: Export users data to CSV file with filtering options
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [student, educator, admin]
 *         style: form
 *         explode: false
 *         description: Filter by user role(s)
 *       - in: query
 *         name: discipline
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [medicine, nursing, radiology, pharmacy, laboratory]
 *         style: form
 *         explode: false
 *         description: Filter by healthcare discipline(s)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: boolean
 *         description: Filter by email verification status
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created after this date (YYYY-MM-DD)
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter users created before this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: CSV export generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "username,email,role,discipline,isActive\njohndoe,john@example.com,student,medicine,true"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/export', async (req, res) => {
  try {
    const {
      role,
      discipline,
      isActive,
      emailVerified,
      createdAfter,
      createdBefore
    } = req.query;

    const filters = {};
    if (role) filters.role = Array.isArray(role) ? role : [role];
    if (discipline) filters.discipline = Array.isArray(discipline) ? discipline : [discipline];
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (emailVerified !== undefined) filters.emailVerified = emailVerified === 'true';
    if (createdAfter) filters.createdAfter = createdAfter;
    if (createdBefore) filters.createdBefore = createdBefore;

    const csvData = await adminUserManagementService.exportUsers(filters, req.user);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csvData);

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/import:
 *   post:
 *     summary: Import users from CSV
 *     description: Import users from CSV file with validation and error handling
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user data
 *     responses:
 *       200:
 *         description: Users imported successfully
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
 *                   example: 'Import completed'
 *                 result:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: integer
 *                       example: 10
 *                     successful:
 *                       type: integer
 *                       example: 8
 *                     failed:
 *                       type: integer
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                             example: 3
 *                           error:
 *                             type: string
 *                             example: 'Invalid email format'
 *       400:
 *         description: CSV file is required or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/import', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const result = await adminUserManagementService.importUsers(req.file.buffer, req.user);

    res.json({
      success: true,
      message: 'Import completed',
      result
    });

  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import users'
    });
  }
});

/**
 * Statistics and Analytics
 */

/**
 * @swagger
 * /api/admin/users/statistics:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve comprehensive user statistics including counts by role, discipline, and activity
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 150
 *                     usersByRole:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         example: 100
 *                     usersByDiscipline:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                         example: 50
 *                     activeUsers:
 *                       type: integer
 *                       example: 120
 *                     verifiedUsers:
 *                       type: integer
 *                       example: 130
 *                     newUsersThisWeek:
 *                       type: integer
 *                       example: 15
 *                     newUsersThisMonth:
 *                       type: integer
 *                       example: 45
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/statistics', async (req, res) => {
  try {
    const statistics = await adminUserManagementService.getUserStatistics();

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

/**
 * Configuration and Metadata
 */

/**
 * @swagger
 * /api/admin/users/config:
 *   get:
 *     summary: Get configuration for user forms
 *     description: Retrieve available roles, disciplines, competency levels, and filter options for admin forms
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 config:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'student'
 *                           label:
 *                             type: string
 *                             example: 'Student'
 *                           description:
 *                             type: string
 *                             example: 'Learning healthcare skills and knowledge through simulations'
 *                     disciplines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'medicine'
 *                           label:
 *                             type: string
 *                             example: 'Medicine'
 *                           description:
 *                             type: string
 *                             example: 'Medical practice, diagnosis, and treatment'
 *                     competencyLevels:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'novice'
 *                           label:
 *                             type: string
 *                             example: 'Novice'
 *                           description:
 *                             type: string
 *                             example: 'Beginning level with limited experience'
 *                     sortOptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                             example: 'createdAt'
 *                           label:
 *                             type: string
 *                             example: 'Created Date'
 *                     filterOptions:
 *                       type: object
 *                       properties:
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                             example: 'student'
 *                         disciplines:
 *                           type: array
 *                           items:
 *                             type: string
 *                             example: 'medicine'
 *                         activeStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: boolean
 *                                 example: true
 *                               label:
 *                                 type: string
 *                                 example: 'Active'
 *                         verificationStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: boolean
 *                                 example: true
 *                               label:
 *                                 type: string
 *                                 example: 'Verified'
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/config', (req, res) => {
  try {
    const config = {
      roles: Object.values(UserRole).map(role => ({
        value: role,
        label: role.charAt(0).toUpperCase() + role.slice(1),
        description: getRoleDescription(role)
      })),
      disciplines: Object.values(HealthcareDiscipline).map(discipline => ({
        value: discipline,
        label: discipline.charAt(0).toUpperCase() + discipline.slice(1),
        description: getDisciplineDescription(discipline)
      })),
      competencyLevels: [
        { value: 'novice', label: 'Novice', description: 'Beginning level with limited experience' },
        { value: 'advanced_beginner', label: 'Advanced Beginner', description: 'Some experience with guidance needed' },
        { value: 'competent', label: 'Competent', description: 'Adequate performance with planning' },
        { value: 'proficient', label: 'Proficient', description: 'Efficient performance with experience' },
        { value: 'expert', label: 'Expert', description: 'Intuitive performance with deep understanding' }
      ],
      sortOptions: [
        { value: 'createdAt', label: 'Created Date' },
        { value: 'username', label: 'Username' },
        { value: 'email', label: 'Email' },
        { value: 'profile.lastName', label: 'Last Name' },
        { value: 'lastLogin', label: 'Last Login' }
      ],
      filterOptions: {
        roles: Object.values(UserRole),
        disciplines: Object.values(HealthcareDiscipline),
        activeStatus: [
          { value: true, label: 'Active' },
          { value: false, label: 'Inactive' }
        ],
        verificationStatus: [
          { value: true, label: 'Verified' },
          { value: false, label: 'Unverified' }
        ]
      }
    };

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configuration'
    });
  }
});

/**
 * @swagger
 * /api/admin/users/import-template:
 *   get:
 *     summary: Get CSV template for import
 *     description: Download a CSV template with proper headers for user import
 *     tags: [Admin User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "username,email,password,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified"
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/import-template', (req, res) => {
  try {
    const template = [
      'username,email,password,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified',
      'johnsmith,john@example.com,password123,student,,medicine,John,Smith,Medical University,Internal Medicine,3,,competent,true,false',
      'janedoe,jane@example.com,password456,educator,student,nursing,Jane,Doe,Nursing College,Critical Care,,,proficient,true,true'
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=user-import-template.csv');
    res.send(template);

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template'
    });
  }
});

/**
 * Helper functions
 */
function getRoleDescription(role) {
  const descriptions = {
    [UserRole.STUDENT]: 'Learning healthcare skills and knowledge through simulations',
    [UserRole.EDUCATOR]: 'Teaching and mentoring healthcare students, creating content',
    [UserRole.ADMIN]: 'System administration, user management, and platform oversight'
  };
  return descriptions[role] || '';
}

function getDisciplineDescription(discipline) {
  const descriptions = {
    [HealthcareDiscipline.MEDICINE]: 'Medical practice, diagnosis, and treatment',
    [HealthcareDiscipline.NURSING]: 'Patient care, health promotion, and disease prevention',
    [HealthcareDiscipline.LABORATORY]: 'Diagnostic testing and laboratory analysis',
    [HealthcareDiscipline.RADIOLOGY]: 'Medical imaging and diagnostic radiology',
    [HealthcareDiscipline.PHARMACY]: 'Medication management and pharmaceutical care'
  };
  return descriptions[discipline] || '';
}

export default router;