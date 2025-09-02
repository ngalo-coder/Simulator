# Admin User Management System

## Overview

The Admin User Management System provides comprehensive administrative capabilities for managing users in the healthcare education platform. It includes user listing with advanced filtering, user creation and editing, bulk operations, import/export functionality, role assignment, and permission management.

## Features

### User Management
- **User Listing**: Paginated user lists with advanced filtering and search
- **User Creation**: Create new users with full profile setup
- **User Editing**: Update user information, roles, and permissions
- **User Deletion**: Safe user deletion with admin protection
- **Password Management**: Admin password reset functionality

### Bulk Operations
- **Bulk Activation/Deactivation**: Mass user status updates
- **Bulk Role Assignment**: Add or remove roles from multiple users
- **Bulk Import**: CSV-based user import with validation
- **Bulk Export**: CSV export with filtering options

### Analytics and Reporting
- **User Statistics**: Comprehensive user analytics
- **Role Distribution**: User count by role and discipline
- **Activity Metrics**: Recent user registrations and activity
- **Export Reports**: Filtered data exports for analysis

## API Endpoints

### User Listing and Search

#### Get Users with Filtering
```http
GET /api/admin/users?page=1&limit=20&role=student&discipline=medicine&search=john
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field (default: 'createdAt')
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')
- `search` (string): Search term for username, email, or name
- `role` (string|array): Filter by user role(s)
- `discipline` (string|array): Filter by healthcare discipline(s)
- `isActive` (boolean): Filter by active status
- `emailVerified` (boolean): Filter by email verification status
- `createdAfter` (date): Filter users created after date
- `createdBefore` (date): Filter users created before date

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user-id-123",
      "username": "johnsmith",
      "email": "john@example.com",
      "primaryRole": "student",
      "secondaryRoles": [],
      "discipline": "medicine",
      "profile": {
        "firstName": "John",
        "lastName": "Smith",
        "institution": "Medical University",
        "specialization": "Internal Medicine",
        "yearOfStudy": 3,
        "competencyLevel": "competent"
      },
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2023-12-01T10:00:00Z",
      "lastLogin": "2023-12-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "role": "student",
    "discipline": "medicine"
  },
  "sort": {
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

#### Get User by ID
```http
GET /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

### User Creation and Editing

#### Create New User
```http
POST /api/admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securePassword123",
  "primaryRole": "student",
  "secondaryRoles": [],
  "discipline": "medicine",
  "firstName": "New",
  "lastName": "User",
  "institution": "Medical University",
  "specialization": "Cardiology",
  "yearOfStudy": 2,
  "licenseNumber": "",
  "competencyLevel": "novice",
  "isActive": true,
  "emailVerified": false,
  "permissions": [
    {
      "resource": "advanced-cases",
      "action": "access",
      "conditions": { "disciplineMatch": true }
    }
  ]
}
```

#### Update User
```http
PUT /api/admin/users/:userId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "primaryRole": "educator",
  "secondaryRoles": ["student"],
  "profile": {
    "firstName": "Updated",
    "lastName": "Name",
    "specialization": "Emergency Medicine",
    "competencyLevel": "proficient"
  },
  "isActive": true,
  "emailVerified": true,
  "permissions": [
    {
      "resource": "cases",
      "action": "create",
      "conditions": { "disciplineMatch": true }
    }
  ]
}
```

#### Delete User
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

#### Reset User Password
```http
POST /api/admin/users/:userId/reset-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newPassword": "newSecurePassword456"
}
```

### Bulk Operations

#### Bulk Status Update
```http
POST /api/admin/users/bulk/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"],
  "isActive": false
}
```

#### Bulk Role Assignment
```http
POST /api/admin/users/bulk/roles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"],
  "role": "educator",
  "operation": "add"
}
```

### Import/Export Operations

#### Export Users to CSV
```http
GET /api/admin/users/export?discipline=medicine&isActive=true
Authorization: Bearer <admin-token>
```

