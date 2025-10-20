# API Service Pattern

**Effective Date**: 2025-10-17  
**Author**: Kilo Code System  
**Review Cycle**: Monthly

## Pattern Overview

This pattern defines the standard structure for API service classes in the frontend, ensuring consistent error handling, authentication, and data transformation.

## Pattern Structure

```typescript
// Base API Service Pattern
class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.authToken = localStorage.getItem('authToken');
  }

  // Standard HTTP methods with error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
```

## Implementation Examples

### User Service
```typescript
// Example: UserService implementation
class UserService extends ApiService {
  constructor() {
    super('/api/users');
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.get<UserProfile>(`/${userId}/profile`);
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.put<UserProfile>(`/${userId}/profile`, data);
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    return this.get<UserProgress>(`/${userId}/progress`);
  }
}
```

### Case Service
```typescript
// Example: CaseService implementation
class CaseService extends ApiService {
  constructor() {
    super('/api/cases');
  }

  async getCasesBySpecialty(specialtyId: string): Promise<Case[]> {
    return this.get<Case[]>(`/specialty/${specialtyId}`);
  }

  async createCase(caseData: CreateCaseRequest): Promise<Case> {
    return this.post<Case>('/', caseData);
  }

  async updateCase(caseId: string, caseData: Partial<Case>): Promise<Case> {
    return this.put<Case>(`/${caseId}`, caseData);
  }
}
```

## Key Benefits

### 1. Consistency
- Standardized error handling across all services
- Uniform authentication token management
- Consistent request/response formatting

### 2. Maintainability
- Centralized HTTP logic
- Easy to add new methods
- Single point for configuration changes

### 3. Type Safety
- Generic TypeScript support
- Compile-time type checking
- Better IDE support

## Usage Guidelines

### 1. Service Creation
- Extend the base `ApiService` class
- Define service-specific endpoints
- Use TypeScript interfaces for request/response types

### 2. Error Handling
- Implement try-catch blocks in calling code
- Provide user-friendly error messages
- Log errors for debugging

### 3. Authentication
- Store auth token in localStorage
- Automatically include token in requests
- Handle token expiration gracefully

## Related Files
- [Frontend API Service](../../../simulatorfrontend/src/services/apiService.ts)
- [Backend Route Handlers](../../../SimulatorBackend/src/routes/)
- [Authentication System](../../../SimulatorBackend/docs/Authentication_System.md)
- [Error Boundary Pattern](../patterns/error-boundary-pattern.md)
- [Service Layer Pattern](../patterns/service-layer-pattern.md)
- [Case Creation Workflow](../workflows/case-creation-workflow.md)

## Best Practices
1. Always use TypeScript interfaces for type safety
2. Implement proper error boundaries in React components
3. Use environment variables for API base URLs
4. Implement request caching where appropriate
5. Add request/response interceptors for logging