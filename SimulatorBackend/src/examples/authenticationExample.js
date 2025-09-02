import express from 'express';
import {
  authenticateToken,
  optionalAuth,
  requireRoles,
  requireDiscipline,
  sessionManager,
  rateLimiter,
  requireAuth,
  requireStudent,
  requireEducator,
  requireAdmin,
  requireEducatorOrAdmin
} from '../middleware/authMiddleware.js';

/**
 * Authentication System Usage Examples
 * This file demonstrates how to use the authentication middleware
 */

const app = express();

// Example 1: Basic Authentication
// Requires valid JWT token
app.get('/protected', requireAuth, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user.username,
    role: req.user.primaryRole
  });
});

// Example 2: Optional Authentication
// Works with or without authentication
app.get('/public-with-optional-auth', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({
      message: 'Hello authenticated user',
      user: req.user.username
    });
  } else {
    res.json({
      message: 'Hello anonymous user'
    });
  }
});

// Example 3: Role-Based Access Control
// Only students can access
app.get('/student-only', requireStudent, (req, res) => {
  res.json({
    message: 'Student dashboard',
    user: req.user.username,
    discipline: req.user.discipline
  });
});

// Only educators can access
app.get('/educator-only', requireEducator, (req, res) => {
  res.json({
    message: 'Educator dashboard',
    user: req.user.username
  });
});

// Only admins can access
app.get('/admin-only', requireAdmin, (req, res) => {
  res.json({
    message: 'Admin panel',
    user: req.user.username
  });
});

// Educators or admins can access
app.get('/management', requireEducatorOrAdmin, (req, res) => {
  res.json({
    message: 'Management interface',
    user: req.user.username,
    role: req.user.primaryRole
  });
});

// Example 4: Custom Role Requirements
// Multiple roles allowed
app.get('/multi-role', 
  authenticateToken,
  requireRoles(['educator', 'admin']),
  (req, res) => {
    res.json({
      message: 'Multi-role access granted',
      userRoles: req.user.getAllRoles()
    });
  }
);

// Example 5: Discipline-Based Access Control
// Only medicine and nursing disciplines
app.get('/clinical-resources',
  authenticateToken,
  requireDiscipline(['medicine', 'nursing']),
  (req, res) => {
    res.json({
      message: 'Clinical resources',
      discipline: req.user.discipline
    });
  }
);

// Only laboratory discipline
app.get('/lab-protocols',
  authenticateToken,
  requireDiscipline(['laboratory']),
  (req, res) => {
    res.json({
      message: 'Laboratory protocols',
      discipline: req.user.discipline
    });
  }
);

// Example 6: Session Management
// Create session on login
app.post('/login-with-session',
  // Login logic would go here first
  authenticateToken,
  sessionManager.createSession,
  (req, res) => {
    res.json({
      message: 'Login successful with session',
      session: req.session
    });
  }
);

// Update session activity
app.get('/dashboard',
  authenticateToken,
  sessionManager.updateActivity,
  (req, res) => {
    res.json({
      message: 'Dashboard data',
      lastActivity: req.session?.lastActivity
    });
  }
);

// Validate session timeout (30 minutes)
app.get('/sensitive-data',
  authenticateToken,
  sessionManager.validateTimeout(30),
  (req, res) => {
    res.json({
      message: 'Sensitive data access',
      sessionValid: true
    });
  }
);

// Example 7: Rate Limiting
// 100 requests per 15 minutes for general API
app.use('/api', rateLimiter(100, 15));

// 10 requests per 15 minutes for login attempts
app.post('/auth/login', 
  rateLimiter(10, 15),
  (req, res) => {
    // Login logic here
    res.json({ message: 'Login attempt' });
  }
);

// 5 requests per 15 minutes for password changes
app.post('/auth/change-password',
  authenticateToken,
  rateLimiter(5, 15),
  (req, res) => {
    // Password change logic here
    res.json({ message: 'Password change attempt' });
  }
);

// Example 8: Complex Middleware Combinations
// Multiple middleware layers
app.get('/complex-protected',
  rateLimiter(50, 15),           // Rate limiting
  authenticateToken,              // Authentication
  sessionManager.updateActivity,  // Session management
  requireRoles(['educator', 'admin']), // Role checking
  requireDiscipline(['medicine', 'nursing']), // Discipline checking
  (req, res) => {
    res.json({
      message: 'Complex protected resource',
      user: req.user.username,
      role: req.user.primaryRole,
      discipline: req.user.discipline,
      sessionActivity: req.session?.lastActivity
    });
  }
);

