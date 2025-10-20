# Service Layer Pattern

**Effective Date**: 2025-10-20
**Author**: Kilo Code System
**Review Cycle**: Quarterly

## Pattern Overview

The Service Layer pattern encapsulates business logic into dedicated service classes, providing a clean separation between API routes, data access, and complex business operations. This pattern promotes reusability, testability, and maintainability.

## Pattern Structure

```javascript
import Model from '../models/Model.js';
import RelatedService from './RelatedService.js';

export class ServiceName {
  // Static constants for configuration
  static CONFIG = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    CACHE_TTL: 300
  };

  // Static methods for utility functions
  static validateInput(data) {
    // Input validation logic
    return validationResult;
  }

  static formatOutput(data) {
    // Output formatting logic
    return formattedData;
  }

  // Instance methods for business logic
  async create(data) {
    const validatedData = this.validateInput(data);
    const result = await Model.create(validatedData);
    return this.formatOutput(result);
  }

  async getById(id) {
    const result = await Model.findById(id);
    return this.formatOutput(result);
  }

  async update(id, data) {
    const validatedData = this.validateInput(data);
    const result = await Model.findByIdAndUpdate(id, validatedData, { new: true });
    return this.formatOutput(result);
  }

  async delete(id) {
    return await Model.findByIdAndDelete(id);
  }

  // Complex business logic methods
  async complexBusinessOperation(params) {
    // Orchestrate multiple operations
    const step1 = await this.step1(params);
    const step2 = await this.step2(step1);
    return this.step3(step2);
  }
}
```

## Implementation Examples

### CaseService Implementation

```javascript
// Complex service with multiple responsibilities
export class CaseService {
  static CASE_FIELDS = [
    'case_metadata.case_id',
    'case_metadata.title',
    'case_metadata.program_area',
    'case_metadata.specialty',
    'patient_persona.age',
    'patient_persona.gender',
    'clinical_dossier.history_of_presenting_illness'
  ].join(' ');

  static buildQuery(filters) {
    const { program_area, specialty, specialized_area } = filters;
    const query = {};

    if (program_area) query['case_metadata.program_area'] = program_area;
    if (specialty) query['case_metadata.specialty'] = specialty;
    if (specialized_area) {
      query['case_metadata.specialized_area'] = specialized_area;
    }

    return query;
  }

  static formatCase(caseData) {
    const { case_metadata: meta, patient_persona: patient } = caseData;

    return {
      id: meta?.case_id,
      title: this.formatClinicalTitle(patient?.chief_complaint),
      description: this.formatDescription(patient),
      category: meta?.specialized_area,
      program_area: meta?.program_area,
      specialty: meta?.specialty
    };
  }

  static async getCases(queryParams) {
    const { page = 1, limit = 20 } = queryParams;
    const query = this.buildQuery(queryParams);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [casesFromDB, totalCases] = await Promise.all([
      Case.find(query).select(this.CASE_FIELDS).skip(skip).limit(limitNum).lean(),
      Case.countDocuments(query)
    ]);

    return {
      cases: casesFromDB.map(this.formatCase),
      currentPage: pageNum,
      totalPages: Math.ceil(totalCases / limitNum),
      totalCases
    };
  }
}
```

### AnalyticsService Implementation

```javascript
// Service focused on analytics and reporting
export class AnalyticsService {
  static CACHE_TTL = 300; // 5 minutes

  static async getUserProgress(userId, dateRange) {
    const cacheKey = `progress:${userId}:${dateRange.start}:${dateRange.end}`;

    // Check cache first
    const cached = await this.getCachedResult(cacheKey);
    if (cached) return cached;

    // Complex analytics calculation
    const progress = await this.calculateProgress(userId, dateRange);
    const trends = await this.calculateTrends(userId, dateRange);
    const insights = await this.generateInsights(progress, trends);

    const result = { progress, trends, insights };

    // Cache the result
    await this.setCachedResult(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  static async calculateProgress(userId, dateRange) {
    // Complex progress calculation logic
    const cases = await CaseProgress.find({
      userId,
      completedAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    return this.aggregateProgressData(cases);
  }
}
```

## Key Benefits

### 1. Separation of Concerns
- Business logic separated from API routes
- Data access abstracted from business operations
- Clear responsibility boundaries between layers

### 2. Reusability
- Services can be used across multiple API endpoints
- Business logic can be shared between different interfaces
- Common operations centralized in service methods

### 3. Testability
- Services can be unit tested in isolation
- Mock dependencies for focused testing
- Clear input/output contracts for testing

