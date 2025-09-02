# Role-Based Access Control (RBAC) System

## Overview

The RBAC system provides comprehensive permission management for the healthcare education platform, supporting multiple user roles across different healthcare disciplines with context-aware permission evaluation.

## Architecture

### Core Components

1. **RBACService** - Core permission checking logic
2. **RBAC Middleware** - Express middleware for route protection
3. **Enhanced User Model** - Multi-role support with custom permissions
4. **Permission Matrix** - Role-based permission definitions

## User Roles

### Student Role
- **Primary Focus**: Learning and skill development
- **Key Permissions**:
  - Read cases from their discipline
  - Attempt simulations
  - Access own progress and feedback
  - View help and resources

### Educator Role
- **Primary Focus**: Teaching and student management
- **Key Permissions**:
  - All student permissions
  - Create and edit cases in their discipline
  - Manage assigned students
  - View class analytics
  - Grade assessments

### Admin Role
- **Primary Focus**: System administration
- **Key Permissions**:
  - Full system access (wildcard permissions)
  - User management
  - System configuration
  - Cross-discipline access

## Permission System

### Permission Structure
```javascript
{
  resource: 'cases',           // Resource being accessed
  action: 'read',             // Action being performed
  conditions: {               // Optional conditions
    disciplineMatch: true,    // Must match user's discipline
    ownData: true            // Must be user's own data
  }
}
```

### Context-Aware Permissions

The system evaluates permissions based on context:

- **ownData**: User can only access their own data
- **disciplineMatch**: User can only access data from their discipline
- **ownCases**: Educator can only edit cases they created
- **ownStudents**: Educator can only manage their assigned students
- **ownClasses**: Educator can only view analytics for their classes

## Usage Examples

### Basic Route Protection

```javascript
import { requirePermission, studentOnly, educatorOrAdmin } from '../middleware/rbacMiddleware.js';

// Student-only route
router.get('/student-dashboard', studentOnly, (req, res) => {
  // Only students can access
});

// Permission-based route
router.get('/cases/:discipline', 
  requirePermission('cases', 'read'), 
  (req, res) => {
    // Checks if user can read cases with discipline context
  }
);

// Multi-role route
router.get('/management', educatorOrAdmin, (req, res) => {
  // Educators and admins can access
});
```

### Context-Aware Protection

```javascript
// Own data protection
router.get('/users/:userId/profile', 
  requireOwnData('userId'), 
  (req, res) => {
    // Users can only access their own profile
  }
);

// Discipline-specific protection
router.get('/resources/:discipline', 
  requireSameDiscipline('discipline'), 
  (req, res) => {
    // Users can only access resources from their discipline
  }
);
```

### Custom Permission Checking

```javascript
import rbacService from '../services/RBACService.js';

// In route handler
const hasPermission = await rbacService.checkPermission(
  req.user, 
  'cases', 
  'edit', 
  { 
    caseCreatorId: case.creatorId,
    targetDiscipline: case.discipline 
  }
);

if (!hasPermission) {
  return res.status(403).json({ message: 'Access denied' });
}
```

## Middleware Functions

### Core Middleware

- `requirePermission(resource, action, options)` - Check specific permission
- `requireAnyRole(roles)` - User must have at least one role
- `requireAllRoles(roles)` - User must have all specified roles
- `requireOwnData(userIdParam)` - User can only access own data
- `requireSameDiscipline(disciplineParam)` - Discipline-specific access
- `populateUser()` - Populate full user object from database

### Convenience Middleware

- `studentOnly` - Student role only
- `educatorOnly` - Educator role only
- `adminOnly` - Admin role only
- `educatorOrAdmin` - Educator or admin roles
- `anyAuthenticated` - Any authenticated user

## Permission Matrix

### Student Permissions
```javascript
[
  { resource: 'cases', action: 'read', conditions: { disciplineMatch: true } },
  { resource: 'cases', action: 'attempt', conditions: { disciplineMatch: true } },
  { resource: 'simulations', action: 'create', conditions: { ownData: true } },
  { resource: 'progress', action: 'read', conditions: { ownData: true } },
  { resource: 'feedback', action: 'read', conditions: { ownData: true } },
  { resource: 'profile', action: 'read', conditions: { ownData: true } },
  { resource: 'help', action: 'read' }
]
```

### Educator Permissions
```javascript
[
  // All student permissions plus:
  { resource: 'cases', action: 'create', conditions: { disciplineMatch: true } },
  { resource: 'cases', action: 'edit', conditions: { ownCases: true, disciplineMatch: true } },
  { resource: 'students', action: 'read', conditions: { ownStudents: true, disciplineMatch: true } },
  { resource: 'analytics', action: 'read', conditions: { ownClasses: true, disciplineMatch: true } }
]
```

