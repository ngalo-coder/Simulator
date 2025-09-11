import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import { verifyToken } from '../services/authService.js';
import logger from '../config/logger.js';

/**
 * Middleware to protect routes with JWT authentication
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        message: 'Invalid token.'
      });
    }

    // Debug: log non-sensitive decoded token metadata (no secrets)
    try {
      logger.info({
        event: 'JWT_DECODED',
        tokenPayloadKeys: Object.keys(decoded),
        userIdFromToken: decoded.userId || null,
        primaryRoleFromToken: decoded.primaryRole || decoded.role || null
      }, 'Decoded JWT payload metadata');
    } catch (logErr) {
      // swallow logging errors to avoid impacting auth flow
      logger.warn('Failed to log decoded token metadata', { error: logErr.message });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        message: 'User not found.'
      });
    }

    // Attach user to request (use primaryRole from model)
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.primaryRole || user.role // prefer primaryRole but fallback to role if present
    };

    // Debug: log resolved DB user role (to detect role mismatch causing 403)
    try {
      logger.info({
        event: 'AUTH_USER_RESOLVED',
        userId: user._id.toString(),
        resolvedRole: user.role
      }, 'Resolved authenticated user from token');
    } catch (logErr) {
      logger.warn('Failed to log resolved user metadata', { error: logErr.message });
    }

    next();
  } catch (error) {
    logger.error('JWT Auth Error:', error);
    return res.status(401).json({
      message: 'Invalid token.'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    try {
      logger.info({ event: 'ADMIN_CHECK', reason: 'NO_USER_ATTACHED', path: req.path, method: req.method }, 'Admin check failed - no user attached to request');
    } catch (e) {}
    return res.status(401).json({
      message: 'Access denied. Authentication required.'
    });
  }

  if (req.user.role !== 'admin') {
    try {
      logger.info({ event: 'ADMIN_CHECK', reason: 'ROLE_MISMATCH', userId: req.user.id, role: req.user.role, path: req.path }, 'Admin check failed - user lacks admin role');
    } catch (e) {}
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export default { protect, isAdmin, optionalAuth };