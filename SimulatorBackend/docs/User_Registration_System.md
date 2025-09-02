# User Registration and Profile Management System

## Overview

The User Registration and Profile Management System provides comprehensive functionality for user onboarding, profile completion, and ongoing profile management in the healthcare education platform. It supports multi-disciplinary healthcare users with role-based registration and discipline-specific competency tracking.

## Architecture

### Core Components

1. **UserRegistrationService** - Core business logic for registration and profile management
2. **User Routes** - RESTful API endpoints for user operations
3. **Enhanced User Model** - Multi-role user data model with healthcare disciplines
4. **Profile Wizard** - Step-by-step profile completion guidance
5. **Preference Management** - User learning preferences and notification settings

## Features

### User Registration
- **Multi-Role Support**: Students, educators, and administrators
- **Healthcare Disciplines**: Medicine, nursing, laboratory, radiology, pharmacy
- **Validation**: Comprehensive input validation and error handling
- **Security**: Password hashing, JWT token generation
- **Default Setup**: Automatic competency initialization based on discipline

### Profile Management
- **Profile Completion Wizard**: Guided multi-step profile setup
- **Profile Updates**: Flexible profile editing with validation
- **Preference Management**: Learning style, difficulty, notifications
- **Password Management**: Secure password change functionality
- **Competency Tracking**: Discipline-specific competency management

### Administrative Features
- **Registration Statistics**: User analytics and reporting
- **Bulk Operations**: Support for administrative user management
- **Configuration Management**: Dynamic form configuration
- **Audit Trails**: User activity tracking

## API Endpoints

### Registration Endpoints

