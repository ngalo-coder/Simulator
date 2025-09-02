import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RBACService } from '../RBACService.js';
import { UserRole, HealthcareDiscipline } from '../../models/UserModel.js';

describe('RBACService', () => {
  let rbacService;
  let mockUser;

  beforeEach(() => {
    rbacService = new RBACService();
    
    // Create mock user objects for testing
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      primaryRole: UserRole.STUDENT,
      secondaryRoles: [],
      discipline: HealthcareDiscipline.MEDICINE,
      permissions: [],
      getAllRoles: function() {
        const roles = [this.primaryRole];
        if (this.secondaryRoles && this.secondaryRoles.length > 0) {
          roles.push(...this.secondaryRoles);
        }
        return [...new Set(roles)];
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Permission Checking', () => {
    it('should allow student to read cases from their discipline', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.MEDICINE };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'read', context);
      
      expect(hasPermission).toBe(true);
    });

    it('should deny student access to cases from different discipline', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.NURSING };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'read', context);
      
      expect(hasPermission).toBe(false);
    });

    it('should allow student to access their own data', async () => {
      const context = { targetUserId: '507f1f77bcf86cd799439011' };
      const hasPermission = await rbacService.checkPermission(mockUser, 'progress', 'read', context);
      
      expect(hasPermission).toBe(true);
    });

    it('should deny student access to other users data', async () => {
      const context = { targetUserId: 'different-user-id' };
      const hasPermission = await rbacService.checkPermission(mockUser, 'progress', 'read', context);
      
      expect(hasPermission).toBe(false);
    });

    it('should deny student permission to create cases', async () => {
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'create');
      
      expect(hasPermission).toBe(false);
    });

    it('should return false for null user', async () => {
      const hasPermission = await rbacService.checkPermission(null, 'cases', 'read');
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('Educator Permissions', () => {
    beforeEach(() => {
      mockUser.primaryRole = UserRole.EDUCATOR;
    });

    it('should allow educator to create cases in their discipline', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.MEDICINE };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'create', context);
      
      expect(hasPermission).toBe(true);
    });

    it('should allow educator to edit their own cases', async () => {
      const context = { 
        caseCreatorId: '507f1f77bcf86cd799439011',
        targetDiscipline: HealthcareDiscipline.MEDICINE 
      };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'edit', context);
      
      expect(hasPermission).toBe(true);
    });

    it('should deny educator editing cases from other educators', async () => {
      const context = { 
        caseCreatorId: 'different-educator-id',
        targetDiscipline: HealthcareDiscipline.MEDICINE 
      };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'edit', context);
      
      expect(hasPermission).toBe(false);
    });

    it('should allow educator to read student progress', async () => {
      const context = { 
        studentId: 'student-id',
        targetDiscipline: HealthcareDiscipline.MEDICINE 
      };
      const hasPermission = await rbacService.checkPermission(mockUser, 'students', 'read', context);
      
      expect(hasPermission).toBe(true);
    });
  });

  describe('Admin Permissions', () => {
    beforeEach(() => {
      mockUser.primaryRole = UserRole.ADMIN;
    });

    it('should allow admin full access to any resource', async () => {
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'delete');
      
      expect(hasPermission).toBe(true);
    });

    it('should allow admin access to any discipline', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.NURSING };
      const hasPermission = await rbacService.checkPermission(mockUser, 'cases', 'read', context);
      
      expect(hasPermission).toBe(true);
    });

    it('should allow admin access to any user data', async () => {
      const context = { targetUserId: 'any-user-id' };
      const hasPermission = await rbacService.checkPermission(mockUser, 'progress', 'read', context);
      
      expect(hasPermission).toBe(true);
    });
  });

  describe('Multi-Role Support', () => {
    beforeEach(() => {
      mockUser.primaryRole = UserRole.STUDENT;
      mockUser.secondaryRoles = [UserRole.EDUCATOR];
    });

    it('should grant permissions from both primary and secondary roles', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.MEDICINE };
      
      // Should have student permission to read cases
      const readPermission = await rbacService.checkPermission(mockUser, 'cases', 'read', context);
      expect(readPermission).toBe(true);
      
      // Should also have educator permission to create cases
      const createPermission = await rbacService.checkPermission(mockUser, 'cases', 'create', context);
      expect(createPermission).toBe(true);
    });
  });

  describe('Custom User Permissions', () => {
    beforeEach(() => {
      mockUser.permissions = [
        { resource: 'special-resource', action: 'special-action', conditions: {} }
      ];
    });

    it('should grant custom user permissions', async () => {
      const hasPermission = await rbacService.checkPermission(mockUser, 'special-resource', 'special-action');
      
      expect(hasPermission).toBe(true);
    });

    it('should combine role permissions with custom permissions', async () => {
      const context = { targetDiscipline: HealthcareDiscipline.MEDICINE };
      
      // Should have role-based permission
      const rolePermission = await rbacService.checkPermission(mockUser, 'cases', 'read', context);
      expect(rolePermission).toBe(true);
      
      // Should also have custom permission
      const customPermission = await rbacService.checkPermission(mockUser, 'special-resource', 'special-action');
      expect(customPermission).toBe(true);
    });
  });

  describe('Role Checking Methods', () => {
    it('should correctly identify if user has any of specified roles', () => {
      mockUser.primaryRole = UserRole.STUDENT;
      mockUser.secondaryRoles = [UserRole.EDUCATOR];
      
      expect(rbacService.hasAnyRole(mockUser, [UserRole.STUDENT])).toBe(true);
      expect(rbacService.hasAnyRole(mockUser, [UserRole.EDUCATOR])).toBe(true);
      expect(rbacService.hasAnyRole(mockUser, [UserRole.ADMIN])).toBe(false);
      expect(rbacService.hasAnyRole(mockUser, [UserRole.STUDENT, UserRole.ADMIN])).toBe(true);
    });

    it('should correctly identify if user has all specified roles', () => {
      mockUser.primaryRole = UserRole.STUDENT;
      mockUser.secondaryRoles = [UserRole.EDUCATOR];
      
      expect(rbacService.hasAllRoles(mockUser, [UserRole.STUDENT])).toBe(true);
      expect(rbacService.hasAllRoles(mockUser, [UserRole.EDUCATOR])).toBe(true);
      expect(rbacService.hasAllRoles(mockUser, [UserRole.STUDENT, UserRole.EDUCATOR])).toBe(true);
      expect(rbacService.hasAllRoles(mockUser, [UserRole.STUDENT, UserRole.ADMIN])).toBe(false);
    });

    it('should return false for null user in role checks', () => {
      expect(rbacService.hasAnyRole(null, [UserRole.STUDENT])).toBe(false);
      expect(rbacService.hasAllRoles(null, [UserRole.STUDENT])).toBe(false);
    });

    it('should return false for empty roles array', () => {
      expect(rbacService.hasAnyRole(mockUser, [])).toBe(false);
      expect(rbacService.hasAllRoles(mockUser, [])).toBe(false);
    });
  });

  describe('Permission Management', () => {
    it('should get permissions for a specific role', () => {
      const studentPermissions = rbacService.getRolePermissions(UserRole.STUDENT);
      
      expect(Array.isArray(studentPermissions)).toBe(true);
      expect(studentPermissions.length).toBeGreaterThan(0);
      expect(studentPermissions.some(p => p.resource === 'cases' && p.action === 'read')).toBe(true);
    });

    it('should add custom permission to role', () => {
      const customPermission = { resource: 'test-resource', action: 'test-action', conditions: {} };
      
      rbacService.addRolePermission(UserRole.STUDENT, customPermission);
      
      const studentPermissions = rbacService.getRolePermissions(UserRole.STUDENT);
      expect(studentPermissions).toContainEqual(customPermission);
    });

    it('should remove permission from role', () => {
      rbacService.removeRolePermission(UserRole.STUDENT, 'cases', 'read');
      
      const studentPermissions = rbacService.getRolePermissions(UserRole.STUDENT);
      expect(studentPermissions.some(p => p.resource === 'cases' && p.action === 'read')).toBe(false);
    });
  });

  describe('Permission Matching', () => {
    it('should match exact resource and action', () => {
      const permission = { resource: 'cases', action: 'read', conditions: {} };
      
      expect(rbacService.matchesPermission(permission, 'cases', 'read')).toBe(true);
      expect(rbacService.matchesPermission(permission, 'cases', 'write')).toBe(false);
      expect(rbacService.matchesPermission(permission, 'users', 'read')).toBe(false);
    });

    it('should match wildcard permissions', () => {
      const wildcardPermission = { resource: '*', action: '*', conditions: {} };
      const resourceWildcard = { resource: '*', action: 'read', conditions: {} };
      const actionWildcard = { resource: 'cases', action: '*', conditions: {} };
      
      expect(rbacService.matchesPermission(wildcardPermission, 'anything', 'anything')).toBe(true);
      expect(rbacService.matchesPermission(resourceWildcard, 'anything', 'read')).toBe(true);
      expect(rbacService.matchesPermission(actionWildcard, 'cases', 'anything')).toBe(true);
    });
  });

  describe('Context Evaluation', () => {
    it('should evaluate ownData condition correctly', async () => {
      const conditions = { ownData: true };
      const context = { targetUserId: '507f1f77bcf86cd799439011' };
      
      const result = await rbacService.evaluateConditions(conditions, mockUser, context);
      expect(result).toBe(true);
      
      const wrongContext = { targetUserId: 'different-user-id' };
      const wrongResult = await rbacService.evaluateConditions(conditions, mockUser, wrongContext);
      expect(wrongResult).toBe(false);
    });

    it('should evaluate disciplineMatch condition correctly', async () => {
      const conditions = { disciplineMatch: true };
      const context = { targetDiscipline: HealthcareDiscipline.MEDICINE };
      
      const result = await rbacService.evaluateConditions(conditions, mockUser, context);
      expect(result).toBe(true);
      
      const wrongContext = { targetDiscipline: HealthcareDiscipline.NURSING };
      const wrongResult = await rbacService.evaluateConditions(conditions, mockUser, wrongContext);
      expect(wrongResult).toBe(false);
    });

    it('should evaluate ownCases condition correctly', async () => {
      const conditions = { ownCases: true };
      const context = { caseCreatorId: '507f1f77bcf86cd799439011' };
      
      const result = await rbacService.evaluateConditions(conditions, mockUser, context);
      expect(result).toBe(true);
      
      const wrongContext = { caseCreatorId: 'different-creator-id' };
      const wrongResult = await rbacService.evaluateConditions(conditions, mockUser, wrongContext);
      expect(wrongResult).toBe(false);
    });

    it('should return true when no conditions are specified', async () => {
      const result = await rbacService.evaluateConditions({}, mockUser, {});
      expect(result).toBe(true);
    });
  });

  describe('User Permission Aggregation', () => {
    it('should aggregate permissions from all sources', () => {
      mockUser.primaryRole = UserRole.STUDENT;
      mockUser.secondaryRoles = [UserRole.EDUCATOR];
      mockUser.permissions = [
        { resource: 'custom', action: 'action', conditions: {} }
      ];
      
      const allPermissions = rbacService.getUserPermissions(mockUser);
      
      // Should include student permissions
      expect(allPermissions.some(p => p.resource === 'cases' && p.action === 'read')).toBe(true);
      
      // Should include educator permissions
      expect(allPermissions.some(p => p.resource === 'cases' && p.action === 'create')).toBe(true);
      
      // Should include custom permissions
      expect(allPermissions.some(p => p.resource === 'custom' && p.action === 'action')).toBe(true);
    });

    it('should handle user with no secondary roles or custom permissions', () => {
      mockUser.secondaryRoles = [];
      mockUser.permissions = [];
      
      const allPermissions = rbacService.getUserPermissions(mockUser);
      
      expect(allPermissions.length).toBeGreaterThan(0);
      expect(allPermissions.some(p => p.resource === 'cases' && p.action === 'read')).toBe(true);
    });
  });
});