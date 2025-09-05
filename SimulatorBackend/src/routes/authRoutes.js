import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import auditLogger from '../services/AuditLoggerService.js';
import {
  authenticateToken,
  requireAuth,
  requireAdmin,
  rateLimiter
} from '../middleware/authMiddleware.js';
import { getJwtSecret, getJwtExpiresIn } from '../config/auth.js';

const router = express.Router();

/**
 * Authentication Routes
 */

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', 
  rateLimiter(10, 15), // 10 attempts per 15 minutes
  async (req, res) => {
    try {
      const { username, password, email } = req.body;

      // Validate input
      if ((!username && !email) || !password) {
        await auditLogger.logAuthEvent({
          event: 'AUTH_FAILED',
          reason: 'MISSING_CREDENTIALS',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }

      // Find user by username or email
      const query = username 
        ? { username: username.toLowerCase().trim() }
        : { email: email.toLowerCase().trim() };

      const user = await User.findOne(query);

      if (!user) {
        await auditLogger.logAuthEvent({
          event: 'AUTH_FAILED',
          reason: 'USER_NOT_FOUND',
          username: username,
          email: email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
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

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await auditLogger.logAuthEvent({
          event: 'AUTH_FAILED',
          reason: 'INVALID_PASSWORD',
          userId: user._id,
          username: user.username,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const jwtSecret = getJwtSecret();
      const jwtExpiresIn = getJwtExpiresIn();

      const tokenPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        primaryRole: user.primaryRole,
        discipline: user.discipline
      };

      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: jwtExpiresIn });

      // Update last login
      await user.updateLastLogin();

      // Log successful login
      await auditLogger.logAuthEvent({
        event: 'LOGIN_SUCCESS',
        userId: user._id,
        username: user.username,
        role: user.primaryRole,
        discipline: user.discipline,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      // Return user data (without password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse,
        expiresIn: jwtExpiresIn
      });

    } catch (error) {
      console.error('Login error:', error);

      await auditLogger.logAuthEvent({
        event: 'LOGIN_ERROR',
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Log logout event
    await auditLogger.logAuthEvent({
      event: 'LOGOUT_SUCCESS',
      userId: req.user._id,
      username: req.user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);

    await auditLogger.logAuthEvent({
      event: 'LOGOUT_ERROR',
      userId: req.user?._id,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    // Generate new token with updated user data
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      await auditLogger.logAuthEvent({
        event: 'TOKEN_REFRESH_FAILED',
        reason: 'USER_NOT_FOUND_OR_INACTIVE',
        userId: req.user._id,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const jwtSecret = getJwtSecret();
    const jwtExpiresIn = getJwtExpiresIn();

    const tokenPayload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      primaryRole: user.primaryRole,
      discipline: user.discipline
    };

    const newToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: jwtExpiresIn });

    await auditLogger.logAuthEvent({
      event: 'TOKEN_REFRESHED',
      userId: user._id,
      username: user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Return updated user data
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      user: userResponse,
      expiresIn: jwtExpiresIn
    });

  } catch (error) {
    console.error('Token refresh error:', error);

    await auditLogger.logAuthEvent({
      event: 'TOKEN_REFRESH_ERROR',
      userId: req.user?._id,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

/**
 * Verify Token
 * GET /api/auth/verify
 */
router.get('/verify', requireAuth, async (req, res) => {
  try {
    // Return current user data if token is valid
    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Token is valid',
      user: userResponse,
      tokenPayload: req.tokenPayload
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

/**
 * Change Password
 * POST /api/auth/change-password
 */
router.post('/change-password', 
  requireAuth,
  rateLimiter(5, 15), // 5 attempts per 15 minutes
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        await auditLogger.logAuthEvent({
          event: 'PASSWORD_CHANGE_FAILED',
          reason: 'INVALID_CURRENT_PASSWORD',
          userId: user._id,
          username: user.username,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      await auditLogger.logAuthEvent({
        event: 'PASSWORD_CHANGED',
        userId: user._id,
        username: user.username,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);

      await auditLogger.logAuthEvent({
        event: 'PASSWORD_CHANGE_ERROR',
        userId: req.user?._id,
        error: error.message,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: 'Password change failed'
      });
    }
  }
);

/**
 * Admin Routes
 */

/**
 * Get Audit Logs (Admin only)
 * GET /api/auth/admin/audit-logs
 */
router.get('/admin/audit-logs', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      event,
      userId,
      ip,
      severity,
      startDate,
      endDate
    } = req.query;

    const filters = {};
    if (event) filters.event = event;
    if (userId) filters.userId = userId;
    if (ip) filters.ip = ip;
    if (severity) filters.severity = severity;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: { timestamp: -1 }
    };

    const result = await auditLogger.getAuditLogs(filters, options);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
});

/**
 * Get Audit Statistics (Admin only)
 * GET /api/auth/admin/audit-stats
 */
router.get('/admin/audit-stats', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await auditLogger.getAuditStats(filters);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit statistics'
    });
  }
});

/**
 * Export Audit Logs (Admin only)
 * GET /api/auth/admin/export-logs
 */
router.get('/admin/export-logs', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const logs = await auditLogger.exportLogs(filters);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.json({
        success: true,
        logs,
        exportedAt: new Date(),
        totalRecords: logs.length
      });
    }

    await auditLogger.logAuthEvent({
      event: 'AUDIT_LOGS_EXPORTED',
      userId: req.user._id,
      username: req.user.username,
      metadata: {
        format,
        recordCount: logs.length,
        filters
      },
      ip: req.ip
    });

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs'
    });
  }
});

/**
 * Cleanup Old Logs (Admin only)
 * POST /api/auth/admin/cleanup-logs
 */
router.post('/admin/cleanup-logs', requireAdmin, async (req, res) => {
  try {
    const { maxAgeDays = 90 } = req.body;

    const deletedCount = await auditLogger.cleanupOldLogs(maxAgeDays);

    await auditLogger.logAuthEvent({
      event: 'AUDIT_LOGS_CLEANED',
      userId: req.user._id,
      username: req.user.username,
      metadata: {
        maxAgeDays,
        deletedCount
      },
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old audit logs`,
      deletedCount
    });

  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old logs'
    });
  }
});

/**
 * Helper function to convert logs to CSV
 */
function convertToCSV(logs) {
  if (logs.length === 0) return '';

  const headers = ['timestamp', 'event', 'username', 'role', 'ip', 'path', 'reason', 'severity'];
  const csvRows = [headers.join(',')];

  logs.forEach(log => {
    const row = headers.map(header => {
      const value = log[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export default router;