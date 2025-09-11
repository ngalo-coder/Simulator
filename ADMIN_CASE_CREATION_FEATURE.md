# Admin Case Creation Feature

## Overview

This feature allows administrators to create new simulation cases directly through the admin interface. The feature includes template-based case creation with customizable metadata and content.

## Components

### Backend Components

#### 1. Admin Routes (`/src/routes/adminRoutes.js`)
- **GET `/api/admin/cases/templates`** - Fetch available case templates
- **POST `/api/admin/cases/create`** - Create a new case from template
- **PUT `/api/admin/cases/:caseId/edit`** - Edit existing case
- **POST `/api/admin/cases/:caseId/publish`** - Publish a case

#### 2. Case Template Service (`/src/services/CaseTemplateService.js`)
Provides discipline-specific templates for:
- Medicine (clinical cases)
- Nursing (patient care scenarios)
- Laboratory (diagnostic testing)
- Radiology (imaging interpretation)
- Pharmacy (medication therapy)

#### 3. Case Management Service (`/src/services/CaseManagementService.js`)
Handles case CRUD operations, validation, and workflow management.

### Frontend Components

#### 1. AdminCaseCreation Modal (`/src/components/AdminCaseCreation.tsx`)
- Template selection interface
- Case details form
- Validation and error handling
- Real-time form updates

#### 2. Updated AdminCaseManagement (`/src/components/AdminCaseManagement.tsx`)
- Added "Create New Case" button
- Integrated case creation modal
- Automatic refresh after case creation

#### 3. API Service Updates (`/src/services/apiService.ts`)
- `getAdminCaseTemplates()` - Fetch templates
- `createAdminCase()` - Create new case
- `editAdminCase()` - Edit existing case
- `publishAdminCase()` - Publish case

## Usage

### 1. Accessing the Feature
1. Log in as an admin user
2. Navigate to Admin Dashboard
3. Click on "Cases" tab
4. Click "Create New Case" button

### 2. Creating a Case
1. **Select Template**: Choose from available discipline templates:
   - 🩺 Medicine - Clinical presentation and diagnosis
   - 💉 Nursing - Patient care and interventions
   - 🧪 Laboratory - Specimen processing and testing
   - 📷 Radiology - Imaging interpretation
   - 💊 Pharmacy - Medication therapy management

2. **Fill Case Details**:
   - **Title** (required): Descriptive case title
   - **Description**: Detailed case description
   - **Difficulty**: Beginner, Intermediate, or Advanced
   - **Specialty**: Medical specialty or focus area
   - **Program Area**: Educational program classification
   - **Duration**: Estimated completion time (5-180 minutes)

3. **Submit**: Create the case with template structure populated

### 3. Case Status Workflow
- **Draft**: Newly created case (editable)
- **Pending Review**: Submitted for quality review
- **Approved**: Reviewed and approved
- **Published**: Available for simulation
- **Archived**: Removed from active use

## API Examples

### Get Templates
```javascript
GET /api/admin/cases/templates
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "templates": [
    {
      "discipline": "medicine",
      "metadata": {
        "name": "Medical Case Template",
        "description": "Comprehensive template...",
        "icon": "stethoscope",
        "color": "#e74c3c"
      },
      "template": { ... }
    }
  ]
}
```

### Create Case
```javascript
POST /api/admin/cases/create
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "discipline": "medicine",
  "title": "Acute Myocardial Infarction",
  "description": "Comprehensive MI case",
  "difficulty": "intermediate",
  "estimatedDuration": 45,
  "specialty": "Cardiology",
  "programArea": "Internal Medicine"
}

Response:
{
  "success": true,
  "message": "Case created successfully",
  "caseId": "64a7b8c9d1234567890abcde",
  "case": { ... }
}
```

### Edit Case
```javascript
PUT /api/admin/cases/:caseId/edit
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Updated Case Title",
  "difficulty": "advanced",
  "status": "published"
}
```

