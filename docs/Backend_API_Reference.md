# Virtual Patient Simulation Backend API Reference

## Overview
This document provides a technical reference for all backend APIs in the Virtual Patient Simulation system. It focuses on endpoints, data structures, and integration patterns without prescribing specific UI implementations.

## Base Configuration
- **Base URL**: `http://localhost:5002` (development) or your production URL
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`
- **CORS**: Configured for multiple origins including localhost and production domains

## Authentication System (`/api/auth`)

### User Registration
```
POST /api/auth/register
Access: Public
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user"
  }
}
```

### User Login
```
POST /api/auth/login
Access: Public
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "user|admin"
  }
}
```

### Password Reset Flow
```
POST /api/auth/forgot-password
Access: Public
```

**Request Body:**
```json
{
  "email": "string"
}
```

```
PATCH /api/auth/reset-password/:token
Access: Public
```

**Request Body:**
```json
{
  "password": "string"
}
```

## Simulation Engine (`/api/simulation`)

### Case Discovery
```
GET /api/simulation/cases
Access: Protected
Query Parameters: program_area, specialty, specialized_area, page, limit
```

**Response:**
```json
{
  "cases": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "difficulty": "Easy|Intermediate|Hard",
      "estimated_time": "string",
      "program_area": "string",
      "specialized_area": "string",
      "patient_age": "number",
      "patient_gender": "string",
      "chief_complaint": "string",
      "presenting_symptoms": ["string"],
      "tags": ["string"]
    }
  ],
  "currentPage": "number",
  "totalPages": "number",
  "totalCases": "number"
}
```

### Case Categories
```
GET /api/simulation/case-categories
Access: Protected
Query Parameters: program_area
```

**Response:**
```json
{
  "program_areas": ["string"],
  "specialties": ["string"],
  "specialized_areas": ["string"]
}
```

### Session Management
```
POST /api/simulation/start
Access: Protected
```

**Request Body:**
```json
{
  "caseId": "string"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "initialPrompt": "string",
  "patientName": "string",
  "speaks_for": "string"
}
```

### Interactive Communication
```
GET /api/simulation/ask
Access: Protected
Query Parameters: sessionId, question, token
Content-Type: text/event-stream
```

**Server-Sent Events:**
```json
// Streaming response chunks
{"type": "chunk", "content": "string", "speaks_for": "string"}

// Session completion
{"type": "done"}

// Automatic session end
{"type": "session_end", "summary": "string"}
```

### Session Termination
```
POST /api/simulation/end
Access: Protected
```

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "sessionEnded": true,
  "evaluation": "string",
  "history": [
    {
      "role": "Clinician|Patient",
      "content": "string",
      "timestamp": "ISO8601"
    }
  ]
}
```

### Performance Analytics
```
GET /api/simulation/performance-metrics/session/:sessionId
Access: Protected
```

**Response:**
```json
{
  "session_ref": "string",
  "case_ref": "string",
  "metrics": {
    "overall_score": "number",
    "performance_label": "Excellent|Good|Needs Improvement",
    "clinical_reasoning": "number",
    "communication": "number",
    "efficiency": "number",
    "evaluation_summary": "string"
  },
  "raw_evaluation_text": "string",
  "evaluated_at": "ISO8601"
}
```

## User Queue System (`/api/users`)

### Queue Session Management
```
POST /api/users/queue/session/start
Access: Protected
```

```
POST /api/users/queue/session/:sessionId/next
Access: Protected
```

```
GET /api/users/queue/session/:sessionId
Access: Protected
```

### Case Status Tracking
```
POST /api/users/cases/:originalCaseIdString/status
Access: Protected
```

**Request Body:**
```json
{
  "status": "completed|skipped|in_progress"
}
```

### User History
```
GET /api/users/cases/history/:userId?
Access: Protected
```

## Progress Tracking (`/api/progress`)

### Individual Progress
```
GET /api/progress/:userId
Access: Protected
```

**Response:**
```json
{
  "userId": "string",
  "totalCasesCompleted": "number",
  "overallAverageScore": "number",
  "specialtyProgress": [
    {
      "specialty": "string",
      "casesCompleted": "number",
      "averageScore": "number",
      "lastCompletedAt": "ISO8601"
    }
  ],
  "recentPerformance": [
    {
      "caseId": "string",
      "caseTitle": "string",
      "score": "number",
      "completedAt": "ISO8601"
    }
  ]
}
```

