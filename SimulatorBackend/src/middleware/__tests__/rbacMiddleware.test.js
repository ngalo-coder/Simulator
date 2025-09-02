import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  requirePermission,
  requireAnyRole,
  requireAllRoles,
  requireOwnData,
  requireSameDiscipline,
  populateUser,
  requirePermissionWithContext,
  studentOnly,
  educatorOnly,
  adminOnly,
  educatorOrAdmin,
  anyAuthenticated
} from '../rbacMiddleware.js';
import { UserRole, HealthcareDiscipline } from '../../models/UserModel.js';

// Mock the RBAC service
jest.mock('../../services/RBACService.js', () => ({
  default: {
    checkPermission: jest.fn(),
    hasAnyRole: jest.fn(),
    hasAllRoles: jest.fn()
  }
}));

// Mock the User model
jest.mock('../../models/UserModel.js', () => ({
  default: {
    findById: jest.fn()
  },
  UserRole: {
    STUDENT: 'student',
    EDUCATOR: 'educator',
    ADMIN: 'admin'
  },
  HealthcareDiscipline: {
    MEDICINE: 'medicine',
    NURSING: 'nursing',
    LABORATORY: 'laboratory',
    RADIOLOGY: 'radiology',
    PHARMACY: 'pharmacy'
  }
}));

import rbacService from '../../services/RBACService.js';
import User from '../../models/UserModel.js';

