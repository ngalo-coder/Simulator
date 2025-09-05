import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import auditLogger from '../services/AuditLoggerService.js';
import { verifyToken } from '../config/auth.js';

/**
 * Authentication Middleware
 * Handles JWT token validation, user authentication, and session management
 */

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and populates req.user with authenticated user data
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      await auditLogger.logAuthEvent({
        event: 'AUTH_FAILED',
        reason: 'NO_TOKEN',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      await auditLogger.logAuthEvent({
        event: 'AUTH_FAILED',
        reason: 'USER_NOT_FOUND',
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      await auditLogger.logAuthEvent({
        event: 'AUTH_FAILED',
        reason: 'USER_INACTIVE',
        userId: user._id,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login time
    await user.updateLastLogin();

    // Attach user to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    // Log successful authentication
    await auditLogger.logAuthEvent({
      event: 'AUTH_SUCCESS',
      userId: user._id,
      username: user.username,
      role: user.primaryRole,
      discipline: user.discipline,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    let reason = 'TOKEN_INVALID';
    let message = 'Invalid or expired token';

    if (error.name === 'TokenExpiredError') {
      reason = 'TOKEN_EXPIRED';
      message = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      reason = 'TOKEN_MALFORMED';
      message = 'Malformed token';
    }

    await auditLogger.logAuthEvent({
      event: 'AUTH_FAILED',
      reason: reason,
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });

    console.error('Authentication error:', error);
    
    return res.status(401).json({
      success: false,
      message: message
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      req.token = null;
      req.tokenPayload = null;
      return next();
    }

    // If token is provided, validate it
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;
      
      await user.updateLastLogin();
      
      await auditLogger.logAuthEvent({
        event: 'OPTIONAL_AUTH_SUCCESS',
        userId: user._id,
        username: user.username,
        role: user.primaryRole,
        ip: req.ip,
        path: req.path
      });
    } else {
      req.user = null;
      req.token = null;
      req.tokenPayload = null;
    }

    next();
  } catch (error) {
    // If optional auth fails, continue without authentication
    req.user = null;
    req.token = null;
    req.tokenPayload = null;
    next();
  }
};

/**
 * Role-based Authentication Guard
 * Requires authentication and specific roles
 */
export const requireRoles = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        await auditLogger.logAuthEvent({
          event: 'AUTHORIZATION_FAILED',
          reason: 'NOT_AUTHENTICATED',
          requiredRoles: allowedRoles,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user has any of the allowed roles
      const userRoles = req.user.getAllRoles();
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        await auditLogger.logAuthEvent({
          event: 'AUTHORIZATION_FAILED',
          reason: 'INSUFFICIENT_ROLES',
          userId: req.user._id,
          username: req.user.username,
          userRoles: userRoles,
          requiredRoles: allowedRoles,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      // Log successful authorization
      await auditLogger.logAuthEvent({
        event: 'AUTHORIZATION_SUCCESS',
        userId: req.user._id,
        username: req.user.username,
        userRoles: userRoles,
        requiredRoles: allowedRoles,
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      
      await auditLogger.logAuthEvent({
        event: 'AUTHORIZATION_ERROR',
        error: error.message,
        userId: req.user?._id,
        ip: req.ip,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Discipline-based Authentication Guard
 * Requires authentication and specific healthcare discipline
 */
export const requireDiscipline = (allowedDisciplines) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userDiscipline = req.user.discipline;
      const hasRequiredDiscipline = allowedDisciplines.includes(userDiscipline);

      if (!hasRequiredDiscipline) {
        await auditLogger.logAuthEvent({
          event: 'DISCIPLINE_ACCESS_DENIED',
          userId: req.user._id,
          username: req.user.username,
          userDiscipline: userDiscipline,
          requiredDisciplines: allowedDisciplines,
          ip: req.ip,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: `Access denied. Required disciplines: ${allowedDisciplines.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Discipline authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Discipline authorization check failed'
      });
    }
  };
};

/**
 * Session Management Middleware
 * Handles session creation, validation, and cleanup
 */
export const sessionManager = {
  /**
   * Create a new session for authenticated user
   */
  createSession: async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      // Create session data
      const sessionData = {
        userId: req.user._id,
        username: req.user.username,
        roles: req.user.getAllRoles(),
        discipline: req.user.discipline,
        loginTime: new Date(),
        lastActivity: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Store session in request for use by other middleware
      req.session = sessionData;

      await auditLogger.logAuthEvent({
        event: 'SESSION_CREATED',
        userId: req.user._id,
        username: req.user.username,
        sessionData: sessionData,
        ip: req.ip
      });

      next();
    } catch (error) {
      console.error('Session creation error:', error);
      next();
    }
  },

  /**
   * Update session activity
   */
  updateActivity: async (req, res, next) => {
    try {
      if (req.session) {
        req.session.lastActivity = new Date();
      }
      next();
    } catch (error) {
      console.error('Session update error:', error);
      next();
    }
  },

  /**
   * Validate session timeout
   */
  validateTimeout: (timeoutMinutes = 60) => {
    return async (req, res, next) => {
      try {
        if (!req.session) {
          return next();
        }

        const now = new Date();
        const lastActivity = new Date(req.session.lastActivity);
        const timeDiff = (now - lastActivity) / (1000 * 60); // minutes

        if (timeDiff > timeoutMinutes) {
          await auditLogger.logAuthEvent({
            event: 'SESSION_TIMEOUT',
            userId: req.user?._id,
            username: req.user?.username,
            lastActivity: lastActivity,
            timeoutMinutes: timeoutMinutes,
            ip: req.ip
          });

          return res.status(401).json({
            success: false,
            message: 'Session has timed out. Please log in again.'
          });
        }

        next();
      } catch (error) {
        console.error('Session timeout validation error:', error);
        next();
      }
    };
  }
};

/**
 * API Key Authentication (for service-to-service communication)
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    // Validate API key (in production, this should be stored securely)
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey)) {
      await auditLogger.logAuthEvent({
        event: 'API_KEY_INVALID',
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.ip,
        path: req.path
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    await auditLogger.logAuthEvent({
      event: 'API_KEY_AUTH_SUCCESS',
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path
    });

    // Set service user context
    req.user = {
      _id: 'service',
      username: 'service',
      primaryRole: 'service',
      isService: true
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'API key authentication failed'
    });
  }
};

/**
 * Rate Limiting Middleware
 */
export const rateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  const requests = new Map();

  return async (req, res, next) => {
    try {
      const identifier = req.user?._id || req.ip;
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }

      const userRequests = requests.get(identifier);
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        await auditLogger.logAuthEvent({
          event: 'RATE_LIMIT_EXCEEDED',
          userId: req.user?._id,
          identifier: identifier,
          requestCount: validRequests.length,
          maxRequests: maxRequests,
          windowMinutes: windowMinutes,
          ip: req.ip,
          path: req.path
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      validRequests.push(now);
      requests.set(identifier, validRequests);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - validRequests.length),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

/**
 * Convenience middleware combinations
 */
export const requireAuth = authenticateToken;
export const requireStudent = [authenticateToken, requireRoles(['student'])];
export const requireEducator = [authenticateToken, requireRoles(['educator'])];
export const requireAdmin = [authenticateToken, requireRoles(['admin'])];
export const requireEducatorOrAdmin = [authenticateToken, requireRoles(['educator', 'admin'])];
export const requireAnyRole = [authenticateToken, requireRoles(['student', 'educator', 'admin'])];

/**
 * Development/Testing Middleware
 */
export const mockAuth = (mockUser = null) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      req.user = mockUser || {
        _id: 'mock-user-id',
        username: 'mockuser',
        primaryRole: 'student',
        discipline: 'medicine',
        getAllRoles: () => ['student'],
        updateLastLogin: () => Promise.resolve()
      };
    }
    next();
  };
};