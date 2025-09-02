import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import userRoutes from '../userRoutes.js';

// Mock the UserRegistrationService
jest.mock('../../services/UserRegistrationService.js', () => ({
  default: {
    registerUser: jest.fn(),
    completeProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updatePreferences: jest.fn(),
    changePassword: jest.fn(),
    getRegistrationStats: jest.fn()
  }
}));

// Mock the RBAC middleware
jest.mock('../../middleware/rbacMiddleware.js', () => ({
  requireOwnData: jest.fn(() => (req, res, next) => next()),
  populateUser: jest.fn(() => (req, res, next) => next()),
  anyAuthenticated: jest.fn(() => (req, res, next) => next()),
  adminOnly: jest.fn(() => (req, res, next) => next())
}));

// Mock the User model
jest.mock('../../models/UserModel.js', () => ({
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

import userRegistrationService from '../../services/UserRegistrationService.js';

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const mockResult = {
        success: true,
        message: 'User registered successfully',
        user: { id: 'user-id', username: 'testuser' },
        token: 'jwt-token',
        profileComplete: false
      };

      userRegistrationService.registerUser.mockResolvedValue(mockResult);

      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        discipline: 'medicine',
        firstName: 'Test',
        lastName: 'User',
        institution: 'Test University'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(registrationData)
        .expect(201);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.registerUser).toHaveBeenCalledWith(registrationData);
    });

    it('should return 400 for validation errors', async () => {
      userRegistrationService.registerUser.mockRejectedValue(new Error('Username is required'));

      const response = await request(app)
        .post('/api/users/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username is required');
    });

    it('should return 400 for duplicate user errors', async () => {
      userRegistrationService.registerUser.mockRejectedValue(new Error('Username already exists'));

      const response = await request(app)
        .post('/api/users/register')
        .send({ username: 'existing' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists');
    });

    it('should return 500 for server errors', async () => {
      userRegistrationService.registerUser.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/users/register')
        .send({ username: 'testuser' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Registration failed. Please try again.');
    });
  });

  describe('POST /api/users/:userId/complete-profile', () => {
    it('should complete user profile successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Profile completed successfully',
        user: { id: 'user-id' },
        profileComplete: true
      };

      userRegistrationService.completeProfile.mockResolvedValue(mockResult);

      const profileData = {
        specialization: 'Cardiology',
        yearOfStudy: 3
      };

      const response = await request(app)
        .post('/api/users/user-id/complete-profile')
        .send(profileData)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.completeProfile).toHaveBeenCalledWith('user-id', profileData);
    });

    it('should return 404 for user not found', async () => {
      userRegistrationService.completeProfile.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .post('/api/users/invalid-id/complete-profile')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/users/:userId/profile', () => {
    it('should get user profile successfully', async () => {
      const mockResult = {
        success: true,
        user: { id: 'user-id', username: 'testuser' },
        profileComplete: true
      };

      userRegistrationService.getProfile.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/users/user-id/profile')
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.getProfile).toHaveBeenCalledWith('user-id');
    });

    it('should return 404 for user not found', async () => {
      userRegistrationService.getProfile.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get('/api/users/invalid-id/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/:userId/profile', () => {
    it('should update user profile successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Profile updated successfully',
        user: { id: 'user-id' }
      };

      userRegistrationService.updateProfile.mockResolvedValue(mockResult);

      const updateData = {
        firstName: 'Updated',
        specialization: 'Neurology'
      };

      const response = await request(app)
        .put('/api/users/user-id/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.updateProfile).toHaveBeenCalledWith('user-id', updateData);
    });

    it('should return 400 for validation errors', async () => {
      userRegistrationService.updateProfile.mockRejectedValue(new Error('Invalid email format'));

      const response = await request(app)
        .put('/api/users/user-id/profile')
        .send({ email: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email format');
    });
  });

  describe('PUT /api/users/:userId/preferences', () => {
    it('should update user preferences successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Preferences updated successfully',
        preferences: { learningStyle: 'visual' }
      };

      userRegistrationService.updatePreferences.mockResolvedValue(mockResult);

      const preferences = {
        learningStyle: 'visual',
        notifications: { email: true }
      };

      const response = await request(app)
        .put('/api/users/user-id/preferences')
        .send(preferences)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.updatePreferences).toHaveBeenCalledWith('user-id', preferences);
    });

    it('should return 400 for invalid preferences', async () => {
      userRegistrationService.updatePreferences.mockRejectedValue(new Error('Invalid learning style'));

      const response = await request(app)
        .put('/api/users/user-id/preferences')
        .send({ learningStyle: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid learning style');
    });
  });

  describe('PUT /api/users/:userId/password', () => {
    it('should change password successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Password changed successfully'
      };

      userRegistrationService.changePassword.mockResolvedValue(mockResult);

      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123'
      };

      const response = await request(app)
        .put('/api/users/user-id/password')
        .send(passwordData)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(userRegistrationService.changePassword).toHaveBeenCalledWith(
        'user-id',
        'oldPassword',
        'newPassword123'
      );
    });

    it('should return 400 for missing passwords', async () => {
      const response = await request(app)
        .put('/api/users/user-id/password')
        .send({ currentPassword: 'old' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password and new password are required');
    });

    it('should return 400 for incorrect current password', async () => {
      userRegistrationService.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      const response = await request(app)
        .put('/api/users/user-id/password')
        .send({
          currentPassword: 'wrong',
          newPassword: 'newPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });
  });

  describe('GET /api/users/disciplines', () => {
    it('should return available healthcare disciplines', async () => {
      const response = await request(app)
        .get('/api/users/disciplines')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.disciplines).toHaveLength(5);
      expect(response.body.disciplines[0]).toHaveProperty('value');
      expect(response.body.disciplines[0]).toHaveProperty('label');
    });
  });

  describe('GET /api/users/roles', () => {
    it('should return available user roles', async () => {
      const response = await request(app)
        .get('/api/users/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.roles).toHaveLength(3);
      expect(response.body.roles[0]).toHaveProperty('value');
      expect(response.body.roles[0]).toHaveProperty('label');
    });
  });

  describe('GET /api/users/registration-config', () => {
    it('should return registration form configuration', async () => {
      const response = await request(app)
        .get('/api/users/registration-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.config).toHaveProperty('disciplines');
      expect(response.body.config).toHaveProperty('roles');
      expect(response.body.config).toHaveProperty('competencyLevels');
      expect(response.body.config).toHaveProperty('learningStyles');
      expect(response.body.config).toHaveProperty('difficultyPreferences');
      
      // Check that each config section has proper structure
      expect(response.body.config.disciplines[0]).toHaveProperty('value');
      expect(response.body.config.disciplines[0]).toHaveProperty('label');
      expect(response.body.config.disciplines[0]).toHaveProperty('description');
    });
  });

  describe('GET /api/users/admin/stats', () => {
    it('should return registration statistics for admin', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 95,
        verifiedUsers: 80,
        usersByRole: { student: 70, educator: 25, admin: 5 },
        usersByDiscipline: { medicine: 40, nursing: 35, pharmacy: 25 }
      };

      userRegistrationService.getRegistrationStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/users/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(mockStats);
      expect(userRegistrationService.getRegistrationStats).toHaveBeenCalled();
    });

    it('should return 500 for stats retrieval error', async () => {
      userRegistrationService.getRegistrationStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/admin/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to retrieve statistics');
    });
  });

  describe('GET /api/users/:userId/profile-wizard', () => {
    it('should return profile wizard steps', async () => {
      const mockProfile = {
        success: true,
        user: {
          profile: {
            firstName: 'Test',
            lastName: 'User',
            institution: 'Test University',
            preferences: {
              learningStyle: 'visual',
              difficultyPreference: 'intermediate'
            }
          },
          competencies: [
            { competencyId: 'COMP001', competencyName: 'Test Competency' }
          ]
        },
        profileComplete: false
      };

      userRegistrationService.getProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/users/user-id/profile-wizard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.steps).toHaveLength(4);
      expect(response.body.overallProgress).toBeDefined();
      expect(response.body.profileComplete).toBe(false);
      
      // Check step structure
      expect(response.body.steps[0]).toHaveProperty('id');
      expect(response.body.steps[0]).toHaveProperty('title');
      expect(response.body.steps[0]).toHaveProperty('description');
      expect(response.body.steps[0]).toHaveProperty('completed');
      expect(response.body.steps[0]).toHaveProperty('fields');
    });

    it('should calculate correct completion status for steps', async () => {
      const mockProfile = {
        success: true,
        user: {
          profile: {
            firstName: 'Test',
            lastName: 'User',
            institution: 'Test University',
            specialization: 'Cardiology',
            preferences: {
              learningStyle: 'visual',
              difficultyPreference: 'intermediate'
            }
          },
          competencies: []
        },
        profileComplete: true
      };

      userRegistrationService.getProfile.mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/users/user-id/profile-wizard')
        .expect(200);

      const steps = response.body.steps;
      
      // Basic info should be completed (has firstName, lastName, institution)
      expect(steps.find(s => s.id === 'basic-info').completed).toBe(true);
      
      // Academic info should be completed (has specialization)
      expect(steps.find(s => s.id === 'academic-info').completed).toBe(true);
      
      // Preferences should be completed (has learningStyle and difficultyPreference)
      expect(steps.find(s => s.id === 'preferences').completed).toBe(true);
      
      // Competencies should not be completed (empty array)
      expect(steps.find(s => s.id === 'competencies').completed).toBe(false);
    });

    it('should return 500 for profile wizard error', async () => {
      userRegistrationService.getProfile.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/user-id/profile-wizard')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to retrieve profile wizard information');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      userRegistrationService.registerUser.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/users/register')
        .send({ username: 'test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Registration failed. Please try again.');
    });

    it('should handle service unavailable errors', async () => {
      userRegistrationService.getProfile.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/users/user-id/profile')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to retrieve profile. Please try again.');
    });
  });
});