**Response:** CSV file download with headers:
```csv
username,email,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified,createdAt
```

#### Import Users from CSV
```http
POST /api/admin/users/import
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

csvFile: <file>
```

**CSV Format:**
```csv
username,email,password,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified
johnsmith,john@example.com,password123,student,,medicine,John,Smith,Medical University,Internal Medicine,3,,competent,true,false
```

#### Get Import Template
```http
GET /api/admin/users/import-template
Authorization: Bearer <admin-token>
```

### Statistics and Configuration

#### Get User Statistics
```http
GET /api/admin/users/statistics
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalUsers": 500,
    "activeUsers": 475,
    "inactiveUsers": 25,
    "verifiedUsers": 400,
    "unverifiedUsers": 100,
    "recentUsers": 45,
    "usersByRole": {
      "student": 350,
      "educator": 125,
      "admin": 25
    },
    "usersByDiscipline": {
      "medicine": 200,
      "nursing": 150,
      "pharmacy": 100,
      "laboratory": 30,
      "radiology": 20
    }
  }
}
```

#### Get Configuration Options
```http
GET /api/admin/users/config
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "config": {
    "roles": [
      {
        "value": "student",
        "label": "Student",
        "description": "Learning healthcare skills and knowledge through simulations"
      }
    ],
    "disciplines": [
      {
        "value": "medicine",
        "label": "Medicine",
        "description": "Medical practice, diagnosis, and treatment"
      }
    ],
    "competencyLevels": [
      {
        "value": "novice",
        "label": "Novice",
        "description": "Beginning level with limited experience"
      }
    ],
    "sortOptions": [
      { "value": "createdAt", "label": "Created Date" },
      { "value": "username", "label": "Username" },
      { "value": "email", "label": "Email" }
    ],
    "filterOptions": {
      "roles": ["student", "educator", "admin"],
      "disciplines": ["medicine", "nursing", "laboratory", "radiology", "pharmacy"],
      "activeStatus": [
        { "value": true, "label": "Active" },
        { "value": false, "label": "Inactive" }
      ]
    }
  }
}
```

## Service Methods

### AdminUserManagementService

#### User Retrieval
```javascript
// Get paginated users with filtering
const result = await adminUserManagementService.getUsers(filters, options);

// Get user by ID
const user = await adminUserManagementService.getUserById(userId);
```

#### User Management
```javascript
// Create new user
const newUser = await adminUserManagementService.createUser(userData, adminUser);

// Update existing user
const updatedUser = await adminUserManagementService.updateUser(userId, updateData, adminUser);

// Delete user
const success = await adminUserManagementService.deleteUser(userId, adminUser);

// Reset password
const success = await adminUserManagementService.resetUserPassword(userId, newPassword, adminUser);
```

#### Bulk Operations
```javascript
// Bulk status update
const result = await adminUserManagementService.bulkUpdateActiveStatus(userIds, isActive, adminUser);

// Bulk role assignment
const result = await adminUserManagementService.bulkRoleAssignment(userIds, role, operation, adminUser);
```

#### Import/Export
```javascript
// Export users to CSV
const csvData = await adminUserManagementService.exportUsers(filters, adminUser);

// Import users from CSV
const result = await adminUserManagementService.importUsers(csvBuffer, adminUser);
```

#### Analytics
```javascript
// Get user statistics
const stats = await adminUserManagementService.getUserStatistics();
```

## Filtering and Search

### Available Filters

#### Role Filters
- Single role: `{ role: 'student' }`
- Multiple roles: `{ role: ['student', 'educator'] }`
- Includes primary and secondary roles

#### Discipline Filters
- Single discipline: `{ discipline: 'medicine' }`
- Multiple disciplines: `{ discipline: ['medicine', 'nursing'] }`

#### Status Filters
- Active users: `{ isActive: true }`
- Verified users: `{ emailVerified: true }`

