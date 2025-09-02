import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  optionalAuth,
  requireRoles,
  requireDiscipline,
  sessionManager,
  authenticateApiKey,
  rateLimiter,
  mockAuth
} from '../authMiddleware.js';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/UserModel.js', () => ({
  default: {
    findById: jest.fn()
  }
}));
jest.mock('../../services/AuditLoggerService.js', () => ({
  default: {
    logAuthEvent: jest.fn()
  }
}));

import User from '../../models/UserModel.js';
import auditLogger from '../../services/AuditLoggerService.js';

describe('Authentication Middleware', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: 'user-id-123',
      username: 'testuser',
      email: 'test@example.com',
      primaryRole: 'student',
      discipline: 'medicine',
      isActive: true,
      getAllRoles: jest.fn().mockReturnValue(['student']),
      updateLastLogin: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: 'user-id-123',
        username: 'testuser',
        primaryRole: 'student'
      })
    };

    req = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      get: jest.fn().mockReturnValue('test-user-agent')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Set up environment
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid JWT token', async () => {
      const token = 'valid-jwt-token';
      const decodedPayload = { userId: 'user-id-123' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedPayload);
      User.findById.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(User.findById).toHaveBeenCalledWith('user-id-123');
      expect(req.user).toBe(mockUser);
      expect(req.token).toBe(token);
      expect(req.tokenPayload).toBe(decodedPayload);
      expect(mockUser.updateLastLogin).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_SUCCESS',
          userId: 'user-id-123',
          username: 'testuser'
        })
      );
      expect(next).toHaveBeenCalled();
    });

    it('should reject request with no token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED',
          reason: 'NO_TOKEN'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED',
          reason: 'TOKEN_INVALID'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED',
          reason: 'TOKEN_EXPIRED'
        })
      );
    });

    it('should reject token for non-existent user', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'non-existent-user' });
      User.findById.mockResolvedValue(null);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token - user not found'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED',
          reason: 'USER_NOT_FOUND'
        })
      );
    });

    it('should reject token for inactive user', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      mockUser.isActive = false;
      User.findById.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED',
          reason: 'USER_INACTIVE'
        })
      );
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate when valid token is provided', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      User.findById.mockResolvedValue(mockUser);

      await optionalAuth(req, res, next);

      expect(req.user).toBe(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(req.token).toBeNull();
      expect(req.tokenPayload).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRoles', () => {
    beforeEach(() => {
      req.user = mockUser;
    });

    it('should allow access when user has required role', async () => {
      const middleware = requireRoles(['student', 'educator']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTHORIZATION_SUCCESS'
        })
      );
    });

    it('should deny access when user lacks required roles', async () => {
      const middleware = requireRoles(['admin']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required roles: admin'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTHORIZATION_FAILED',
          reason: 'INSUFFICIENT_ROLES'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', async () => {
      req.user = null;
      const middleware = requireRoles(['student']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTHORIZATION_FAILED',
          reason: 'NOT_AUTHENTICATED'
        })
      );
    });
  });

  describe('requireDiscipline', () => {
    beforeEach(() => {
      req.user = mockUser;
    });

    it('should allow access when user has required discipline', async () => {
      const middleware = requireDiscipline(['medicine', 'nursing']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user has different discipline', async () => {
      const middleware = requireDiscipline(['nursing', 'pharmacy']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required disciplines: nursing, pharmacy'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'DISCIPLINE_ACCESS_DENIED'
        })
      );
    });

    it('should deny access when user is not authenticated', async () => {
      req.user = null;
      const middleware = requireDiscipline(['medicine']);

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('sessionManager', () => {
    beforeEach(() => {
      req.user = mockUser;
    });

    describe('createSession', () => {
      it('should create session for authenticated user', async () => {
        await sessionManager.createSession(req, res, next);

        expect(req.session).toBeDefined();
        expect(req.session.userId).toBe('user-id-123');
        expect(req.session.username).toBe('testuser');
        expect(req.session.roles).toEqual(['student']);
        expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'SESSION_CREATED'
          })
        );
        expect(next).toHaveBeenCalled();
      });

      it('should continue without creating session when user not authenticated', async () => {
        req.user = null;

        await sessionManager.createSession(req, res, next);

        expect(req.session).toBeUndefined();
        expect(next).toHaveBeenCalled();
      });
    });

    describe('updateActivity', () => {
      it('should update session activity', async () => {
        req.session = { lastActivity: new Date('2023-01-01') };

        await sessionManager.updateActivity(req, res, next);

        expect(req.session.lastActivity).not.toEqual(new Date('2023-01-01'));
        expect(next).toHaveBeenCalled();
      });
    });

    describe('validateTimeout', () => {
      it('should allow access when session is within timeout', async () => {
        req.session = { lastActivity: new Date() };
        const middleware = sessionManager.validateTimeout(60);

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should deny access when session has timed out', async () => {
        const oldDate = new Date();
        oldDate.setHours(oldDate.getHours() - 2); // 2 hours ago
        req.session = { lastActivity: oldDate };
        const middleware = sessionManager.validateTimeout(60); // 60 minutes timeout

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Session has timed out. Please log in again.'
        });
        expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'SESSION_TIMEOUT'
          })
        );
      });
    });
  });

  describe('authenticateApiKey', () => {
    beforeEach(() => {
      process.env.VALID_API_KEYS = 'key1,key2,key3';
    });

    it('should authenticate valid API key', async () => {
      req.headers['x-api-key'] = 'key1';

      await authenticateApiKey(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.isService).toBe(true);
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'API_KEY_AUTH_SUCCESS'
        })
      );
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid API key', async () => {
      req.headers['x-api-key'] = 'invalid-key';

      await authenticateApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid API key'
      });
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'API_KEY_INVALID'
        })
      );
    });

    it('should reject request without API key', async () => {
      await authenticateApiKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'API key is required'
      });
    });
  });

  describe('rateLimiter', () => {
    it('should allow requests within rate limit', async () => {
      req.user = mockUser;
      const middleware = rateLimiter(10, 15);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': 10,
          'X-RateLimit-Remaining': 9
        })
      );
    });

    it('should deny requests exceeding rate limit', async () => {
      req.user = mockUser;
      const middleware = rateLimiter(1, 15); // Very low limit for testing

      // First request should pass
      await middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset mocks for second request
      jest.clearAllMocks();

      // Second request should be rate limited
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Too many requests. Please try again later.'
        })
      );
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'RATE_LIMIT_EXCEEDED'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should use IP address when user is not authenticated', async () => {
      req.user = null;
      const middleware = rateLimiter(10, 15);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('mockAuth', () => {
    it('should set mock user in development environment', () => {
      process.env.NODE_ENV = 'development';
      const middleware = mockAuth();

      middleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.username).toBe('mockuser');
      expect(next).toHaveBeenCalled();
    });

    it('should set custom mock user', () => {
      process.env.NODE_ENV = 'test';
      const customMockUser = { username: 'custom', role: 'admin' };
      const middleware = mockAuth(customMockUser);

      middleware(req, res, next);

      expect(req.user).toBe(customMockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should not set mock user in production environment', () => {
      process.env.NODE_ENV = 'production';
      const middleware = mockAuth();

      middleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in authenticateToken', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      User.findById.mockRejectedValue(new Error('Database error'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(auditLogger.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'AUTH_FAILED'
        })
      );
    });

    it('should handle audit logging errors gracefully', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-id-123' });
      User.findById.mockResolvedValue(mockUser);
      auditLogger.logAuthEvent.mockRejectedValue(new Error('Audit error'));

      await authenticateToken(req, res, next);

      // Should still proceed despite audit logging error
      expect(next).toHaveBeenCalled();
      expect(req.user).toBe(mockUser);
    });
  });
});