describe('RBAC Middleware', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock user
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      primaryRole: UserRole.STUDENT,
      discipline: HealthcareDiscipline.MEDICINE,
      getAllRoles: jest.fn().mockReturnValue([UserRole.STUDENT])
    };

    // Setup mock request, response, and next
    req = {
      user: mockUser,
      params: {},
      body: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requirePermission', () => {
    it('should allow access when user has permission', async () => {
      rbacService.checkPermission.mockResolvedValue(true);
      
      const middleware = requirePermission('cases', 'read');
      await middleware(req, res, next);
      
      expect(rbacService.checkPermission).toHaveBeenCalledWith(
        mockUser,
        'cases',
        'read',
        expect.any(Object)
      );
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks permission', async () => {
      rbacService.checkPermission.mockResolvedValue(false);
      
      const middleware = requirePermission('cases', 'create');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      req.user = null;
      
      const middleware = requirePermission('cases', 'read');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should build context from request parameters', async () => {
      rbacService.checkPermission.mockResolvedValue(true);
      req.params.userId = 'test-user-id';
      req.body.discipline = HealthcareDiscipline.NURSING;
      
      const middleware = requirePermission('cases', 'read');
      await middleware(req, res, next);
      
      expect(rbacService.checkPermission).toHaveBeenCalledWith(
        mockUser,
        'cases',
        'read',
        expect.objectContaining({
          targetUserId: 'test-user-id',
          targetDiscipline: HealthcareDiscipline.NURSING
        })
      );
    });

    it('should handle errors gracefully', async () => {
      rbacService.checkPermission.mockRejectedValue(new Error('Test error'));
      
      const middleware = requirePermission('cases', 'read');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during permission check'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('should allow access when user has one of the required roles', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      const middleware = requireAnyRole([UserRole.STUDENT, UserRole.EDUCATOR]);
      await middleware(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, [UserRole.STUDENT, UserRole.EDUCATOR]);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks required roles', async () => {
      rbacService.hasAnyRole.mockReturnValue(false);
      
      const middleware = requireAnyRole([UserRole.ADMIN]);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: admin'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      req.user = null;
      
      const middleware = requireAnyRole([UserRole.STUDENT]);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAllRoles', () => {
    it('should allow access when user has all required roles', async () => {
      rbacService.hasAllRoles.mockReturnValue(true);
      
      const middleware = requireAllRoles([UserRole.STUDENT, UserRole.EDUCATOR]);
      await middleware(req, res, next);
      
      expect(rbacService.hasAllRoles).toHaveBeenCalledWith(mockUser, [UserRole.STUDENT, UserRole.EDUCATOR]);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user lacks some required roles', async () => {
      rbacService.hasAllRoles.mockReturnValue(false);
      
      const middleware = requireAllRoles([UserRole.STUDENT, UserRole.ADMIN]);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. All required roles needed: student, admin'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnData', () => {
    it('should allow access to own data', async () => {
      req.params.userId = '507f1f77bcf86cd799439011';
      
      const middleware = requireOwnData();
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access to other users data for non-admin', async () => {
      req.params.userId = 'different-user-id';
      rbacService.hasAnyRole.mockReturnValue(false);
      
      const middleware = requireOwnData();
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You can only access your own data'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to access any user data', async () => {
      req.params.userId = 'different-user-id';
      rbacService.hasAnyRole.mockReturnValue(true);
      
      const middleware = requireOwnData();
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when userId parameter is missing', async () => {
      const middleware = requireOwnData();
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID parameter is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom parameter name', async () => {
      req.params.customUserId = '507f1f77bcf86cd799439011';
      
      const middleware = requireOwnData('customUserId');
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireSameDiscipline', () => {
    it('should allow access to same discipline data', async () => {
      req.params.discipline = HealthcareDiscipline.MEDICINE;
      
      const middleware = requireSameDiscipline();
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access to different discipline data for non-admin', async () => {
      req.params.discipline = HealthcareDiscipline.NURSING;
      rbacService.hasAnyRole.mockReturnValue(false);
      
      const middleware = requireSameDiscipline();
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You can only access data from your discipline'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to access any discipline data', async () => {
      req.params.discipline = HealthcareDiscipline.NURSING;
      rbacService.hasAnyRole.mockReturnValue(true);
      
      const middleware = requireSameDiscipline();
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 when discipline parameter is missing', async () => {
      const middleware = requireSameDiscipline();
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Discipline parameter is required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('populateUser', () => {
    it('should populate user from database when user is not fully loaded', async () => {
      const partialUser = { _id: '507f1f77bcf86cd799439011' };
      const fullUser = { ...mockUser };
      
      req.user = partialUser;
      User.findById.mockResolvedValue(fullUser);
      
      const middleware = populateUser();
      await middleware(req, res, next);
      
      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(req.user).toBe(fullUser);
      expect(next).toHaveBeenCalled();
    });

    it('should skip population when user is already fully loaded', async () => {
      const middleware = populateUser();
      await middleware(req, res, next);
      
      expect(User.findById).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const partialUser = { _id: '507f1f77bcf86cd799439011' };
      req.user = partialUser;
      User.findById.mockRejectedValue(new Error('Database error'));
      
      const middleware = populateUser();
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during user population'
      });
    });
  });

  describe('requirePermissionWithContext', () => {
    it('should use custom context builder', async () => {
      rbacService.checkPermission.mockResolvedValue(true);
      
      const contextBuilder = (req) => ({
        customField: req.params.customParam
      });
      
      req.params.customParam = 'test-value';
      
      const middleware = requirePermissionWithContext('cases', 'read', contextBuilder);
      await middleware(req, res, next);
      
      expect(rbacService.checkPermission).toHaveBeenCalledWith(
        mockUser,
        'cases',
        'read',
        { customField: 'test-value' }
      );
      expect(next).toHaveBeenCalled();
    });

    it('should use empty context when no builder provided', async () => {
      rbacService.checkPermission.mockResolvedValue(true);
      
      const middleware = requirePermissionWithContext('cases', 'read');
      await middleware(req, res, next);
      
      expect(rbacService.checkPermission).toHaveBeenCalledWith(
        mockUser,
        'cases',
        'read',
        {}
      );
    });
  });

  describe('Predefined Role Middleware', () => {
    it('should create studentOnly middleware', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      await studentOnly(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['student']);
      expect(next).toHaveBeenCalled();
    });

    it('should create educatorOnly middleware', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      await educatorOnly(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['educator']);
    });

    it('should create adminOnly middleware', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      await adminOnly(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['admin']);
    });

    it('should create educatorOrAdmin middleware', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      await educatorOrAdmin(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['educator', 'admin']);
    });

    it('should create anyAuthenticated middleware', async () => {
      rbacService.hasAnyRole.mockReturnValue(true);
      
      await anyAuthenticated(req, res, next);
      
      expect(rbacService.hasAnyRole).toHaveBeenCalledWith(mockUser, ['student', 'educator', 'admin']);
    });
  });

  describe('Error Handling', () => {
    it('should handle RBAC service errors in requirePermission', async () => {
      rbacService.checkPermission.mockRejectedValue(new Error('Service error'));
      
      const middleware = requirePermission('cases', 'read');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during permission check'
      });
    });

    it('should handle RBAC service errors in requireAnyRole', async () => {
      rbacService.hasAnyRole.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      const middleware = requireAnyRole([UserRole.STUDENT]);
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during role check'
      });
    });
  });
});