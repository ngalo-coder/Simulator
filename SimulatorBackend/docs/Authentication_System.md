# Authentication and Authorization System

## Overview

The Authentication and Authorization System provides comprehensive security for the healthcare education platform, including JWT-based authentication, role-based access control, session management, audit logging, and rate limiting. The system supports multi-role users across different healthcare disciplines with fine-grained permission control.

## Architecture

### Core Components

1. **Authentication Middleware** - JWT token validation and user authentication
2. **Authorization Guards** - Role and discipline-based access control
3. **Session Management** - Session creation, validation, and timeout handling
4. **Audit Logger** - Security event logging and monitoring
5. **Rate Limiting** - Request throttling and abuse prevention
6. **API Key Authentication** - Service-to-service authentication

## Features

### JWT Authentication
- **Token Validation**: Secure JWT token verification
- **User Context**: Automatic user population from database
- **Token Refresh**: Seamless token renewal
- **Expiration Handling**: Graceful token expiry management

### Role-Based Access Control (RBAC)
- **Multi-Role Support**: Primary and secondary role inheritance
- **Discipline-Based Access**: Healthcare discipline restrictions
- **Permission Inheritance**: Hierarchical permission system
- **Context-Aware Authorization**: Dynamic permission evaluation

### Session Management
- **Session Creation**: Automatic session initialization
- **Activity Tracking**: Last activity timestamp updates
- **Timeout Validation**: Configurable session timeouts
- **Session Cleanup**: Automatic session management

### Security Features
- **Audit Logging**: Comprehensive security event tracking
- **Rate Limiting**: Request throttling per user/IP
- **Suspicious Activity Detection**: Automated threat detection
- **API Key Authentication**: Secure service communication

## Middleware Components

### Core Authentication Middleware

#### `authenticateToken`
Validates JWT tokens and populates user context.

```javascript
import { authenticateToken } from '../middleware/authMiddleware.js';

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user.username });
});
```

#### `optionalAuth`
Attempts authentication but continues without failure.

```javascript
import { optionalAuth } from '../middleware/authMiddleware.js';

app.get('/public-or-private', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: 'Hello ' + req.user.username });
  } else {
    res.json({ message: 'Hello anonymous user' });
  }
});
```

### Role-Based Guards

#### `requireRoles(roles)`
Requires specific user roles for access.

```javascript
import { requireRoles } from '../middleware/authMiddleware.js';

// Single role
app.get('/admin-only', requireRoles(['admin']), handler);

// Multiple roles (any of them)
app.get('/staff-only', requireRoles(['educator', 'admin']), handler);
```

#### `requireDiscipline(disciplines)`
Requires specific healthcare disciplines.

```javascript
import { requireDiscipline } from '../middleware/authMiddleware.js';

// Clinical disciplines only
app.get('/clinical-cases', 
  authenticateToken,
  requireDiscipline(['medicine', 'nursing']),
  handler
);
```

### Convenience Middleware

```javascript
import { 
  requireAuth,
  requireStudent,
  requireEducator,
  requireAdmin,
  requireEducatorOrAdmin
} from '../middleware/authMiddleware.js';

// Basic authentication
app.get('/profile', requireAuth, handler);

// Role-specific routes
app.get('/student-dashboard', requireStudent, handler);
app.get('/educator-tools', requireEducator, handler);
app.get('/admin-panel', requireAdmin, handler);
app.get('/management', requireEducatorOrAdmin, handler);
```

### Session Management

#### `sessionManager.createSession`
Creates a new user session.

```javascript
import { sessionManager } from '../middleware/authMiddleware.js';

app.post('/login',
  authenticateToken,
  sessionManager.createSession,
  (req, res) => {
    res.json({ 
      message: 'Login successful',
      session: req.session 
    });
  }
);
```

#### `sessionManager.updateActivity`
Updates session activity timestamp.

```javascript
app.get('/dashboard',
  authenticateToken,
  sessionManager.updateActivity,
  handler
);
```

#### `sessionManager.validateTimeout(minutes)`
Validates session hasn't timed out.

```javascript
// 30-minute timeout
app.get('/sensitive-data',
  authenticateToken,
  sessionManager.validateTimeout(30),
  handler
);
```

### Rate Limiting

