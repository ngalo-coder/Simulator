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
 * Reset user password
 * POST /api/admin/users/:userId/reset-password
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
 * Bulk activate/deactivate users
 * POST /api/admin/users/bulk/status
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
 * Bulk role assignment
 * POST /api/admin/users/bulk/roles
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
 * Export users to CSV
 * GET /api/admin/users/export
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
 * Import users from CSV
 * POST /api/admin/users/import
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
 * Get user statistics
 * GET /api/admin/users/statistics
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
 * Get available roles and disciplines for forms
 * GET /api/admin/users/config
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
 * Get CSV template for import
 * GET /api/admin/users/import-template
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