#### Register New User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johnsmith",
  "email": "john.smith@university.edu",
  "password": "securePassword123",
  "primaryRole": "student",
  "discipline": "medicine",
  "firstName": "John",
  "lastName": "Smith",
  "institution": "Medical University",
  "yearOfStudy": 3,
  "specialization": "Internal Medicine"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "user-id",
    "username": "johnsmith",
    "email": "john.smith@university.edu",
    "primaryRole": "student",
    "discipline": "medicine",
    "profile": {
      "firstName": "John",
      "lastName": "Smith",
      "institution": "Medical University",
      "yearOfStudy": 3,
      "specialization": "Internal Medicine"
    }
  },
  "token": "jwt-token",
  "profileComplete": false
}
```

### Profile Management Endpoints

#### Complete User Profile
```http
POST /api/users/:userId/complete-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "specialization": "Cardiology",
  "competencyLevel": "competent",
  "preferences": {
    "learningStyle": "visual",
    "difficultyPreference": "intermediate",
    "notifications": {
      "email": true,
      "push": true,
      "caseReminders": true,
      "progressUpdates": false
    }
  },
  "competencies": [
    {
      "competencyId": "CUSTOM001",
      "competencyName": "Advanced Cardiac Assessment",
      "targetLevel": 4
    }
  ]
}
```

#### Get User Profile
```http
GET /api/users/:userId/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/users/:userId/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith-Johnson",
  "email": "newemail@university.edu",
  "specialization": "Emergency Medicine",
  "yearOfStudy": 4,
  "competencyLevel": "proficient"
}
```

#### Update User Preferences
```http
PUT /api/users/:userId/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "learningStyle": "kinesthetic",
  "difficultyPreference": "advanced",
  "language": "es",
  "timezone": "America/New_York",
  "notifications": {
    "email": false,
    "push": true,
    "caseReminders": true,
    "progressUpdates": true
  }
}
```

#### Change Password
```http
PUT /api/users/:userId/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword456"
}
```

### Utility Endpoints

#### Get Healthcare Disciplines
```http
GET /api/users/disciplines
```

**Response:**
```json
{
  "success": true,
  "disciplines": [
    {
      "value": "medicine",
      "label": "Medicine"
    },
    {
      "value": "nursing",
      "label": "Nursing"
    }
  ]
}
```

#### Get User Roles
```http
GET /api/users/roles
```

#### Get Registration Configuration
```http
GET /api/users/registration-config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "disciplines": [
      {
        "value": "medicine",
        "label": "Medicine",
        "description": "Medical practice, diagnosis, and treatment"
      }
    ],
    "roles": [
      {
        "value": "student",
        "label": "Student",
        "description": "Learning healthcare skills and knowledge"
      }
    ],
    "competencyLevels": [
      {
        "value": "novice",
        "label": "Novice",
        "description": "Beginning level with limited experience"
      }
    ],
    "learningStyles": [
      {
        "value": "visual",
        "label": "Visual",
        "description": "Learn best through images and diagrams"
      }
    ],
    "difficultyPreferences": [
      {
        "value": "beginner",
        "label": "Beginner",
        "description": "Start with basic concepts"
      }
    ]
  }
}
```

### Profile Wizard Endpoints

#### Get Profile Wizard Steps
```http
GET /api/users/:userId/profile-wizard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "steps": [
    {
      "id": "basic-info",
      "title": "Basic Information",
      "description": "Complete your basic profile information",
      "completed": true,
      "fields": ["firstName", "lastName", "institution"]
    },
    {
      "id": "academic-info",
      "title": "Academic Information",
      "description": "Add your academic and professional details",
      "completed": false,
      "fields": ["specialization", "yearOfStudy", "licenseNumber", "competencyLevel"]
    }
  ],
  "overallProgress": 50,
  "profileComplete": false
}
```

### Administrative Endpoints

#### Get Registration Statistics (Admin Only)
```http
GET /api/users/admin/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 100,
    "activeUsers": 95,
    "verifiedUsers": 80,
    "usersByRole": {
      "student": 70,
      "educator": 25,
      "admin": 5
    },
    "usersByDiscipline": {
      "medicine": 40,
      "nursing": 35,
      "pharmacy": 25
    }
  }
}
```

## Data Models

### User Registration Data
```typescript
interface RegistrationData {
  username: string;           // Unique username (alphanumeric only)
  email: string;             // Valid email address
  password: string;          // Minimum 6 characters
  primaryRole?: UserRole;    // Default: 'student'
  discipline: HealthcareDiscipline;
  firstName: string;
  lastName: string;
  institution: string;
  specialization?: string;
  yearOfStudy?: number;      // 1-10
  licenseNumber?: string;
}
```

### Profile Update Data
```typescript
interface ProfileUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  specialization?: string;
  yearOfStudy?: number;
  institution?: string;
  licenseNumber?: string;
  competencyLevel?: CompetencyLevel;
  preferences?: UserPreferences;
}
```

### User Preferences
```typescript
interface UserPreferences {
  language?: string;         // Default: 'en'
  timezone?: string;         // Default: 'UTC'
  learningStyle?: LearningStyle;
  difficultyPreference?: DifficultyPreference;
  notifications?: {
    email?: boolean;
    push?: boolean;
    caseReminders?: boolean;
    progressUpdates?: boolean;
  };
}
```

## Validation Rules

### Registration Validation
- **Username**: Required, alphanumeric only, unique
- **Email**: Required, valid format, unique
- **Password**: Required, minimum 6 characters
- **Discipline**: Required, valid healthcare discipline
- **Role**: Optional, valid user role
- **Names**: Required, non-empty strings
- **Institution**: Required, non-empty string
- **Year of Study**: Optional, 1-10 range
- **License Number**: Optional, string

### Profile Update Validation
- **Email**: Valid format if provided
- **Year of Study**: 1-10 range if provided
- **Competency Level**: Valid enum value if provided
- **Learning Style**: Valid enum value if provided
- **Difficulty Preference**: Valid enum value if provided
- **Notifications**: Boolean values if provided

## Default Competencies by Discipline

### Medicine
- Clinical Reasoning (Target Level: 4)
- Patient Communication (Target Level: 4)
- Diagnostic Skills (Target Level: 4)
- Treatment Planning (Target Level: 4)

### Nursing
- Patient Care (Target Level: 4)
- Medication Administration (Target Level: 4)
- Care Planning (Target Level: 4)
- Patient Safety (Target Level: 5)

### Laboratory
- Specimen Processing (Target Level: 4)
- Quality Control (Target Level: 5)
- Result Interpretation (Target Level: 4)
- Laboratory Safety (Target Level: 5)

### Radiology
- Image Interpretation (Target Level: 4)
- Technique Selection (Target Level: 3)
- Radiation Safety (Target Level: 5)
- Report Writing (Target Level: 4)

### Pharmacy
- Medication Therapy Management (Target Level: 4)
- Drug Interactions (Target Level: 4)
- Patient Counseling (Target Level: 4)
- Pharmaceutical Care (Target Level: 4)

## Profile Completion Wizard

### Step 1: Basic Information
**Fields**: firstName, lastName, institution
**Completion Criteria**: All fields have non-empty values

### Step 2: Academic Information
**Fields**: specialization, yearOfStudy, licenseNumber, competencyLevel
**Completion Criteria**: At least one field has a value

### Step 3: Learning Preferences
**Fields**: learningStyle, difficultyPreference, notifications
**Completion Criteria**: learningStyle and difficultyPreference are set

### Step 4: Competency Assessment
**Fields**: competencies
**Completion Criteria**: At least one competency is defined

## Security Features

### Password Security
- Minimum 6 character requirement
- Bcrypt hashing with salt rounds
- Secure password change with current password verification

### JWT Token Management
- Configurable expiration time
- User identification payload
- Role and discipline information included

### Access Control
- RBAC middleware integration
- Own data access restrictions
- Admin-only endpoints protection

### Input Validation
- Comprehensive server-side validation
- SQL injection prevention
- XSS protection through input sanitization

## Error Handling

### Registration Errors
```json
{
  "success": false,
  "message": "Username already exists"
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Registration failed. Please try again."
}
```

## Usage Examples

### Frontend Integration

#### Registration Form
```javascript
const registerUser = async (formData) => {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store token and redirect to profile completion
      localStorage.setItem('token', result.token);
      if (!result.profileComplete) {
        window.location.href = '/profile-wizard';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      // Display error message
      showError(result.message);
    }
  } catch (error) {
    showError('Registration failed. Please try again.');
  }
};
```

#### Profile Wizard
```javascript
const getProfileWizardSteps = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/profile-wizard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        steps: result.steps,
        overallProgress: result.overallProgress,
        profileComplete: result.profileComplete
      };
    }
  } catch (error) {
    console.error('Failed to get profile wizard steps:', error);
  }
};
```

#### Preferences Update
```javascript
const updatePreferences = async (userId, preferences) => {
  try {
    const response = await fetch(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(preferences)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('Preferences updated successfully');
      return result.preferences;
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Failed to update preferences');
  }
};
```

## Best Practices

### Registration Flow
1. **Collect Essential Information**: Start with minimum required fields
2. **Progressive Enhancement**: Use profile wizard for additional details
3. **Validation Feedback**: Provide immediate validation feedback
4. **Security First**: Never store plain text passwords
5. **User Experience**: Guide users through the process

### Profile Management
1. **Incremental Updates**: Allow partial profile updates
2. **Validation**: Validate all inputs server-side
3. **Feedback**: Provide clear success/error messages
4. **Preferences**: Respect user preferences and settings
5. **Privacy**: Protect user data and respect privacy settings

### Error Handling
1. **User-Friendly Messages**: Provide clear, actionable error messages
2. **Logging**: Log errors for debugging and monitoring
3. **Graceful Degradation**: Handle service unavailability gracefully
4. **Validation**: Validate inputs on both client and server
5. **Security**: Don't expose sensitive information in errors

## Performance Considerations

### Database Optimization
- Index frequently queried fields (username, email)
- Use aggregation pipelines for statistics
- Implement connection pooling
- Cache frequently accessed data

### API Performance
- Implement request rate limiting
- Use compression for large responses
- Optimize JSON serialization
- Implement proper HTTP caching headers

### Security Performance
- Use efficient hashing algorithms
- Implement JWT token caching
- Optimize permission checking
- Use database-level constraints

## Monitoring and Analytics

### Key Metrics
- Registration success rate
- Profile completion rate
- User activation rate
- Error rates by endpoint
- Response times

### Logging
- Registration attempts and outcomes
- Profile update activities
- Authentication events
- Error occurrences
- Performance metrics

## Future Enhancements

### Planned Features
1. **Email Verification**: Automated email verification workflow
2. **Social Login**: Integration with OAuth providers
3. **Bulk Import**: Administrative bulk user import
4. **Advanced Preferences**: More granular preference controls
5. **Profile Templates**: Discipline-specific profile templates

### Scalability Improvements
1. **Microservices**: Split into smaller services
2. **Caching**: Implement Redis caching
3. **CDN**: Use CDN for static assets
4. **Load Balancing**: Implement load balancing
5. **Database Sharding**: Scale database horizontally