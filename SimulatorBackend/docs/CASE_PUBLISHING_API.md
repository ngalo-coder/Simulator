# Case Publishing & Distribution API Documentation

## Overview

The Case Publishing API provides comprehensive functionality for managing the publication, distribution, and access control of medical simulation cases. This system enables educators and administrators to publish cases with rich metadata, control access levels, track usage, and provide personalized recommendations.

## API Base URL

```
/api/publishing
```

## Authentication

All endpoints requiring authentication use JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Published Cases

**GET** `/cases`

Retrieve published cases with advanced filtering, search, and pagination.

#### Query Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `query` | string | Search query for case title, specialty, description, or tags | No |
| `specialties` | string[] | Filter by specialties (comma-separated) | No |
| `difficulties` | string[] | Filter by difficulty levels (comma-separated) | No |
| `programAreas` | string[] | Filter by program areas (comma-separated) | No |
| `locations` | string[] | Filter by locations (comma-separated) | No |
| `tags` | string[] | Filter by tags (comma-separated) | No |
| `accessLevel` | string | Filter by access level (public, restricted, private) | No |
| `targetAudience` | object[] | Filter by target audience (JSON array) | No |
| `dateFrom` | string | Filter cases published after this date (ISO format) | No |
| `dateTo` | string | Filter cases published before this date (ISO format) | No |
| `sortBy` | string | Sort field (publishedAt, title, difficulty, rating, usage) | No |
| `sortOrder` | string | Sort order (asc, desc) | No |
| `page` | number | Page number for pagination | No |
| `limit` | number | Number of items per page | No |

#### Example Request

```bash
GET /api/publishing/cases?query=cardiology&specialties=cardiology&difficulties=intermediate&page=1&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "_id": "case_id",
        "case_metadata": {
          "title": "Acute Myocardial Infarction",
          "difficulty": "intermediate",
          "specialty": "cardiology",
          "estimated_duration": 45
        },
        "publicationMetadata": {
          "accessLevel": "restricted",
          "publishedAt": "2024-01-15T10:30:00.000Z",
          "targetAudience": [
            { "discipline": "medicine", "specialty": "cardiology" }
          ]
        },
        "createdBy": {
          "username": "dr_smith",
          "profile": { "firstName": "John", "lastName": "Smith" }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalAvailable": 50,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Case Recommendations

**GET** `/cases/recommendations`

Get personalized case recommendations based on user profile.

#### Query Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `limit` | number | Number of recommendations to return (default: 10) | No |

#### Authentication
Required

#### Example Request

```bash
GET /api/publishing/cases/recommendations?limit=5
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "recommended_case_id",
      "case_metadata": {
        "title": "Recommended Cardiology Case",
        "difficulty": "intermediate",
        "specialty": "cardiology"
      },
      "averageRating": 4.5,
      "usageCount": 150
    }
  ]
}
```

### 3. Get Popular Cases

**GET** `/cases/popular`

Get the most popular published cases based on usage and ratings.

#### Query Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `limit` | number | Number of cases to return (default: 10) | No |

#### Example Request

```bash
GET /api/publishing/cases/popular?limit=5
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "popular_case_id",
      "case_metadata": {
        "title": "Popular Emergency Case",
        "difficulty": "advanced"
      },
      "averageRating": 4.8,
      "usageCount": 300
    }
  ]
}
```

### 4. Check Case Access

**GET** `/cases/:id/access`

Check access permissions for a specific case.

#### Path Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `id` | string | Case ID | Yes |

#### Example Request

```bash
GET /api/publishing/cases/507f1f77bcf86cd799439011/access
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "accessible": true,
    "reason": "",
    "requiresAuth": false,
    "availableFrom": "2024-01-15T10:30:00.000Z",
    "availableUntil": null
  }
}
```

### 5. Publish Case

**POST** `/cases/:id/publish`

Publish a case with publication metadata.

#### Path Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `id` | string | Case ID to publish | Yes |

#### Request Body

```json
{
  "accessLevel": "restricted",
  "availableFrom": "2024-01-15T10:30:00.000Z",
  "availableUntil": "2024-12-31T23:59:59.000Z",
  "targetAudience": [
    { "discipline": "medicine", "specialty": "cardiology" }
  ],
  "licensing": {
    "type": "educational",
    "attributionRequired": true,
    "commercialUse": false
  },
  "distributionChannels": ["platform", "mobile"],
  "version": "1.0.0",
  "doi": "10.1234/simuatech.2024.001",
  "isbn": "978-3-16-148410-0",
  "citation": "Author, A. (2024). Case Title. Simuatech Platform."
}
```

#### Authentication
Required (Educator or Admin role)

#### Permissions
`publish_cases`

#### Example Request

```bash
POST /api/publishing/cases/507f1f77bcf86cd799439011/publish
Content-Type: application/json
Authorization: Bearer <educator_token>