#### Date Range Filters
- Created after: `{ createdAfter: '2023-01-01' }`
- Created before: `{ createdBefore: '2023-12-31' }`

#### Search Functionality
Searches across:
- Username
- Email address
- First name
- Last name
- Institution name

### Sorting Options
- `createdAt` - Creation date
- `username` - Username alphabetically
- `email` - Email alphabetically
- `profile.lastName` - Last name alphabetically
- `lastLogin` - Last login date

## Bulk Operations

### Bulk Status Updates
```javascript
// Activate multiple users
const result = await adminUserManagementService.bulkUpdateActiveStatus(
  ['user-1', 'user-2', 'user-3'],
  true,
  adminUser
);

// Deactivate multiple users
const result = await adminUserManagementService.bulkUpdateActiveStatus(
  ['user-4', 'user-5'],
  false,
  adminUser
);
```

### Bulk Role Management
```javascript
// Add educator role to multiple users
const result = await adminUserManagementService.bulkRoleAssignment(
  ['user-1', 'user-2'],
  'educator',
  'add',
  adminUser
);

// Remove educator role from multiple users
const result = await adminUserManagementService.bulkRoleAssignment(
  ['user-3', 'user-4'],
  'educator',
  'remove',
  adminUser
);
```

## Import/Export System

### CSV Export Format
```csv
username,email,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified,createdAt
johnsmith,john@example.com,student,,medicine,John,Smith,Medical University,Internal Medicine,3,,competent,true,false,2023-12-01T10:00:00Z
```

### CSV Import Format
```csv
username,email,password,primaryRole,secondaryRoles,discipline,firstName,lastName,institution,specialization,yearOfStudy,licenseNumber,competencyLevel,isActive,emailVerified
newuser1,user1@example.com,password123,student,,medicine,New,User1,Test University,Cardiology,2,,novice,true,false
```

### Import Process
1. **File Upload**: CSV file uploaded via multipart form
2. **Parsing**: CSV parsed and validated
3. **Processing**: Each row processed individually
4. **Conflict Resolution**: Existing users updated, new users created
5. **Error Handling**: Errors collected and reported
6. **Audit Logging**: All operations logged for security

### Import Result
```json
{
  "success": true,
  "message": "Import completed",
  "result": {
    "total": 100,
    "created": 75,
    "updated": 20,
    "errors": [
      {
        "row": 15,
        "data": { "username": "invalid" },
        "error": "Email is required"
      }
    ]
  }
}
```

## Security Features

### Admin-Only Access
- All endpoints require admin authentication
- RBAC middleware enforces admin role requirement
- Audit logging for all administrative actions

### Safe Operations
- **Last Admin Protection**: Cannot delete the last admin user
- **Password Validation**: Enforces password strength requirements
- **Input Validation**: Comprehensive validation of all user data
- **SQL Injection Prevention**: Parameterized queries and validation

