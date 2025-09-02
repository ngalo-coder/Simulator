import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AdminUserManagementService } from '../AdminUserManagementService.js';
import { UserRole, HealthcareDiscipline } from '../../models/UserModel.js';

// Mock dependencies
jest.mock('../../models/UserModel.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn()
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

jest.mock('../AuditLoggerService.js', () => ({
  default: {
    logAuthEvent: jest.fn()
  }
}));

import User from '../../models/UserModel.js';
import auditLogger from '../AuditLoggerService.js';

describe('AdminUserManagementService', () => {
  let adminUserManagementService;
  let mockAdminUser;
  let mockUsers;

  beforeEach(() => {
    jest.clearAllMocks();
    adminUserManagementService = new AdminUserManagementService();
    
    mockAdminUser = {
      _id: 'admin-id-123',
      username: 'admin',
      primaryRole: UserRole.ADMIN
    };

    mockUsers = [
      {
        _id: 'user-1',
        username: 'student1',
        email: 'student1@example.com',
        primaryRole: UserRole.STUDENT,
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          institution: 'Medical University'
        },
        isActive: true,
        emailVerified: false,
        createdAt: new Date()
      },
      {
        _id: 'user-2',
        username: 'educator1',
        email: 'educator1@example.com',
        primaryRole: UserRole.EDUCATOR,
        discipline: HealthcareDiscipline.NURSING,
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          institution: 'Nursing College'
        },
        isActive: true,
        emailVerified: true,
        createdAt: new Date()
      }
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users with default options', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(2);

      const result = await adminUserManagementService.getUsers();

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(User.find).toHaveBeenCalledWith({});
    });

    it('should apply role filter correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]])
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      const filters = { role: UserRole.STUDENT };
      const result = await adminUserManagementService.getUsers(filters);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { primaryRole: UserRole.STUDENT },
          { secondaryRoles: UserRole.STUDENT }
        ]
      });
    });

    it('should apply discipline filter correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUsers[0]])
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      const filters = { discipline: HealthcareDiscipline.MEDICINE };
      await adminUserManagementService.getUsers(filters);

      expect(User.find).toHaveBeenCalledWith({
        discipline: HealthcareDiscipline.MEDICINE
      });
    });

    it('should apply search filter correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(2);

      const options = { search: 'john' };
      await adminUserManagementService.getUsers({}, options);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { 'profile.firstName': { $regex: 'john', $options: 'i' } },
          { 'profile.lastName': { $regex: 'john', $options: 'i' } },
          { 'profile.institution': { $regex: 'john', $options: 'i' } }
        ]
      });
    });

    it('should handle pagination correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(50);

      const options = { page: 2, limit: 10 };
      const result = await adminUserManagementService.getUsers({}, options);

      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers[0])
      };

      User.findById.mockReturnValue(mockQuery);

      const result = await adminUserManagementService.getUserById('user-1');

      expect(result).toEqual(mockUsers[0]);
      expect(User.findById).toHaveBeenCalledWith('user-1');
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
    });

    it('should throw error when user not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      };

      User.findById.mockReturnValue(mockQuery);

      await expect(adminUserManagementService.getUserById('invalid-id'))
        .rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        firstName: 'New',
        lastName: 'User',
        institution: 'Test University',
        primaryRole: UserRole.STUDENT
      };

      User.findOne.mockResolvedValue(null); // No existing user

      const mockUser = {
        ...userData,
        _id: 'new-user-id',
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ ...userData, _id: 'new-user-id' }),
        addPermission: jest.fn()
      };

      // Mock User constructor
      User.mockImplementation(() => mockUser);

      const result = await adminUserManagementService.createUser(userData, mockAdminUser);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: 'newuser' },
          { email: 'newuser@example.com' }
        ]
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'USER_CREATED',
          adminUserId: mockAdminUser._id
        })
      );
      expect(result._id).toBe('new-user-id');
    });

    it('should throw error for missing required fields', async () => {
      const incompleteData = {
        username: 'newuser'
        // Missing other required fields
      };

      await expect(adminUserManagementService.createUser(incompleteData, mockAdminUser))
        .rejects.toThrow('email is required');
    });

    it('should throw error for existing username', async () => {
      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        firstName: 'New',
        lastName: 'User',
        institution: 'Test University'
      };

      User.findOne.mockResolvedValue({ username: 'existinguser' });

      await expect(adminUserManagementService.createUser(userData, mockAdminUser))
        .rejects.toThrow('Username or email already exists');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        _id: 'user-1',
        username: 'testuser',
        primaryRole: UserRole.STUDENT,
        secondaryRoles: [],
        discipline: HealthcareDiscipline.MEDICINE,
        isActive: true,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            toObject: jest.fn().mockReturnValue({ language: 'en' })
          }
        },
        permissions: [],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ _id: 'user-1', username: 'testuser' }),
        addPermission: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      const updateData = {
        primaryRole: UserRole.EDUCATOR,
        profile: {
          firstName: 'Updated',
          specialization: 'Cardiology'
        }
      };

      const result = await adminUserManagementService.updateUser('user-1', updateData, mockAdminUser);

      expect(mockUser.primaryRole).toBe(UserRole.EDUCATOR);
      expect(mockUser.profile.firstName).toBe('Updated');
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'USER_UPDATED',
          adminUserId: mockAdminUser._id
        })
      );
    });

    it('should throw error when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(adminUserManagementService.updateUser('invalid-id', {}, mockAdminUser))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        _id: 'user-1',
        username: 'testuser',
        primaryRole: UserRole.STUDENT,
        secondaryRoles: [],
        discipline: HealthcareDiscipline.MEDICINE
      };

      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await adminUserManagementService.deleteUser('user-1', mockAdminUser);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user-1');
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'USER_DELETED',
          adminUserId: mockAdminUser._id
        })
      );
      expect(result).toBe(true);
    });

    it('should prevent deletion of last admin', async () => {
      const mockAdminUserToDelete = {
        _id: 'admin-1',
        username: 'admin',
        primaryRole: UserRole.ADMIN,
        secondaryRoles: []
      };

      User.findById.mockResolvedValue(mockAdminUserToDelete);
      User.countDocuments.mockResolvedValue(1); // Only one admin

      await expect(adminUserManagementService.deleteUser('admin-1', mockAdminUser))
        .rejects.toThrow('Cannot delete the last admin user');
    });

    it('should throw error when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(adminUserManagementService.deleteUser('invalid-id', mockAdminUser))
        .rejects.toThrow('User not found');
    });
  });

  describe('bulkUpdateActiveStatus', () => {
    it('should update active status for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockResult = { modifiedCount: 3 };

      User.updateMany.mockResolvedValue(mockResult);

      const result = await adminUserManagementService.bulkUpdateActiveStatus(
        userIds,
        false,
        mockAdminUser
      );

      expect(User.updateMany).toHaveBeenCalledWith(
        { _id: { $in: userIds } },
        { isActive: false }
      );
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'BULK_USER_STATUS_UPDATE',
          adminUserId: mockAdminUser._id
        })
      );
      expect(result.modifiedCount).toBe(3);
      expect(result.message).toContain('deactivated');
    });
  });

  describe('bulkRoleAssignment', () => {
    it('should add role to multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const mockResult = { modifiedCount: 2 };

      User.updateMany.mockResolvedValue(mockResult);

      const result = await adminUserManagementService.bulkRoleAssignment(
        userIds,
        UserRole.EDUCATOR,
        'add',
        mockAdminUser
      );

      expect(User.updateMany).toHaveBeenCalledWith(
        { _id: { $in: userIds } },
        { $addToSet: { secondaryRoles: UserRole.EDUCATOR } }
      );
      expect(result.message).toContain('added to');
    });

    it('should remove role from multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const mockResult = { modifiedCount: 2 };

      User.updateMany.mockResolvedValue(mockResult);

      const result = await adminUserManagementService.bulkRoleAssignment(
        userIds,
        UserRole.EDUCATOR,
        'remove',
        mockAdminUser
      );

      expect(User.updateMany).toHaveBeenCalledWith(
        { _id: { $in: userIds } },
        { $pull: { secondaryRoles: UserRole.EDUCATOR } }
      );
      expect(result.message).toContain('removed from');
    });

    it('should throw error for invalid operation', async () => {
      await expect(adminUserManagementService.bulkRoleAssignment(
        ['user-1'],
        UserRole.EDUCATOR,
        'invalid',
        mockAdminUser
      )).rejects.toThrow('Invalid operation. Use "add" or "remove"');
    });
  });

  describe('getUserStatistics', () => {
    it('should return comprehensive user statistics', async () => {
      User.countDocuments
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(95)  // activeUsers
        .mockResolvedValueOnce(80)  // verifiedUsers
        .mockResolvedValueOnce(15); // recentUsers

      User.aggregate
        .mockResolvedValueOnce([
          { _id: 'student', count: 70 },
          { _id: 'educator', count: 25 },
          { _id: 'admin', count: 5 }
        ])
        .mockResolvedValueOnce([
          { _id: 'medicine', count: 40 },
          { _id: 'nursing', count: 35 },
          { _id: 'pharmacy', count: 25 }
        ]);

      const result = await adminUserManagementService.getUserStatistics();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(95);
      expect(result.inactiveUsers).toBe(5);
      expect(result.verifiedUsers).toBe(80);
      expect(result.unverifiedUsers).toBe(20);
      expect(result.recentUsers).toBe(15);
      expect(result.usersByRole.student).toBe(70);
      expect(result.usersByDiscipline.medicine).toBe(40);
    });
  });

  describe('resetUserPassword', () => {
    it('should reset user password successfully', async () => {
      const mockUser = {
        _id: 'user-1',
        username: 'testuser',
        password: 'oldPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await adminUserManagementService.resetUserPassword(
        'user-1',
        'newPassword123',
        mockAdminUser
      );

      expect(mockUser.password).toBe('newPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'PASSWORD_RESET_BY_ADMIN',
          adminUserId: mockAdminUser._id
        })
      );
      expect(result).toBe(true);
    });

    it('should throw error for weak password', async () => {
      const mockUser = { _id: 'user-1', username: 'testuser' };
      User.findById.mockResolvedValue(mockUser);

      await expect(adminUserManagementService.resetUserPassword(
        'user-1',
        '123',
        mockAdminUser
      )).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('exportUsers', () => {
    it('should export users to CSV format', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find.mockReturnValue(mockQuery);

      const result = await adminUserManagementService.exportUsers({}, mockAdminUser);

      expect(typeof result).toBe('string');
      expect(result).toContain('username,email,primaryRole');
      expect(result).toContain('student1,student1@example.com');
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'USERS_EXPORTED',
          adminUserId: mockAdminUser._id
        })
      );
    });
  });

  describe('convertUsersToCSV', () => {
    it('should convert users array to CSV format', () => {
      const result = adminUserManagementService.convertUsersToCSV(mockUsers);

      expect(result).toContain('username,email,primaryRole');
      expect(result).toContain('"student1","student1@example.com","student"');
      expect(result).toContain('"educator1","educator1@example.com","educator"');
    });

    it('should handle empty users array', () => {
      const result = adminUserManagementService.convertUsersToCSV([]);

      expect(result).toContain('username,email,primaryRole');
      expect(result.split('\n')).toHaveLength(1); // Only header
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in getUsers', async () => {
      User.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(adminUserManagementService.getUsers())
        .rejects.toThrow('Failed to retrieve users');
    });

    it('should handle save errors in createUser', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        firstName: 'New',
        lastName: 'User',
        institution: 'Test University'
      };

      User.findOne.mockResolvedValue(null);

      const mockUser = {
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      User.mockImplementation(() => mockUser);

      await expect(adminUserManagementService.createUser(userData, mockAdminUser))
        .rejects.toThrow('Save failed');
    });
  });
});