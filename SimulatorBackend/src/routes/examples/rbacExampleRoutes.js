import express from 'express';
import {
  requirePermission,
  requireAnyRole,
  requireOwnData,
  requireSameDiscipline,
  populateUser,
  studentOnly,
  educatorOnly,
  adminOnly,
  educatorOrAdmin,
  anyAuthenticated
} from '../middleware/rbacMiddleware.js';
import { UserRole, HealthcareDiscipline } from '../models/UserModel.js';

const router = express.Router();

// Example routes demonstrating RBAC usage

/**
 * Student-only route - only students can access
 */
router.get('/student-dashboard', 
  populateUser(),
  studentOnly,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to student dashboard',
      user: req.user.getFullName()
    });
  }
);

/**
 * Educator-only route - only educators can access
 */
router.get('/educator-dashboard',
  populateUser(),
  educatorOnly,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to educator dashboard',
      user: req.user.getFullName()
    });
  }
);

/**
 * Admin-only route - only admins can access
 */
router.get('/admin-panel',
  populateUser(),
  adminOnly,
  (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to admin panel',
      user: req.user.getFullName()
    });
  }
);

/**
 * Cases route - students can read cases from their discipline
 */
router.get('/cases/:discipline',
  populateUser(),
  requirePermission('cases', 'read'),
  (req, res) => {
    res.json({
      success: true,
      message: `Cases for ${req.params.discipline}`,
      discipline: req.params.discipline
    });
  }
);

/**
 * Case creation route - only educators can create cases in their discipline
 */
router.post('/cases',
  populateUser(),
  requirePermission('cases', 'create'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Case created successfully',
      caseId: 'new-case-id'
    });
  }
);

/**
 * User profile route - users can only access their own profile
 */
router.get('/users/:userId/profile',
  populateUser(),
  requireOwnData('userId'),
  (req, res) => {
    res.json({
      success: true,
      message: 'User profile retrieved',
      userId: req.params.userId
    });
  }
);

/**
 * User progress route - users can only access their own progress
 */
router.get('/users/:userId/progress',
  populateUser(),
  requirePermission('progress', 'read'),
  (req, res) => {
    res.json({
      success: true,
      message: 'User progress retrieved',
      userId: req.params.userId
    });
  }
);

/**
 * Discipline-specific resources - users can only access resources from their discipline
 */
router.get('/resources/:discipline',
  populateUser(),
  requireSameDiscipline('discipline'),
  (req, res) => {
    res.json({
      success: true,
      message: `Resources for ${req.params.discipline}`,
      discipline: req.params.discipline
    });
  }
);

/**
 * Student management route - educators can manage their students
 */
router.get('/students/:studentId',
  populateUser(),
  requirePermission('students', 'read'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Student data retrieved',
      studentId: req.params.studentId
    });
  }
);

/**
 * Analytics route - educators can view analytics for their classes
 */
router.get('/analytics/:classId',
  populateUser(),
  requirePermission('analytics', 'read'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Analytics data retrieved',
      classId: req.params.classId
    });
  }
);

/**
 * Multi-role route - educators or admins can access
 */
router.get('/management',
  populateUser(),
  educatorOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Management interface',
      userRole: req.user.primaryRole
    });
  }
);

/**
 * Any authenticated user route
 */
router.get('/help',
  populateUser(),
  anyAuthenticated,
  (req, res) => {
    res.json({
      success: true,
      message: 'Help documentation',
      userRole: req.user.primaryRole
    });
  }
);

/**
 * Complex permission route with custom context
 */
router.put('/cases/:caseId',
  populateUser(),
  requirePermission('cases', 'edit'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Case updated successfully',
      caseId: req.params.caseId
    });
  }
);

/**
 * Role-based content route
 */
router.get('/dashboard',
  populateUser(),
  anyAuthenticated,
  (req, res) => {
    const user = req.user;
    let dashboardContent = {};

    if (user.hasRole(UserRole.STUDENT)) {
      dashboardContent.studentFeatures = [
        'View assigned cases',
        'Track progress',
        'Access resources'
      ];
    }

    if (user.hasRole(UserRole.EDUCATOR)) {
      dashboardContent.educatorFeatures = [
        'Create cases',
        'Manage students',
        'View analytics'
      ];
    }

    if (user.hasRole(UserRole.ADMIN)) {
      dashboardContent.adminFeatures = [
        'System management',
        'User administration',
        'Global analytics'
      ];
    }

    res.json({
      success: true,
      message: 'Dashboard content',
      content: dashboardContent,
      userRoles: user.getAllRoles()
    });
  }
);

export default router;