## Template Structure

Each template includes:
- **Case Metadata**: Title, specialty, difficulty, duration
- **Patient Persona**: Demographics, history, presentation
- **Clinical Dossier**: Discipline-specific clinical data
- **Evaluation Criteria**: Scoring and assessment rubrics
- **Simulation Triggers**: Interactive elements and decision points

### Medicine Template Fields
- History of presenting illness
- Review of systems
- Physical examination
- Diagnostic tests
- Differential diagnosis
- Treatment plan

### Nursing Template Fields
- Nursing assessment
- Care planning
- Medication administration
- Patient safety measures
- Documentation requirements

### Laboratory Template Fields
- Specimen information
- Test requests and procedures
- Quality control protocols
- Safety procedures
- Result interpretation

### Radiology Template Fields
- Imaging study details
- Systematic review approach
- Finding identification
- Differential diagnosis
- Radiation safety considerations

### Pharmacy Template Fields
- Medication history
- Drug therapy assessment
- Patient counseling points
- Safety monitoring
- Documentation requirements

## Validation Rules

### Required Fields
- **Title**: Must be non-empty
- **Discipline**: Must be valid template discipline
- **Difficulty**: Must be beginner, intermediate, or advanced

### Field Constraints
- **Duration**: 5-180 minutes
- **Patient Age**: 0-120 years (if specified)
- **Title Length**: 5-200 characters

### Discipline-Specific Validation
- **Medicine**: Requires chief complaint and hidden diagnosis
- **Nursing**: Requires admission reason
- **Laboratory**: Requires specimen information and test requests
- **Radiology**: Requires imaging study information
- **Pharmacy**: Requires medication history

## Error Handling

### Frontend Error Display
- Form validation errors shown inline
- API errors displayed in error banner
- Loading states during API calls
- Graceful fallbacks for template loading failures

### Backend Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Admin privileges required
- **404 Not Found**: Case or template not found
- **500 Internal Server Error**: Server-side errors

## Security Considerations

### Authentication & Authorization
- Admin JWT token required for all endpoints
- RBAC middleware enforces admin-only access
- User context included in all operations

### Input Validation
- Server-side validation of all inputs
- SQL injection prevention
- XSS protection through content sanitization

### Audit Logging
- Case creation events logged
- User actions tracked
- Admin operations audited

## Testing

### Backend Testing
```bash
# Run the test script
cd SimulatorBackend
node test-admin-case-creation.js
```

### Frontend Testing
1. Log in as admin user
2. Navigate to Cases tab
3. Click "Create New Case"
4. Complete template selection and form
5. Verify case appears in cases list

### Integration Testing
- Template loading from service
- Case creation workflow
- Error handling scenarios
- Permission validation

## Deployment Notes

### Environment Requirements
- Admin user account with proper privileges
- Database connection for case storage
- Template service availability

### Configuration
- Ensure admin routes are registered in main app
- Verify CORS settings for frontend integration
- Check authentication middleware configuration

## Future Enhancements

### Planned Features
- **Rich Text Editor**: Enhanced content editing
- **Media Upload**: Image and video attachments
- **Collaboration**: Multi-user case editing
- **Version Control**: Case revision history
- **Bulk Operations**: Mass case import/export
- **Template Customization**: Custom template creation

### Integration Opportunities
- **AI Assistance**: Content generation suggestions
- **Quality Assurance**: Automated case validation
- **Analytics**: Case usage and performance metrics
- **Internationalization**: Multi-language support

## Support

### Common Issues
1. **Template Loading Failed**: Check backend service status
2. **Case Creation Timeout**: Verify database connection
3. **Permission Denied**: Ensure admin role assignment
4. **Form Validation Errors**: Review required field completion

### Troubleshooting
1. Check browser console for JavaScript errors
2. Verify network connectivity to backend API
3. Confirm authentication token validity
4. Review server logs for detailed error information

For additional support, consult the API documentation or contact the development team.