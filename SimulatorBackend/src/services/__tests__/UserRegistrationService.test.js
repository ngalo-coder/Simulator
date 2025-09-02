import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserRegistrationService } from '../UserRegistrationService.js';
import { UserRole, HealthcareDiscipline } from '../../models/UserModel.js';

// Mock the User model
jest.mock('../../models/UserModel.js', () => ({
  default: jest.fn().mockImplementation((userData) => ({
    ...userData,
    _id: 'mock-user-id',
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: 'mock-user-id',
      username: userData.username,
      email: userData.email,
      primaryRole: userData.primaryRole,
      discipline: userData.discipline,
      profile: userData.profile,
      competencies: userData.competencies || []
    }),
    addCompetency: jest.fn(),
    addPermission: jest.fn(),
    comparePassword: jest.fn()
  })),
  findById: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
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

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token')
}));

import User from '../../models/UserModel.js';
import jwt from 'jsonwebtoken';

describe('UserRegistrationService', () => {
  let userRegistrationService;
  let mockUserData;

  beforeEach(() => {
    jest.clearAllMocks();
    userRegistrationService = new UserRegistrationService();
    
    mockUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      primaryRole: UserRole.STUDENT,
      discipline: HealthcareDiscipline.MEDICINE,
      firstName: 'Test',
      lastName: 'User',
      institution: 'Test University',
      specialization: 'Internal Medicine',
      yearOfStudy: 3
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      
      const result = await userRegistrationService.registerUser(mockUserData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.user).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.profileComplete).toBeDefined();
      
      // Verify User constructor was called with correct data
      expect(User).toHaveBeenCalledWith(expect.objectContaining({
        username: 'testuser',
        email: 'test@example.com',
        primaryRole: UserRole.STUDENT,
        discipline: HealthcareDiscipline.MEDICINE,
        profile: expect.objectContaining({
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        })
      }));
    });

    it('should throw error if username already exists', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser' });
      
      await expect(userRegistrationService.registerUser(mockUserData))
        .rejects.toThrow('Username already exists');
    });

    it('should throw error if email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' });
      
      await expect(userRegistrationService.registerUser(mockUserData))
        .rejects.toThrow('Email already exists');
    });

    it('should throw error for missing required fields', async () => {
      const incompleteData = { ...mockUserData };
      delete incompleteData.firstName;
      
      await expect(userRegistrationService.registerUser(incompleteData))
        .rejects.toThrow('firstName is required');
    });

    it('should throw error for invalid email format', async () => {
      const invalidEmailData = { ...mockUserData, email: 'invalid-email' };
      
      await expect(userRegistrationService.registerUser(invalidEmailData))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid username format', async () => {
      const invalidUsernameData = { ...mockUserData, username: 'test-user!' };
      
      await expect(userRegistrationService.registerUser(invalidUsernameData))
        .rejects.toThrow('Username can only contain letters and numbers');
    });

    it('should throw error for weak password', async () => {
      const weakPasswordData = { ...mockUserData, password: '123' };
      
      await expect(userRegistrationService.registerUser(weakPasswordData))
        .rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error for invalid discipline', async () => {
      const invalidDisciplineData = { ...mockUserData, discipline: 'invalid-discipline' };
      
      await expect(userRegistrationService.registerUser(invalidDisciplineData))
        .rejects.toThrow('Invalid healthcare discipline');
    });

    it('should throw error for invalid role', async () => {
      const invalidRoleData = { ...mockUserData, primaryRole: 'invalid-role' };
      
      await expect(userRegistrationService.registerUser(invalidRoleData))
        .rejects.toThrow('Invalid user role');
    });

    it('should add default competencies based on discipline', async () => {
      User.findOne.mockResolvedValue(null);
      const mockUser = new User(mockUserData);
      
      await userRegistrationService.registerUser(mockUserData);
      
      expect(mockUser.addCompetency).toHaveBeenCalled();
    });

    it('should generate JWT token with correct payload', async () => {
      User.findOne.mockResolvedValue(null);
      
      await userRegistrationService.registerUser(mockUserData);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mock-user-id',
          username: 'testuser',
          email: 'test@example.com',
          primaryRole: UserRole.STUDENT,
          discipline: HealthcareDiscipline.MEDICINE
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
    });
  });

  describe('Profile Completion', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = {
        _id: 'mock-user-id',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University',
          preferences: {
            toObject: jest.fn().mockReturnValue({
              language: 'en',
              learningStyle: 'visual'
            })
          }
        },
        competencies: [],
        addCompetency: jest.fn(),
        addPermission: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'mock-user-id',
          profile: mockUser.profile
        })
      };
    });

    it('should complete user profile successfully', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const profileData = {
        specialization: 'Cardiology',
        yearOfStudy: 4,
        competencyLevel: 'competent',
        preferences: {
          learningStyle: 'kinesthetic',
          difficultyPreference: 'intermediate'
        }
      };
      
      const result = await userRegistrationService.completeProfile('mock-user-id', profileData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile completed successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      User.findById.mockResolvedValue(null);
      
      await expect(userRegistrationService.completeProfile('invalid-id', {}))
        .rejects.toThrow('User not found');
    });

    it('should add competencies during profile completion', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const profileData = {
        competencies: [
          { competencyId: 'COMP001', competencyName: 'Test Competency', targetLevel: 3 }
        ]
      };
      
      await userRegistrationService.completeProfile('mock-user-id', profileData);
      
      expect(mockUser.addCompetency).toHaveBeenCalledWith(profileData.competencies[0]);
    });

    it('should add permissions during profile completion', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const profileData = {
        permissions: [
          { resource: 'test-resource', action: 'test-action', conditions: {} }
        ]
      };
      
      await userRegistrationService.completeProfile('mock-user-id', profileData);
      
      expect(mockUser.addPermission).toHaveBeenCalledWith(
        'test-resource',
        'test-action',
        {}
      );
    });
  });

  describe('Profile Update', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University',
          preferences: {
            toObject: jest.fn().mockReturnValue({
              language: 'en',
              learningStyle: 'visual'
            })
          }
        },
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: 'mock-user-id',
          email: 'test@example.com',
          profile: mockUser.profile
        })
      };
    });

    it('should update user profile successfully', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const updateData = {
        email: 'newemail@example.com',
        firstName: 'Updated',
        specialization: 'Neurology',
        preferences: {
          learningStyle: 'auditory'
        }
      };
      
      const result = await userRegistrationService.updateProfile('mock-user-id', updateData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(mockUser.email).toBe('newemail@example.com');
      expect(mockUser.profile.firstName).toBe('Updated');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const updateData = { email: 'invalid-email' };
      
      await expect(userRegistrationService.updateProfile('mock-user-id', updateData))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid year of study', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const updateData = { yearOfStudy: 15 };
      
      await expect(userRegistrationService.updateProfile('mock-user-id', updateData))
        .rejects.toThrow('Year of study must be between 1 and 10');
    });

    it('should throw error for invalid competency level', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const updateData = { competencyLevel: 'invalid-level' };
      
      await expect(userRegistrationService.updateProfile('mock-user-id', updateData))
        .rejects.toThrow('Invalid competency level');
    });
  });

  describe('Preferences Update', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = {
        _id: 'mock-user-id',
        profile: {
          preferences: {
            toObject: jest.fn().mockReturnValue({
              language: 'en',
              learningStyle: 'visual',
              notifications: { email: true }
            })
          }
        },
        save: jest.fn().mockResolvedValue(true)
      };
    });

    it('should update user preferences successfully', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const preferences = {
        learningStyle: 'kinesthetic',
        difficultyPreference: 'advanced',
        notifications: {
          email: false,
          push: true
        }
      };
      
      const result = await userRegistrationService.updatePreferences('mock-user-id', preferences);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Preferences updated successfully');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for invalid learning style', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const preferences = { learningStyle: 'invalid-style' };
      
      await expect(userRegistrationService.updatePreferences('mock-user-id', preferences))
        .rejects.toThrow('Invalid learning style');
    });

    it('should throw error for invalid difficulty preference', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const preferences = { difficultyPreference: 'invalid-difficulty' };
      
      await expect(userRegistrationService.updatePreferences('mock-user-id', preferences))
        .rejects.toThrow('Invalid difficulty preference');
    });

    it('should throw error for invalid notification setting', async () => {
      User.findById.mockResolvedValue(mockUser);
      
      const preferences = {
        notifications: { email: 'not-boolean' }
      };
      
      await expect(userRegistrationService.updatePreferences('mock-user-id', preferences))
        .rejects.toThrow('Notification email must be a boolean');
    });
  });

  describe('Password Change', () => {
    let mockUser;

    beforeEach(() => {
      mockUser = {
        _id: 'mock-user-id',
        password: 'old-hashed-password',
        comparePassword: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
    });

    it('should change password successfully', async () => {
      User.findById.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      
      const result = await userRegistrationService.changePassword(
        'mock-user-id',
        'currentPassword',
        'newPassword123'
      );
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('currentPassword');
      expect(mockUser.password).toBe('newPassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for incorrect current password', async () => {
      User.findById.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);
      
      await expect(userRegistrationService.changePassword(
        'mock-user-id',
        'wrongPassword',
        'newPassword123'
      )).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for weak new password', async () => {
      User.findById.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      
      await expect(userRegistrationService.changePassword(
        'mock-user-id',
        'currentPassword',
        '123'
      )).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('Profile Retrieval', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        _id: 'mock-user-id',
        toObject: jest.fn().mockReturnValue({
          _id: 'mock-user-id',
          username: 'testuser',
          profile: { firstName: 'Test', lastName: 'User' }
        })
      };
      
      User.findById.mockResolvedValue(mockUser);
      
      const result = await userRegistrationService.getProfile('mock-user-id');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.profileComplete).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      User.findById.mockResolvedValue(null);
      
      await expect(userRegistrationService.getProfile('invalid-id'))
        .rejects.toThrow('User not found');
    });
  });

  describe('Registration Statistics', () => {
    it('should get registration statistics successfully', async () => {
      User.countDocuments
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(95)  // activeUsers
        .mockResolvedValueOnce(80); // verifiedUsers
      
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
      
      const stats = await userRegistrationService.getRegistrationStats();
      
      expect(stats.totalUsers).toBe(100);
      expect(stats.activeUsers).toBe(95);
      expect(stats.verifiedUsers).toBe(80);
      expect(stats.usersByRole.student).toBe(70);
      expect(stats.usersByDiscipline.medicine).toBe(40);
    });
  });

  describe('Utility Methods', () => {
    it('should check if profile is complete', () => {
      const completeUser = {
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        },
        discipline: 'medicine'
      };
      
      const incompleteUser = {
        profile: {
          firstName: 'Test',
          lastName: '',
          institution: 'Test University'
        },
        discipline: 'medicine'
      };
      
      expect(userRegistrationService.isProfileComplete(completeUser)).toBe(true);
      expect(userRegistrationService.isProfileComplete(incompleteUser)).toBe(false);
    });

    it('should get default preferences', () => {
      const preferences = userRegistrationService.getDefaultPreferences();
      
      expect(preferences.language).toBe('en');
      expect(preferences.learningStyle).toBe('visual');
      expect(preferences.notifications.email).toBe(true);
    });

    it('should add default competencies for each discipline', () => {
      const mockUser = {
        addCompetency: jest.fn()
      };
      
      userRegistrationService.addDefaultCompetencies(mockUser, HealthcareDiscipline.MEDICINE);
      
      expect(mockUser.addCompetency).toHaveBeenCalledTimes(4); // Medicine has 4 default competencies
      expect(mockUser.addCompetency).toHaveBeenCalledWith(
        expect.objectContaining({
          competencyId: expect.stringMatching(/^MED\d+$/),
          competencyName: expect.any(String),
          targetLevel: expect.any(Number)
        })
      );
    });
  });

  describe('Validation Methods', () => {
    it('should validate registration data correctly', () => {
      const validData = { ...mockUserData };
      
      expect(() => userRegistrationService.validateRegistrationData(validData))
        .not.toThrow();
    });

    it('should validate profile update data correctly', () => {
      const validUpdateData = {
        email: 'newemail@example.com',
        yearOfStudy: 3,
        competencyLevel: 'competent'
      };
      
      expect(() => userRegistrationService.validateProfileUpdate(validUpdateData))
        .not.toThrow();
    });

    it('should validate preferences correctly', () => {
      const validPreferences = {
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        notifications: {
          email: true,
          push: false
        }
      };
      
      expect(() => userRegistrationService.validatePreferences(validPreferences))
        .not.toThrow();
    });
  });
});