### 4. Maintainability
- Changes to business logic centralized in services
- Easier to locate and modify specific functionality
- Reduced coupling between components

## Usage Guidelines

### 1. Service Organization
- One service class per major business domain
- Group related functionality within services
- Keep services focused on single responsibilities

### 2. Method Design
- Use static methods for stateless operations
- Instance methods for stateful business processes
- Clear, descriptive method names
- Consistent parameter patterns

### 3. Error Handling
- Implement comprehensive error handling
- Use custom error types for different scenarios
- Provide meaningful error messages
- Log errors with appropriate context

### 4. Data Validation
- Validate all input parameters
- Sanitize data before processing
- Use schema validation for complex objects
- Provide clear validation error messages

## Common Patterns

### Query Builder Pattern

```javascript
// Encapsulate complex query logic
static buildFilterQuery(filters) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.dateRange) {
    query.createdAt = {
      $gte: filters.dateRange.start,
      $lte: filters.dateRange.end
    };
  }

  if (filters.category) {
    query.category = { $in: filters.category };
  }

  return query;
}
```

### Data Transformation Pattern

```javascript
// Standardize data formatting
static formatForAPI(data) {
  return {
    id: data._id,
    name: data.name,
    description: data.description,
    metadata: {
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.__v
    }
  };
}

static formatForStorage(data) {
  return {
    name: data.name,
    description: data.description,
    tags: data.tags || []
  };
}
```

### Caching Pattern

```javascript
// Implement caching within services
static async getCachedData(key, ttl = 300) {
  const cached = await CacheService.get(key);
  if (cached) return cached;

  const data = await this.fetchFreshData();
  await CacheService.set(key, data, ttl);

  return data;
}
```

## Integration Points

### Route Integration

```javascript
// Clean separation between routes and business logic
router.get('/cases', async (req, res) => {
  try {
    const cases = await CaseService.getCases(req.query);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Service Dependencies

```javascript
// Manage dependencies between services
export class ComplexService {
  constructor() {
    this.caseService = new CaseService();
    this.analyticsService = new AnalyticsService();
  }

  async generateReport(caseId) {
    const caseData = await this.caseService.getById(caseId);
    const analytics = await this.analyticsService.getCaseAnalytics(caseId);

    return this.combineData(caseData, analytics);
  }
}
```

## Best Practices

### 1. Service Design
- Keep services focused and cohesive
- Avoid god objects with too many responsibilities
- Use dependency injection for service dependencies
- Implement proper error handling and logging

### 2. Performance Considerations
- Implement caching for expensive operations
- Use database indexes for frequently queried fields
- Optimize queries and aggregations
- Consider pagination for large datasets

### 3. Security
- Validate all inputs thoroughly
- Implement proper authorization checks
- Sanitize data before storage and output
- Use parameterized queries to prevent injection

### 4. Monitoring
- Log service method entry and exit
- Track performance metrics
- Monitor error rates and patterns
- Implement health checks

## Testing Strategy

### Unit Testing

```javascript
describe('CaseService', () => {
  describe('buildQuery', () => {
    it('should build correct query for program area filter', () => {
      const filters = { program_area: 'Basic Program' };
      const query = CaseService.buildQuery(filters);

      expect(query).toEqual({
        'case_metadata.program_area': 'Basic Program'
      });
    });
  });

  describe('formatCase', () => {
    it('should format case data correctly', () => {
      const caseData = { /* mock case data */ };
      const formatted = CaseService.formatCase(caseData);

      expect(formatted).toHaveProperty('id');
      expect(formatted).toHaveProperty('title');
      expect(formatted).toHaveProperty('description');
    });
  });
});
```

### Integration Testing

```javascript
describe('CaseService Integration', () => {
  it('should retrieve cases from database', async () => {
    const result = await CaseService.getCases({ page: 1, limit: 10 });

    expect(result).toHaveProperty('cases');
    expect(result).toHaveProperty('currentPage');
    expect(result).toHaveProperty('totalPages');
    expect(result).toHaveProperty('totalCases');
  });
});
```

## Related Files
- [CaseService Implementation](../../../SimulatorBackend/src/services/CaseService.js)
- [AnalyticsService Implementation](../../../SimulatorBackend/src/services/AnalyticsService.js)
- [Service Layer Architecture](../../../SimulatorBackend/src/services/)
- [API Route Integration](../../../SimulatorBackend/src/routes/)

## Success Metrics
- Service method response time < 100ms (average)
- Service test coverage > 90%
- Error rate < 0.1% per service method
- Code reuse rate > 70% across services
- Service method complexity < 10 (cyclomatic complexity)