{
  "accessLevel": "restricted",
  "targetAudience": [
    { "discipline": "medicine", "specialty": "cardiology" }
  ]
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Case published successfully",
  "data": {
    "_id": "case_id",
    "status": "published",
    "publicationMetadata": {
      "accessLevel": "restricted",
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 6. Unpublish Case

**POST** `/cases/:id/unpublish`

Unpublish/archive a published case.

#### Path Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `id` | string | Case ID to unpublish | Yes |

#### Request Body

```json
{
  "reason": "Case content needs revision"
}
```

#### Authentication
Required (Educator or Admin role)

#### Permissions
`publish_cases`

#### Example Request

```bash
POST /api/publishing/cases/507f1f77bcf86cd799439011/unpublish
Content-Type: application/json
Authorization: Bearer <educator_token>

{
  "reason": "Content revision required"
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Case unpublished successfully",
  "data": {
    "_id": "case_id",
    "status": "archived",
    "archivedAt": "2024-01-16T14:22:00.000Z"
  }
}
```

### 7. Get Distribution Statistics

**GET** `/stats`

Get case distribution statistics (Admin only).

#### Authentication
Required (Admin role)

#### Example Request

```bash
GET /api/publishing/stats
Authorization: Bearer <admin_token>
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "totalPublished": 150,
    "totalUsage": 4500,
    "averageRating": 4.2,
    "specialtyDistribution": {
      "cardiology": 35,
      "emergency_medicine": 28,
      "pediatrics": 22
    },
    "difficultyDistribution": {
      "beginner": 45,
      "intermediate": 75,
      "advanced": 30
    },
    "accessLevelDistribution": {
      "public": 60,
      "restricted": 75,
      "private": 15
    }
  }
}
```

### 8. Track Case Usage

**POST** `/cases/:id/track-usage`

Track when a user accesses a case.

#### Path Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `id` | string | Case ID | Yes |

#### Authentication
Required

#### Example Request

```bash
POST /api/publishing/cases/507f1f77bcf86cd799439011/track-usage
Authorization: Bearer <user_token>
```

#### Example Response

```json
{
  "success": true,
  "message": "Case usage tracked successfully"
}
```

### 9. Get Published Case

**GET** `/cases/:id`

Get a published case with access control.

#### Path Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `id` | string | Case ID | Yes |

#### Example Request

```bash
GET /api/publishing/cases/507f1f77bcf86cd799439011
Authorization: Bearer <user_token>
```

#### Example Response (Success)

```json
{
  "success": true,
  "data": {
    "_id": "case_id",
    "case_metadata": {
      "title": "Acute Myocardial Infarction",
      "difficulty": "intermediate"
    },
    "patient_persona": {
      "name": "John Smith",
      "age": 58
    }
  }
}
```

#### Example Response (Access Denied)

```json
{
  "success": false,
  "message": "Access denied - Private case",
  "requiresAuth": false
}
```

## Access Control Levels

### Public
- Accessible to anyone without authentication
- No user profile requirements
- Ideal for promotional or sample cases

### Restricted
- Requires user authentication
- User must match target audience criteria (discipline/specialty)
- Most common access level for educational content

### Private
- Requires authentication
- Only accessible to case owner and collaborators
- For draft content or exclusive distribution

## Publication Status Lifecycle

1. **Draft** - Case is being created/edited
2. **Pending Review** - Submitted for quality review
3. **Approved** - Passed review, ready for publication
4. **Published** - Live and accessible to users
5. **Archived** - Unpublished but retained
6. **Rejected** - Failed quality review

## Error Responses

### Common Error Codes

| Code | Description | Possible Reasons |
|------|-------------|------------------|
| 400 | Bad Request | Invalid parameters, malformed JSON |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions or role |
| 404 | Not Found | Case or resource not found |
| 500 | Internal Server Error | Server-side processing error |

### Example Error Response

```json
{
  "success": false,
  "message": "Failed to publish case",
  "error": "Case must be approved before publication"
}
```

## Best Practices

### For Case Publication
1. Set appropriate access levels based on content sensitivity
2. Define clear target audiences for better recommendations
3. Use meaningful licensing information
4. Set availability dates for time-sensitive content
5. Include proper citation information for academic cases

### For API Integration
1. Always check access before attempting to load case content
2. Use the recommendations endpoint for personalized user experiences
3. Track case usage to improve analytics and recommendations
4. Handle access denied responses gracefully in your UI
5. Cache case metadata where appropriate to reduce API calls

## Rate Limiting

The publishing API follows the same rate limiting as other endpoints:
- 100 requests per 15-minute window per IP address
- Authentication increases limits for authenticated users
- Critical endpoints may have additional protections

## Versioning

API version is managed through the URL path. Current version: v1

```
/api/publishing/v1/cases
```

Backward compatibility is maintained for at least 6 months after new versions are released.

## Support

For API support and questions:
- Check the [API Status Dashboard](https://status.simuatech.com)
- Open a support ticket in the admin dashboard
- Email: api-support@simuatech.com
- Documentation updates: docs.simuatech.com/api/publishing