### Personalized Recommendations
```
GET /api/progress/recommendations/:userId
Access: Protected
```

**Response:**
```json
{
  "recommendedCases": [
    {
      "caseId": "string",
      "title": "string",
      "specialty": "string",
      "difficulty": "string",
      "reason": "string"
    }
  ],
  "improvementAreas": ["string"],
  "nextMilestones": ["string"]
}
```

### Progress Updates
```
POST /api/progress/update
Access: Protected
```

**Request Body:**
```json
{
  "userId": "string",
  "caseId": "string",
  "performanceMetricsId": "string"
}
```

## Administrative Interface (`/api/admin`)

### System Analytics
```
GET /api/admin/stats
Access: Admin
Query Parameters: startDate, endDate
```

**Response:**
```json
{
  "totalUsers": "number",
  "totalCases": "number",
  "totalSessions": "number",
  "recentUsers": "number",
  "activeUsers": "number",
  "recentSessions": "number",
  "casesBySpecialty": [
    {"_id": "string", "count": "number"}
  ],
  "userGrowth": [
    {"_id": {"year": "number", "month": "number"}, "count": "number"}
  ],
  "generatedAt": "ISO8601",
  "dateRange": {"startDate": "string", "endDate": "string"}
}
```

### Real-time Monitoring
```
GET /api/admin/stats/realtime
Access: Admin
```

**Response:**
```json
{
  "activeUsers": "number",
  "recentSessions": "number",
  "pendingReviews": "number",
  "lastUpdated": "ISO8601"
}
```

### User Management
```
GET /api/admin/users
Access: Admin
Query Parameters: page, limit, search
```

**Response:**
```json
{
  "users": [
    {
      "_id": "string",
      "username": "string",
      "email": "string",
      "role": "user|admin",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

```
DELETE /api/admin/users/:userId
Access: Admin
```

```
POST /api/admin/users/admin
Access: Admin
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

```
PUT /api/admin/users/:userId/role
Access: Admin
```

**Request Body:**
```json
{
  "role": "user|admin"
}
```

### Case Management
```
GET /api/admin/cases
Access: Admin
Query Parameters: page, limit, specialty, programArea
```

```
DELETE /api/admin/cases/:caseId
Access: Admin
```

```
PUT /api/admin/cases/:caseId
Access: Admin
```

**Request Body:**
```json
{
  "programArea": "string",
  "specialty": "string"
}
```

### Performance Analytics
```
GET /api/admin/users/scores
Access: Admin
```

**Response:**
```json
[
  {
    "_id": "string",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO8601",
    "totalCases": "number",
    "averageScore": "number",
    "excellentCount": "number",
    "excellentRate": "number"
  }
]
```

## Program Configuration (`/api/admin`)

### Program Areas
```
GET /api/admin/program-areas
Access: Public
```

```
GET /api/admin/program-areas/counts
Access: Public
```