#### `rateLimiter(maxRequests, windowMinutes)`
Limits requests per user/IP within time window.

```javascript
import { rateLimiter } from '../middleware/authMiddleware.js';

// 100 requests per 15 minutes
app.use('/api', rateLimiter(100, 15));

// 10 login attempts per 15 minutes
app.post('/auth/login', rateLimiter(10, 15), handler);

// 5 password changes per 15 minutes
app.post('/auth/change-password', 
  authenticateToken,
  rateLimiter(5, 15),
  handler
);
```

### API Key Authentication

#### `authenticateApiKey`
Validates API keys for service-to-service communication.

```javascript
import { authenticateApiKey } from '../middleware/authMiddleware.js';

app.get('/service-endpoint', authenticateApiKey, (req, res) => {
  res.json({ 
    message: 'Service authenticated',
    isService: req.user.isService 
  });
});
```

## Authentication Routes

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johnsmith",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user-id",
    "username": "johnsmith",
    "email": "john@example.com",
    "primaryRole": "student",
    "discipline": "medicine"
  },
  "expiresIn": "7d"
}
```

### Token Verification
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### Token Refresh
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

### Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

## Audit Logging

### Audit Events
The system logs various security events:

- **Authentication Events**: Login success/failure, token validation
- **Authorization Events**: Permission checks, role validation
- **Session Events**: Session creation, timeout, destruction
- **Security Events**: Rate limiting, suspicious activity
- **System Events**: Errors, configuration changes

### Event Structure
```javascript
{
  event: 'AUTH_SUCCESS',
  userId: 'user-id-123',
  username: 'johnsmith',
  role: 'student',
  discipline: 'medicine',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  path: '/api/protected',
  method: 'GET',
  timestamp: '2023-12-01T10:30:00Z',
  severity: 'low'
}
```

### Audit Log Endpoints (Admin Only)

#### Get Audit Logs
```http
GET /api/auth/admin/audit-logs?page=1&limit=50&event=AUTH_FAILED&severity=high
Authorization: Bearer <admin-token>
```

#### Get Audit Statistics
```http
GET /api/auth/admin/audit-stats?startDate=2023-12-01&endDate=2023-12-31
Authorization: Bearer <admin-token>
```

#### Export Audit Logs
```http
GET /api/auth/admin/export-logs?format=json&startDate=2023-12-01
Authorization: Bearer <admin-token>
```

#### Cleanup Old Logs
```http
POST /api/auth/admin/cleanup-logs
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "maxAgeDays": 90
}
```

## Security Features

### Suspicious Activity Detection

The system automatically detects and logs suspicious patterns:

1. **Multiple Failed Logins**: 5+ failed attempts in 5 minutes
2. **Privilege Escalation**: Rapid role switching attempts
3. **Unusual Access Patterns**: Multiple IP addresses in 24 hours
4. **Rate Limit Violations**: Excessive request patterns

### Password Security
- Minimum 6 character requirement
- Bcrypt hashing with salt
- Current password verification for changes
- Password change audit logging

### Token Security
- JWT with configurable expiration
- Secure secret key management
- Token refresh capability
- Automatic token validation

### Session Security
- Configurable session timeouts
- Activity-based session updates
- Automatic session cleanup
- Session hijacking protection

## Usage Patterns

### Basic Route Protection
```javascript
// Simple authentication
app.get('/profile', requireAuth, handler);

// Role-based access
app.get('/admin', requireAdmin, handler);

// Multi-role access
app.get('/staff', requireEducatorOrAdmin, handler);
```

### Complex Protection Patterns
```javascript
// Multiple middleware layers
app.get('/complex-endpoint',
  rateLimiter(50, 15),                    // Rate limiting
  authenticateToken,                       // Authentication
  sessionManager.updateActivity,           // Session management
  requireRoles(['educator', 'admin']),     // Role checking
  requireDiscipline(['medicine']),         // Discipline checking
  handler
);
```

### Conditional Authentication
```javascript
app.get('/adaptive-content', optionalAuth, (req, res) => {
  const content = { public: 'Available to all' };
  
  if (req.user) {
    content.private = 'Authenticated content';
    
    if (req.user.getAllRoles().includes('admin')) {
      content.admin = 'Admin-only content';
    }
  }
  
  res.json(content);
});
```

### Router-Level Protection
```javascript
const protectedRouter = express.Router();
protectedRouter.use(requireAuth); // Apply to all routes