### Admin Permissions
```javascript
[
  { resource: '*', action: '*' } // Full access
]
```

## Multi-Role Support

Users can have multiple roles through:
- **Primary Role**: Main role (required)
- **Secondary Roles**: Additional roles (optional)
- **Custom Permissions**: User-specific permissions

```javascript
// User with multiple roles
const user = {
  primaryRole: 'student',
  secondaryRoles: ['educator'],
  permissions: [
    { resource: 'special-feature', action: 'access', conditions: {} }
  ]
};

// Check all roles
const userRoles = user.getAllRoles(); // ['student', 'educator']
const hasEducatorRole = user.hasRole('educator'); // true
```

## Healthcare Discipline Support

The system supports five healthcare disciplines:
- **Medicine**: Medical cases and clinical scenarios
- **Nursing**: Patient care and nursing procedures
- **Laboratory**: Diagnostic testing and lab procedures
- **Radiology**: Imaging interpretation and techniques
- **Pharmacy**: Medication management and counseling

### Discipline-Specific Features

- Cases are filtered by discipline
- Resources are discipline-specific
- Analytics are segmented by discipline
- Competencies are mapped to discipline standards

## Error Handling

The RBAC system provides clear error responses:

```javascript
// 401 Unauthorized - No authentication
{
  success: false,
  message: 'Authentication required'
}

// 403 Forbidden - Insufficient permissions
{
  success: false,
  message: 'Insufficient permissions to access this resource'
}

// 400 Bad Request - Missing parameters
{
  success: false,
  message: 'User ID parameter is required'
}
```

## Testing

### Unit Tests
- Permission checking logic
- Role validation
- Context evaluation
- Multi-role support

### Integration Tests
- Middleware functionality
- Route protection
- Error handling
- User population

### Example Test
```javascript
it('should allow student to read cases from their discipline', async () => {
  const context = { targetDiscipline: 'medicine' };
  const hasPermission = await rbacService.checkPermission(
    studentUser, 
    'cases', 
    'read', 
    context
  );
  
  expect(hasPermission).toBe(true);
});
```

## Best Practices

### 1. Always Use populateUser()
```javascript
router.get('/protected-route',
  populateUser(),        // Ensure full user object
  requirePermission('resource', 'action'),
  handler
);
```

### 2. Provide Context for Permissions
```javascript
// Good - provides context
const context = {
  targetUserId: req.params.userId,
  targetDiscipline: req.body.discipline
};

// Bad - no context
const hasPermission = await rbacService.checkPermission(user, 'cases', 'read');
```

### 3. Use Appropriate Middleware
```javascript
// Use specific middleware when possible
router.get('/student-only', studentOnly, handler);

// Use permission-based for complex scenarios
router.get('/complex', requirePermission('resource', 'action'), handler);
```

### 4. Handle Errors Gracefully
```javascript
try {
  const hasPermission = await rbacService.checkPermission(user, resource, action, context);
  if (!hasPermission) {
    return res.status(403).json({ message: 'Access denied' });
  }
} catch (error) {
  console.error('Permission check failed:', error);
  return res.status(500).json({ message: 'Internal server error' });
}
```

## Configuration

### Adding Custom Permissions
```javascript
// Add permission to role
rbacService.addRolePermission('student', {
  resource: 'new-feature',
  action: 'access',
  conditions: { disciplineMatch: true }
});

// Remove permission from role
rbacService.removeRolePermission('student', 'cases', 'create');
```

### Custom Context Evaluation
```javascript
// Extend context evaluation in RBACService
async evaluateConditions(conditions, user, context) {
  // Add custom condition
  if (conditions.customCondition) {
    return await this.checkCustomCondition(user, context);
  }
  
  // Call parent implementation
  return await super.evaluateConditions(conditions, user, context);
}
```

## Security Considerations

1. **Principle of Least Privilege**: Users get minimum necessary permissions
2. **Defense in Depth**: Multiple layers of permission checking
3. **Context Validation**: Always validate context parameters
4. **Audit Logging**: Log permission checks for security monitoring
5. **Regular Reviews**: Periodically review and update permissions

## Performance Considerations

1. **Caching**: Cache permission results for frequently accessed resources
2. **Batch Checks**: Group permission checks when possible
3. **Lazy Loading**: Load permissions only when needed
4. **Database Optimization**: Optimize user and permission queries

## Future Enhancements

1. **Dynamic Permissions**: Runtime permission modification
2. **Time-Based Permissions**: Temporary access grants
3. **Resource Hierarchies**: Nested resource permissions
4. **Advanced Analytics**: Permission usage analytics
5. **External Integration**: LDAP/Active Directory integration