```
POST /api/admin/program-areas
Access: Admin
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

```
PUT /api/admin/program-areas/:id
Access: Admin
```

```
DELETE /api/admin/program-areas/:id
Access: Admin
```

### Specialties
```
GET /api/admin/specialties
Access: Public
```

```
GET /api/admin/specialties/counts
Access: Public
```

```
POST /api/admin/specialties
Access: Admin
```

```
PUT /api/admin/specialties/:id
Access: Admin
```

```
DELETE /api/admin/specialties/:id
Access: Admin
```

## Community Contributions (`/api/contribute`)

### Contribution Metadata
```
GET /api/contribute/form-data
Access: Public
```

**Response:**
```json
{
  "specialties": ["string"],
  "modules": {
    "Internal Medicine": ["string"],
    "Pediatrics": ["string"]
  },
  "programAreas": ["string"],
  "difficulties": ["string"],
  "locations": ["string"],
  "genders": ["string"],
  "emotionalTones": ["string"]
}
```

### Case Submission
```
POST /api/contribute/submit
Access: Protected (requires contributor eligibility)
```

**Request Body:**
```json
{
  "caseData": {
    "case_metadata": {
      "title": "string",
      "specialty": "string",
      "program_area": "string",
      "difficulty": "string",
      "location": "string"
    },
    "patient_persona": {
      "name": "string",
      "age": "number",
      "gender": "string",
      "chief_complaint": "string",
      "emotional_tone": "string"
    },
    "clinical_dossier": {
      "hidden_diagnosis": "string"
    },
    "initial_prompt": "string"
  }
}
```

### Draft Management
```
POST /api/contribute/draft
Access: Protected
```

```
GET /api/contribute/my-cases
Access: Protected
```

**Response:**
```json
[
  {
    "_id": "string",
    "status": "draft|submitted|approved|rejected|needs_revision",
    "caseData": {
      "case_metadata": {
        "title": "string",
        "specialty": "string",
        "case_id": "string"
      }
    },
    "submittedAt": "ISO8601",
    "createdAt": "ISO8601",
    "reviewComments": "string"
  }
]
```

```
GET /api/contribute/edit/:caseId
Access: Protected
```

```
PUT /api/contribute/update/:caseId
Access: Protected
```

```
DELETE /api/contribute/delete/:caseId
Access: Protected
```

## Performance Analytics (`/api/performance`)

### Evaluation Recording
```
POST /api/performance/record-evaluation
Access: Protected
```

**Request Body:**
```json
{
  "userId": "string",
  "userEmail": "string",
  "userName": "string",
  "sessionId": "string",
  "caseId": "string",
  "caseTitle": "string",
  "specialty": "string",
  "module": "string",
  "programArea": "string",
  "overallRating": "Excellent|Good|Needs Improvement",
  "criteriaScores": {"string": "number"},
  "totalScore": "number",
  "duration": "number",
  "messagesExchanged": "number"
}
```

### Performance Summary
```
GET /api/performance/summary/:userId
Access: Protected
```

**Response:**
```json
{
  "userId": "string",
  "name": "string",
  "email": "string",
  "overallStats": {
    "totalEvaluations": "number",
    "excellentCount": "number",
    "goodCount": "number",
    "needsImprovementCount": "number",
    "excellentRate": "string"
  },
  "specialtyStats": {
    "string": {
      "totalCases": "number",
      "excellentCount": "number",
      "averageScore": "number"
    }
  },
  "contributorStatus": {
    "isEligible": "boolean",
    "eligibleSpecialties": ["string"],
    "qualificationDate": "ISO8601",
    "eligibilityCriteria": {"string": "object"}
  },
  "contributionStats": {
    "totalSubmissions": "number",
    "approvedSubmissions": "number",
    "rejectedSubmissions": "number",
    "pendingSubmissions": "number"
  },
  "recentEvaluations": [
    {
      "caseTitle": "string",
      "specialty": "string",
      "rating": "string",
      "score": "number",
      "completedAt": "ISO8601"
    }
  ]
}
```

### Contributor Eligibility
```
GET /api/performance/eligibility/:userId/:specialty
Access: Protected
```

**Response:**
```json
{
  "eligible": "boolean",
  "specialty": "string",
  "criteria": {
    "excellentCount": "number",
    "recentExcellent": "boolean",
    "consistentPerformance": "boolean",
    "qualificationMet": "boolean"
  },
  "requirements": {
    "excellentRatingsNeeded": "number",
    "needsRecentExcellent": "boolean",
    "needsConsistentPerformance": "boolean"
  }
}
```

### Leaderboard
```
GET /api/performance/leaderboard
Access: Protected
Query Parameters: specialty, limit
```

**Response:**
```json
[
  {
    "userId": "string",
    "name": "string",
    "totalCases": "number",
    "excellentCount": "number",
    "excellentRate": "string",
    "averageScore": "string",
    "isContributor": "boolean"
  }
]
```

### Contribution Stats Update
```
POST /api/performance/update-contribution/:userId
Access: Protected
```

**Request Body:**
```json
{
  "status": "approved|rejected"
}
```

```
GET /api/performance/eligible-contributors/:specialty
Access: Protected
```

## Contribution Review System (`/api/admin`)

### Review Queue
```
GET /api/admin/contributed-cases
Access: Admin
Query Parameters: status, page, limit, specialty
```

**Response:**
```json
{
  "cases": [
    {
      "_id": "string",
      "contributorName": "string",
      "contributorEmail": "string",
      "status": "submitted|under_review|approved|rejected|needs_revision",
      "caseData": {
        "case_metadata": {
          "title": "string",
          "specialty": "string"
        }
      },
      "submittedAt": "ISO8601",
      "reviewComments": "string",
      "reviewedBy": "string",
      "reviewedAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

```
GET /api/admin/contributed-cases/:caseId
Access: Admin
```

### Review Actions
```
POST /api/admin/contributed-cases/:caseId/approve
Access: Admin
```

**Request Body:**
```json
{
  "reviewerId": "string",
  "reviewerName": "string",
  "reviewComments": "string"
}
```

```
POST /api/admin/contributed-cases/:caseId/reject
Access: Admin
```

```
POST /api/admin/contributed-cases/:caseId/request-revision
Access: Admin
```

**Request Body:**
```json
{
  "reviewerId": "string",
  "reviewerName": "string",
  "reviewComments": "string",
  "revisionRequests": [
    {
      "field": "string",
      "issue": "string",
      "suggestion": "string"
    }
  ]
}
```

### Bulk Operations
```
POST /api/admin/contributed-cases/bulk-action
Access: Admin
```

**Request Body:**
```json
{
  "action": "approve|reject",
  "caseIds": ["string"],
  "reviewerId": "string",
  "reviewerName": "string",
  "reviewComments": "string"
}
```

### Analytics
```
GET /api/admin/contribution-stats
Access: Admin
```

**Response:**
```json
{
  "statusStats": [
    {"_id": "string", "count": "number"}
  ],
  "topContributors": [
    {
      "_id": "string",
      "contributorName": "string",
      "contributorEmail": "string",
      "totalSubmissions": "number",
      "approved": "number",
      "rejected": "number",
      "approvalRate": "number"
    }
  ],
  "specialtyStats": [
    {
      "_id": "string",
      "total": "number",
      "approved": "number"
    }
  ]
}
```

```
GET /api/admin/review-queue
Access: Admin
```

**Response:**
```json
{
  "queueStats": [
    {
      "_id": "string",
      "count": "number",
      "oldestSubmission": "ISO8601"
    }
  ],
  "urgentCases": [
    {
      "_id": "string",
      "contributorName": "string",
      "caseData": {
        "case_metadata": {
          "title": "string",
          "specialty": "string"
        }
      },
      "submittedAt": "ISO8601"
    }
  ],
  "totalPending": "number"
}
```

## System Health
```
GET /health
Access: Public
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "ISO8601",
  "origin": "string",
  "allowedOrigins": ["string"],
  "environment": "development|production"
}
```

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "user|admin",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Case
```json
{
  "_id": "ObjectId",
  "case_metadata": {
    "case_id": "string",
    "title": "string",
    "specialty": "string",
    "program_area": "string",
    "specialized_area": "string",
    "difficulty": "string",
    "estimated_duration_min": "number",
    "tags": ["string"]
  },
  "patient_persona": {
    "name": "string",
    "age": "number",
    "gender": "string",
    "chief_complaint": "string",
    "speaks_for": "string"
  },
  "clinical_dossier": {
    "history_of_presenting_illness": {
      "associated_symptoms": ["string"]
    },
    "hidden_diagnosis": "string"
  },
  "initial_prompt": "string",
  "description": "string"
}
```

### Session
```json
{
  "_id": "ObjectId",
  "case_ref": "ObjectId",
  "original_case_id": "string",
  "history": [
    {
      "role": "string",
      "content": "string",
      "timestamp": "Date"
    }
  ],
  "sessionEnded": "boolean",
  "evaluation": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### PerformanceMetrics
```json
{
  "_id": "ObjectId",
  "session_ref": "ObjectId",
  "case_ref": "ObjectId",
  "user_ref": "ObjectId",
  "metrics": {
    "overall_score": "number",
    "performance_label": "string",
    "clinical_reasoning": "number",
    "communication": "number",
    "efficiency": "number",
    "evaluation_summary": "string"
  },
  "raw_evaluation_text": "string",
  "evaluated_at": "Date"
}
```

## Authentication Flow
1. User registers or logs in to receive JWT token
2. Token must be included in Authorization header for protected endpoints
3. Token contains user ID and role information
4. Admin endpoints require admin role verification
5. Contributor endpoints require eligibility verification

## Error Responses
All endpoints return consistent error format:
```json
{
  "error": "string",
  "message": "string",
  "status": "number"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting
- No explicit rate limiting implemented
- Consider implementing based on usage patterns
- EventSource connections should be managed appropriately

## Security Considerations
- All passwords are hashed using bcrypt
- JWT tokens should be stored securely
- CORS is configured for specific origins
- Input validation is performed on all endpoints
- Admin operations require role verification
- Contributor eligibility is enforced for case submissions

## Integration Notes
- Use EventSource for real-time simulation interactions
- Implement proper error handling and retry logic
- Consider implementing offline capabilities where appropriate
- Pagination is available on list endpoints
- Search functionality is available on user and case endpoints
- Bulk operations are supported for admin functions