protectedRouter.get('/dashboard', handler);
protectedRouter.get('/settings', handler);

const adminRouter = express.Router();
adminRouter.use(requireAdmin); // Admin-only routes

adminRouter.get('/users', handler);
adminRouter.get('/system', handler);

app.use('/protected', protectedRouter);
app.use('/admin', adminRouter);
```

## Error Handling

### Authentication Errors
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. Required roles: admin"
}
```

### Rate Limiting Errors
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

### Session Timeout Errors
```json
{
  "success": false,
  "message": "Session has timed out. Please log in again."
}
```

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Keys (comma-separated)
VALID_API_KEYS=key1,key2,key3

# Database
MONGODB_URI=mongodb://localhost:27017/healthcare-platform

# Environment
NODE_ENV=production
```

### Middleware Configuration
```javascript
// Custom rate limiting
const customRateLimit = rateLimiter(200, 30); // 200 requests per 30 minutes

// Custom session timeout
const shortTimeout = sessionManager.validateTimeout(15); // 15 minutes

// Custom role requirements
const clinicalStaff = requireRoles(['educator', 'admin']);
const medicalDisciplines = requireDiscipline(['medicine', 'nursing']);
```

## Best Practices

### Security Best Practices
1. **Use HTTPS**: Always use HTTPS in production
2. **Secure Secrets**: Store JWT secrets securely
3. **Token Expiration**: Use reasonable token expiration times
4. **Rate Limiting**: Implement appropriate rate limits
5. **Audit Logging**: Monitor and review audit logs regularly

### Performance Best Practices
1. **Middleware Order**: Place authentication early in middleware chain
2. **Database Queries**: Optimize user lookup queries
3. **Caching**: Cache frequently accessed user data
4. **Session Management**: Clean up expired sessions regularly

### Development Best Practices
1. **Mock Authentication**: Use mock auth in development
2. **Test Coverage**: Test all authentication scenarios
3. **Error Handling**: Provide clear error messages
4. **Documentation**: Document all protected endpoints

## Testing

### Unit Tests
```javascript
describe('Authentication Middleware', () => {
  it('should authenticate valid JWT token', async () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});
```

### Integration Tests
```javascript
describe('Protected Routes', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/protected')
      .expect(401);

    expect(response.body.message).toBe('Access token is required');
  });
});
```

## Monitoring and Analytics

### Key Metrics
- Authentication success/failure rates
- Authorization denial rates
- Session timeout rates
- Rate limiting violations
- Suspicious activity incidents

### Monitoring Queries
```javascript
// Failed login attempts in last hour
const failedLogins = await AuditLog.countDocuments({
  event: 'AUTH_FAILED',
  timestamp: { $gte: new Date(Date.now() - 3600000) }
});

// Top users by activity
const topUsers = await AuditLog.aggregate([
  { $match: { event: 'AUTH_SUCCESS' } },
  { $group: { _id: '$userId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

## Troubleshooting

### Common Issues

1. **Token Expired**: Implement token refresh logic
2. **User Not Found**: Check user existence and active status
3. **Permission Denied**: Verify user roles and permissions
4. **Rate Limited**: Implement exponential backoff
5. **Session Timeout**: Extend timeout or implement auto-refresh

### Debug Mode
```javascript
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('Auth Debug:', {
      user: req.user?.username,
      roles: req.user?.getAllRoles(),
      path: req.path,
      method: req.method
    });
    next();
  });
}
```

## Future Enhancements

### Planned Features
1. **Multi-Factor Authentication**: SMS/Email verification
2. **OAuth Integration**: Social login providers
3. **Advanced Session Management**: Redis-based sessions
4. **Biometric Authentication**: Fingerprint/face recognition
5. **Advanced Threat Detection**: ML-based anomaly detection

### Scalability Improvements
1. **Distributed Sessions**: Redis cluster support
2. **Token Blacklisting**: Revoked token management
3. **Load Balancing**: Session affinity handling
4. **Microservices**: Service mesh authentication
5. **Edge Authentication**: CDN-level auth checks