### Audit Trail
All administrative actions are logged:
- User creation, updates, and deletion
- Bulk operations and their scope
- Password resets and security changes
- Import/export operations
- Failed operations and security violations

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "message": "Email is required"
}
```

### Not Found Errors
```json
{
  "success": false,
  "message": "User not found"
}
```

### Security Errors
```json
{
  "success": false,
  "message": "Cannot delete the last admin user"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Failed to retrieve users"
}
```

## Frontend Integration Examples

### User Listing Component
```javascript
const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({});

  const fetchUsers = async (page = 1) => {
    const params = new URLSearchParams({
      page,
      limit: 20,
      ...filters
    });

    const response = await fetch(`/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    setUsers(data.users);
    setPagination(data.pagination);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchUsers(1); // Reset to first page
  };

  return (
    <div>
      <UserFilters onFilterChange={handleFilterChange} />
      <UserTable users={users} />
      <Pagination {...pagination} onPageChange={fetchUsers} />
    </div>
  );
};
```

### Bulk Operations Component
```javascript
const BulkOperations = ({ selectedUsers }) => {
  const handleBulkActivate = async () => {
    const response = await fetch('/api/admin/users/bulk/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userIds: selectedUsers,
        isActive: true
      })
    });

    const result = await response.json();
    if (result.success) {
      showNotification(`${result.modifiedCount} users activated`);
      refreshUserList();
    }
  };

  const handleBulkRoleAdd = async (role) => {
    const response = await fetch('/api/admin/users/bulk/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userIds: selectedUsers,
        role: role,
        operation: 'add'
      })
    });

    const result = await response.json();
    if (result.success) {
      showNotification(result.message);
      refreshUserList();
    }
  };

  return (
    <div>
      <button onClick={handleBulkActivate}>Activate Selected</button>
      <button onClick={() => handleBulkRoleAdd('educator')}>
        Add Educator Role
      </button>
    </div>
  );
};
```

### Import/Export Component
```javascript
const ImportExport = () => {
  const handleExport = async () => {
    const params = new URLSearchParams(currentFilters);
    const response = await fetch(`/api/admin/users/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
  };

  const handleImport = async (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);

    const response = await fetch('/api/admin/users/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      showNotification(`Import completed: ${result.result.created} created, ${result.result.updated} updated`);
      if (result.result.errors.length > 0) {
        showErrors(result.result.errors);
      }
      refreshUserList();
    }
  };

  return (
    <div>
      <button onClick={handleExport}>Export Users</button>
      <input type="file" accept=".csv" onChange={(e) => handleImport(e.target.files[0])} />
    </div>
  );
};
```

## Best Practices

### Performance Optimization
1. **Pagination**: Always use pagination for large user lists
2. **Indexing**: Ensure database indexes on frequently filtered fields
3. **Caching**: Cache user statistics and configuration data
4. **Lazy Loading**: Load user details only when needed

### Security Best Practices
1. **Input Validation**: Validate all input data on both client and server
2. **Rate Limiting**: Implement rate limiting for bulk operations
3. **Audit Logging**: Log all administrative actions
4. **Permission Checks**: Verify admin permissions for all operations

### User Experience
1. **Progressive Disclosure**: Show basic info first, details on demand
2. **Bulk Selection**: Provide efficient bulk selection mechanisms
3. **Real-time Updates**: Update UI immediately after operations
4. **Error Feedback**: Provide clear, actionable error messages

### Data Management
1. **Backup Before Bulk Operations**: Always backup before major changes
2. **Validation Before Import**: Validate CSV data before processing
3. **Rollback Capability**: Provide rollback for bulk operations
4. **Data Integrity**: Maintain referential integrity during operations

## Monitoring and Analytics

### Key Metrics
- User growth rate
- Role distribution changes
- Discipline enrollment trends
- Admin activity patterns
- Import/export frequency

### Audit Queries
```javascript
// Recent admin activities
const recentActivities = await AuditLog.find({
  event: { $in: ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED'] },
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).sort({ timestamp: -1 });

// Bulk operations summary
const bulkOperations = await AuditLog.find({
  event: { $regex: /^BULK_/ },
  timestamp: { $gte: startDate, $lte: endDate }
});
```

## Troubleshooting

### Common Issues

1. **Import Failures**: Check CSV format and required fields
2. **Permission Denied**: Verify admin role and authentication
3. **Bulk Operation Timeouts**: Reduce batch size for large operations
4. **Search Performance**: Add database indexes for search fields
5. **Export Timeouts**: Use streaming for large exports

### Debug Mode
```javascript
if (process.env.NODE_ENV === 'development') {
  // Enable detailed logging
  console.log('Admin operation:', {
    operation: 'createUser',
    adminUser: req.user.username,
    targetData: userData
  });
}
```

This comprehensive admin user management system provides all the tools needed for effective user administration in a healthcare education platform, with proper security, audit trails, and user experience considerations.