// Example 9: Conditional Authentication
// Different behavior based on user role
app.get('/adaptive-content',
  optionalAuth,
  (req, res) => {
    let content = {
      public: 'This content is available to everyone'
    };

    if (req.user) {
      content.authenticated = 'This content requires authentication';
      
      if (req.user.getAllRoles().includes('student')) {
        content.student = 'Student-specific content';
      }
      
      if (req.user.getAllRoles().includes('educator')) {
        content.educator = 'Educator-specific content';
      }
      
      if (req.user.getAllRoles().includes('admin')) {
        content.admin = 'Admin-specific content';
      }
    }

    res.json(content);
  }
);

// Example 10: API Key Authentication for Services
app.get('/service-endpoint',
  // This would use authenticateApiKey middleware
  (req, res) => {
    res.json({
      message: 'Service-to-service communication',
      serviceUser: req.user?.isService
    });
  }
);

// Example 11: Error Handling Middleware
app.use((error, req, res, next) => {
  console.error('Authentication error:', error);
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
  
  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Example 12: Route-Specific Authentication Patterns

// Public routes (no authentication required)
const publicRoutes = express.Router();
publicRoutes.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Protected routes (authentication required)
const protectedRoutes = express.Router();
protectedRoutes.use(authenticateToken); // Apply to all routes in this router

protectedRoutes.get('/profile', (req, res) => {
  res.json({ user: req.user.username });
});

protectedRoutes.get('/settings', (req, res) => {
  res.json({ settings: 'user settings' });
});

// Admin routes (admin authentication required)
const adminRoutes = express.Router();
adminRoutes.use(requireAdmin); // Apply to all routes in this router

adminRoutes.get('/users', (req, res) => {
  res.json({ message: 'All users list' });
});

adminRoutes.get('/system-stats', (req, res) => {
  res.json({ message: 'System statistics' });
});

// Mount routers
app.use('/public', publicRoutes);
app.use('/protected', protectedRoutes);
app.use('/admin', adminRoutes);

// Example 13: Middleware Factory Functions
function createRoleGuard(allowedRoles) {
  return [
    authenticateToken,
    requireRoles(allowedRoles)
  ];
}

function createDisciplineGuard(allowedDisciplines) {
  return [
    authenticateToken,
    requireDiscipline(allowedDisciplines)
  ];
}

// Usage of factory functions
app.get('/custom-role-guard',
  ...createRoleGuard(['educator', 'admin']),
  (req, res) => {
    res.json({ message: 'Custom role guard applied' });
  }
);

app.get('/custom-discipline-guard',
  ...createDisciplineGuard(['medicine', 'nursing']),
  (req, res) => {
    res.json({ message: 'Custom discipline guard applied' });
  }
);

// Example 14: Development/Testing Helpers
if (process.env.NODE_ENV === 'development') {
  // Mock authentication for development
  app.get('/dev/mock-student',
    (req, res, next) => {
      req.user = {
        _id: 'dev-student',
        username: 'dev-student',
        primaryRole: 'student',
        discipline: 'medicine',
        getAllRoles: () => ['student']
      };
      next();
    },
    (req, res) => {
      res.json({
        message: 'Development mock student',
        user: req.user
      });
    }
  );
}

// Example usage functions for demonstration
export const authExamples = {
  // Example of programmatic authentication check
  async checkUserPermissions(user, requiredRoles, requiredDisciplines = null) {
    const userRoles = user.getAllRoles();
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return { authorized: false, reason: 'Insufficient roles' };
    }
    
    if (requiredDisciplines) {
      const hasDiscipline = requiredDisciplines.includes(user.discipline);
      if (!hasDiscipline) {
        return { authorized: false, reason: 'Discipline not allowed' };
      }
    }
    
    return { authorized: true };
  },

  // Example of creating custom middleware
  createCustomAuthMiddleware(options = {}) {
    const {
      roles = [],
      disciplines = [],
      rateLimit = null,
      sessionTimeout = null
    } = options;

    const middleware = [];

    // Add rate limiting if specified
    if (rateLimit) {
      middleware.push(rateLimiter(rateLimit.requests, rateLimit.windowMinutes));
    }

    // Always require authentication
    middleware.push(authenticateToken);

    // Add session management if timeout specified
    if (sessionTimeout) {
      middleware.push(sessionManager.validateTimeout(sessionTimeout));
    }

    // Add role checking if specified
    if (roles.length > 0) {
      middleware.push(requireRoles(roles));
    }

    // Add discipline checking if specified
    if (disciplines.length > 0) {
      middleware.push(requireDiscipline(disciplines));
    }

    return middleware;
  },

  // Example of authentication status checking
  getAuthStatus(req) {
    return {
      authenticated: !!req.user,
      user: req.user ? {
        id: req.user._id,
        username: req.user.username,
        roles: req.user.getAllRoles(),
        discipline: req.user.discipline
      } : null,
      session: req.session ? {
        loginTime: req.session.loginTime,
        lastActivity: req.session.lastActivity
      } : null,
      token: {
        present: !!req.token,
        payload: req.tokenPayload
      }
    };
  }
};

export default app;