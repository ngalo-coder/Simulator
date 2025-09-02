import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../authService.js';

// Mock jwt
jest.mock('jsonwebtoken');

// Mock logger
jest.mock('../../config/logger.js', () => ({
  warn: jest.fn(),
  error: jest.fn()
}));

describe('authService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a token with valid parameters', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '1h';
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken('user123', 'testuser', 'admin');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser', role: 'admin' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(mockToken);
    });

    it('should use default role when not provided', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken('user123', 'testuser');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser', role: 'user' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(mockToken);
    });

    it('should use default expiration when JWT_EXPIRES_IN not set', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.JWT_EXPIRES_IN;
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken('user123', 'testuser', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser', role: 'user' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        generateToken('user123', 'testuser', 'user');
      }).toThrow('JWT secret is missing.');

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should handle jwt.sign errors', () => {
      process.env.JWT_SECRET = 'test-secret';
      const signError = new Error('JWT signing failed');
      
      jwt.sign.mockImplementation(() => {
        throw signError;
      });

      expect(() => {
        generateToken('user123', 'testuser', 'user');
      }).toThrow('JWT signing failed');
    });

    it('should handle different user roles', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.sign.mockReturnValue(mockToken);

      const roles = ['user', 'admin', 'moderator'];
      
      roles.forEach(role => {
        generateToken('user123', 'testuser', role);
        
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: 'user123', username: 'testuser', role: role },
          'test-secret',
          { expiresIn: '1h' }
        );
      });
    });

    it('should handle special characters in username', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.sign.mockReturnValue(mockToken);

      const result = generateToken('user123', 'test.user+123', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'test.user+123', role: 'user' },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockPayload = { id: 'user123', username: 'testuser', role: 'user' };
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.verify.mockReturnValue(mockPayload);

      const result = verifyToken('valid.jwt.token');

      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret');
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const verifyError = new Error('Invalid token');
      
      jwt.verify.mockImplementation(() => {
        throw verifyError;
      });

      const result = verifyToken('invalid.jwt.token');

      expect(jwt.verify).toHaveBeenCalledWith('invalid.jwt.token', 'test-secret');
      expect(result).toBeNull();
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        verifyToken('some.jwt.token');
      }).toThrow('JWT secret is missing.');

      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should handle expired token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      const result = verifyToken('expired.jwt.token');

      expect(jwt.verify).toHaveBeenCalledWith('expired.jwt.token', 'test-secret');
      expect(result).toBeNull();
    });

    it('should handle malformed token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const malformedError = new Error('Malformed token');
      malformedError.name = 'JsonWebTokenError';
      
      jwt.verify.mockImplementation(() => {
        throw malformedError;
      });

      const result = verifyToken('malformed.token');

      expect(jwt.verify).toHaveBeenCalledWith('malformed.token', 'test-secret');
      expect(result).toBeNull();
    });

    it('should handle different token formats', () => {
      const mockPayload = { id: 'user123', username: 'testuser', role: 'admin' };
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.verify.mockReturnValue(mockPayload);

      const tokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'short.token.here',
        'very.long.token.with.multiple.segments.that.should.still.work'
      ];

      tokens.forEach(token => {
        const result = verifyToken(token);
        
        expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
        expect(result).toEqual(mockPayload);
      });
    });

    it('should preserve all payload properties', () => {
      const mockPayload = {
        id: 'user123',
        username: 'testuser',
        role: 'admin',
        iat: 1516239022,
        exp: 1516242622,
        customField: 'customValue'
      };
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.verify.mockReturnValue(mockPayload);

      const result = verifyToken('token.with.custom.fields');

      expect(result).toEqual(mockPayload);
      expect(result.customField).toBe('customValue');
      expect(result.iat).toBe(1516239022);
      expect(result.exp).toBe(1516242622);
    });
  });

  describe('Environment Configuration', () => {
    it('should use custom JWT_EXPIRES_IN when provided', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      process.env.JWT_EXPIRES_IN = '24h';
      
      jwt.sign.mockReturnValue(mockToken);

      generateToken('user123', 'testuser', 'user');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser', role: 'user' },
        'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should handle different expiration formats', () => {
      const mockToken = 'mock.jwt.token';
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.sign.mockReturnValue(mockToken);

      const expirationFormats = ['1h', '30m', '7d', '1y', '3600'];

      expirationFormats.forEach(expiration => {
        process.env.JWT_EXPIRES_IN = expiration;
        
        generateToken('user123', 'testuser', 'user');
        
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: 'user123', username: 'testuser', role: 'user' },
          'test-secret',
          { expiresIn: expiration }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty or null parameters in generateToken', () => {
      process.env.JWT_SECRET = 'test-secret';
      const mockToken = 'mock.jwt.token';
      
      jwt.sign.mockReturnValue(mockToken);

      // Test with empty strings
      generateToken('', '', '');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '', username: '', role: '' },
        'test-secret',
        { expiresIn: '1h' }
      );

      // Test with null values (should use default role)
      generateToken('user123', 'testuser', null);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', username: 'testuser', role: null },
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should handle empty or null token in verifyToken', () => {
      process.env.JWT_SECRET = 'test-secret';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(verifyToken('')).toBeNull();
      expect(verifyToken(null)).toBeNull();
      expect(verifyToken(undefined)).toBeNull();
    });
  });
});