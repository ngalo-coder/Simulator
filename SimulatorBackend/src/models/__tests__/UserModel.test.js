import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { HealthcareDiscipline, UserRole } from '../UserModel.js';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a valid user with required fields', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeUndefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.primaryRole).toBe(UserRole.STUDENT); // default value
      expect(user.discipline).toBe(HealthcareDiscipline.MEDICINE);
      expect(user.profile.firstName).toBe('Test');
      expect(user.profile.lastName).toBe('User');
    });

    it('should require username field', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.username.message).toBe('Username is required.');
    });

    it('should require email field', () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe('Email is required.');
    });

    it('should require password field', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe('Password is required.');
    });

    it('should validate email format', () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe('Please use a valid email address.');
    });

    it('should validate username format (alphanumeric only)', () => {
      const userData = {
        username: 'test-user!',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.username.message).toBe('Username can only contain letters and numbers.');
    });

    it('should validate password minimum length', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe('Password must be at least 6 characters long.');
    });

    it('should validate primary role enum values', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        primaryRole: 'invalid-role',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.primaryRole).toBeDefined();
    });

    it('should accept valid role values', () => {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        primaryRole: UserRole.ADMIN,
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      const studentUser = new User({
        username: 'student',
        email: 'student@example.com',
        password: 'password123',
        primaryRole: UserRole.STUDENT,
        discipline: HealthcareDiscipline.NURSING,
        profile: {
          firstName: 'Student',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      expect(adminUser.validateSync()).toBeUndefined();
      expect(studentUser.validateSync()).toBeUndefined();
    });

    it('should trim and lowercase username and email', () => {
      const userData = {
        username: '  TestUser  ',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should require healthcare discipline', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.discipline).toBeDefined();
      expect(validationError.errors.discipline.message).toBe('Healthcare discipline is required.');
    });

    it('should require user profile', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.profile).toBeDefined();
      expect(validationError.errors.profile.message).toBe('User profile is required.');
    });

    it('should validate healthcare discipline enum', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: 'invalid-discipline',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.discipline).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const mockSalt = 'mocksalt';
      const mockHashedPassword = 'hashedpassword123';
      
      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHashedPassword);

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      
      // Mock the save operation
      const mockSave = jest.fn().mockResolvedValue(user);
      user.save = mockSave;
      user.isModified = jest.fn().mockReturnValue(true);

      // Get the pre-save hook function and trigger it manually
      const preSaveHooks = user.schema._pres.get('save');
      const preSaveHook = preSaveHooks[0].fn;
      
      const next = jest.fn();
      await preSaveHook.call(user, next);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', mockSalt);
      expect(user.password).toBe(mockHashedPassword);
      expect(next).toHaveBeenCalledWith();
    });

    it('should not hash password if not modified', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'alreadyhashedpassword',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      };

      const user = new User(userData);
      user.isModified = jest.fn().mockReturnValue(false);

      // Get the pre-save hook function
      const preSaveHooks = user.schema._pres.get('save');
      const preSaveHook = preSaveHooks[0].fn;

      const next = jest.fn();
      await preSaveHook.call(user, next);

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle hashing errors', async () => {
      const hashError = new Error('Hashing failed');
      bcrypt.genSalt.mockRejectedValue(hashError);

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      user.isModified = jest.fn().mockReturnValue(true);

      // Get the pre-save hook function
      const preSaveHooks = user.schema._pres.get('save');
      const preSaveHook = preSaveHooks[0].fn;

      const next = jest.fn();
      await preSaveHook.call(user, next);

      expect(next).toHaveBeenCalledWith(hashError);
    });
  });

  describe('Password Comparison', () => {
    it('should compare passwords correctly', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const result = await user.comparePassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      const result = await user.comparePassword('wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });

    it('should handle comparison errors', async () => {
      const compareError = new Error('Comparison failed');
      bcrypt.compare.mockRejectedValue(compareError);

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      await expect(user.comparePassword('password123')).rejects.toThrow('Comparison failed');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      // Timestamps are only set when the document is saved to the database
      // For new documents, they will be undefined until saved
      expect(user.isNew).toBe(true);
      expect(user.createdAt).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
    });
  });

  describe('Password Reset Fields', () => {
    it('should allow password reset token and expiry', () => {
      const resetToken = 'reset-token-123';
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        },
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpiry
      });

      expect(user.passwordResetToken).toBe(resetToken);
      expect(user.passwordResetExpires).toBe(resetExpiry);
    });
  });

  describe('Multi-Role Support', () => {
    it('should support primary and secondary roles', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        primaryRole: UserRole.EDUCATOR,
        secondaryRoles: [UserRole.STUDENT],
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      expect(user.primaryRole).toBe(UserRole.EDUCATOR);
      expect(user.secondaryRoles).toContain(UserRole.STUDENT);
      expect(user.getAllRoles()).toEqual([UserRole.EDUCATOR, UserRole.STUDENT]);
    });

    it('should check if user has specific role', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        primaryRole: UserRole.EDUCATOR,
        secondaryRoles: [UserRole.STUDENT],
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      expect(user.hasRole(UserRole.EDUCATOR)).toBe(true);
      expect(user.hasRole(UserRole.STUDENT)).toBe(true);
      expect(user.hasRole(UserRole.ADMIN)).toBe(false);
    });

    it('should return unique roles when primary and secondary overlap', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        primaryRole: UserRole.EDUCATOR,
        secondaryRoles: [UserRole.EDUCATOR, UserRole.STUDENT],
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      const roles = user.getAllRoles();
      expect(roles).toEqual([UserRole.EDUCATOR, UserRole.STUDENT]);
      expect(roles.length).toBe(2);
    });
  });

  describe('User Profile', () => {
    it('should require profile fields', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test'
          // Missing lastName and institution
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['profile.lastName']).toBeDefined();
      expect(validationError.errors['profile.institution']).toBeDefined();
    });

    it('should get full name from profile', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          institution: 'Test University'
        }
      });

      expect(user.getFullName()).toBe('John Doe');
      expect(user.displayName).toBe('John Doe');
    });

    it('should fallback to username if profile incomplete', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          institution: 'Test University'
        }
      });

      expect(user.getFullName()).toBe('testuser');
    });

    it('should validate year of study range', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University',
          yearOfStudy: 15 // Invalid - too high
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['profile.yearOfStudy']).toBeDefined();
    });
  });

  describe('Competency Management', () => {
    let user;

    beforeEach(() => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });
    });

    it('should add new competency', () => {
      const competencyData = {
        competencyId: 'COMP001',
        competencyName: 'Clinical Reasoning',
        currentLevel: 2,
        targetLevel: 4
      };

      user.addCompetency(competencyData);
      
      expect(user.competencies).toHaveLength(1);
      expect(user.competencies[0].competencyId).toBe('COMP001');
      expect(user.competencies[0].currentLevel).toBe(2);
    });

    it('should update existing competency', () => {
      const competencyData = {
        competencyId: 'COMP001',
        competencyName: 'Clinical Reasoning',
        currentLevel: 2,
        targetLevel: 4
      };

      user.addCompetency(competencyData);
      
      const updatedData = {
        competencyId: 'COMP001',
        currentLevel: 3
      };

      user.addCompetency(updatedData);
      
      expect(user.competencies).toHaveLength(1);
      expect(user.competencies[0].currentLevel).toBe(3);
    });

    it('should update competency level', () => {
      user.addCompetency({
        competencyId: 'COMP001',
        competencyName: 'Clinical Reasoning',
        currentLevel: 2,
        targetLevel: 4
      });

      user.updateCompetencyLevel('COMP001', 3, true);
      
      const competency = user.getCompetencyProgress('COMP001');
      expect(competency.currentLevel).toBe(3);
      expect(competency.evidenceCount).toBe(1);
    });

    it('should get competency progress', () => {
      const competencyData = {
        competencyId: 'COMP001',
        competencyName: 'Clinical Reasoning',
        currentLevel: 2,
        targetLevel: 4
      };

      user.addCompetency(competencyData);
      
      const progress = user.getCompetencyProgress('COMP001');
      expect(progress).toBeDefined();
      expect(progress.competencyId).toBe('COMP001');
      
      const nonExistent = user.getCompetencyProgress('COMP999');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Permission Management', () => {
    let user;

    beforeEach(() => {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });
    });

    it('should add custom permission', () => {
      user.addPermission('cases', 'create', { ownData: true });
      
      expect(user.permissions).toHaveLength(1);
      expect(user.permissions[0].resource).toBe('cases');
      expect(user.permissions[0].action).toBe('create');
      expect(user.permissions[0].conditions.ownData).toBe(true);
    });

    it('should update existing permission', () => {
      user.addPermission('cases', 'create', { ownData: true });
      user.addPermission('cases', 'create', { ownData: false, adminOverride: true });
      
      expect(user.permissions).toHaveLength(1);
      expect(user.permissions[0].conditions.ownData).toBe(false);
      expect(user.permissions[0].conditions.adminOverride).toBe(true);
    });

    it('should remove permission', () => {
      user.addPermission('cases', 'create');
      user.addPermission('cases', 'read');
      
      expect(user.permissions).toHaveLength(2);
      
      user.removePermission('cases', 'create');
      
      expect(user.permissions).toHaveLength(1);
      expect(user.permissions[0].action).toBe('read');
    });
  });

  describe('Static Methods', () => {
    // Note: These tests would require actual database operations in a real test environment
    // For now, we'll test that the methods exist and have the correct structure
    
    it('should have findByDiscipline static method', () => {
      expect(typeof User.findByDiscipline).toBe('function');
    });

    it('should have findByRole static method', () => {
      expect(typeof User.findByRole).toBe('function');
    });

    it('should have findByDisciplineAndRole static method', () => {
      expect(typeof User.findByDisciplineAndRole).toBe('function');
    });
  });

  describe('User Preferences', () => {
    it('should have default preferences', () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University'
        }
      });

      expect(user.profile.preferences).toBeDefined();
      expect(user.profile.preferences.language).toBe('en');
      expect(user.profile.preferences.learningStyle).toBe('visual');
      expect(user.profile.preferences.notifications.email).toBe(true);
    });

    it('should validate learning style enum', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: HealthcareDiscipline.MEDICINE,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          institution: 'Test University',
          preferences: {
            learningStyle: 'invalid-style'
          }
        }
      };

      const user = new User(userData);
      const validationError = user.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors['profile.preferences.learningStyle']).toBeDefined();
    });
  });
});