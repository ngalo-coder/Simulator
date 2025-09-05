# Interaction and Engagement Tracking System

## Overview

The Interaction and Engagement Tracking System provides comprehensive monitoring and analysis of user interactions within the medical simulator. It enables detailed logging of user activities, engagement pattern analysis, learning behavior insights, and personalized recommendations.

## System Architecture

### Components

1. **UserInteractionTrackingModel** - Core data model for storing interaction logs
2. **InteractionTrackingService** - Service layer for interaction tracking and basic analytics
3. **EngagementPatternService** - Advanced pattern recognition and insights generation
4. **Interaction Tracking Routes** - REST API endpoints for interaction management
5. **Enhanced AnalyticsService** - Integration with existing analytics infrastructure

## Data Models

### UserInteractionTrackingModel

**Purpose**: Stores detailed records of user interactions with the system

**Key Fields**:
- `userId`: Reference to the user
- `interactionType`: Type of interaction (case_view, case_start, case_complete, etc.)
- `timeSpentSeconds`: Duration of the interaction
- `engagementScore`: Calculated engagement metric (0-100)
- `engagementLevel`: Classification (low, medium, high, very_high)
- `resourceType`: Type of resource accessed (case, learning_module, video, etc.)
- `helpRequestType`: Category of help requested
- `performanceMetrics`: Related performance data

**Interaction Types**:
- `case_view`: User views a case
- `case_start`: User starts a case simulation
- `case_complete`: User successfully completes a case
- `case_abandon`: User abandons a case
- `resource_access`: User accesses learning resources
- `help_request`: User requests assistance
- `feedback_submit`: User submits feedback
- `navigation`: User navigates between pages
- `search`: User performs searches
- `time_spent`: Time tracking events
- `competency_update`: Competency progress updates
- `achievement_unlock`: Achievement unlocks

## Services

### InteractionTrackingService

**Primary Functions**:
- Track individual and bulk interactions
- Calculate engagement metrics
- Provide user engagement analytics
- Generate personalized recommendations
- Analyze global engagement patterns

**Key Methods**:
- `trackInteraction(interactionData)`: Log a single interaction
- `trackBulkInteractions(interactions)`: Log multiple interactions
- `getUserEngagementAnalytics(userId, options)`: Get engagement metrics
- `generatePersonalizedRecommendations(userId, options)`: Create learning recommendations

### EngagementPatternService

**Advanced Analytics**:
- Detect engagement patterns and anomalies
- Generate learning insights
- Predict future engagement and performance
- Compare user patterns with peers
- Identify risk factors and opportunities

**Key Methods**:
- `detectEngagementPatterns(userId, options)`: Analyze interaction patterns
- `generateLearningInsights(userId, options)`: Create comprehensive insights
- `predictFutureEngagement(userId, options)`: Forecast engagement trends
- `compareWithPeers(userId, options)`: Benchmark against peer group

## API Endpoints

### Interaction Tracking Routes (`/api/interaction-tracking`)

**POST /track**
- Track a single user interaction
- Requires authentication
- Body: Interaction data object

**POST /track-bulk**
- Track multiple interactions
- Requires authentication
- Body: Array of interaction objects

**GET /engagement/:userId**
- Get user engagement analytics
- Access: Student (own data), Educator, Admin
- Query params: timeRange, granularity

**GET /global-patterns**
- Get global engagement patterns
- Access: Educator, Admin
- Query params: timeRange, specialty, difficulty

**GET /learning-insights/:userId**
- Get learning behavior insights
- Access: Student (own data), Educator, Admin
- Query params: timeRange

**GET /recommendations/:userId**
- Get personalized recommendations
- Access: Student (own data), Educator, Admin
- Query params: timeRange, limit

**GET /history/:userId**
- Get interaction history
- Access: Student (own data), Educator, Admin
- Query params: limit, page

### Enhanced Analytics Endpoints

**GET /api/analytics/engagement**
- Get engagement analytics (via enhanced AnalyticsService)
- Access: Educator, Admin
- Query params: timeRange, specialty, difficulty

## Integration Examples

### Tracking a Case Start Interaction

```javascript
// Example: Tracking when a user starts a case
const interactionData = {
  interactionType: 'case_start',
  caseId: 'case-123',
  caseTitle: 'Abdominal Pain Diagnosis',
  startTime: new Date(),
  metadata: {
    difficulty: 'intermediate',
    specialty: 'emergency medicine'
  }
};

// Using the service directly
await InteractionTrackingService.trackInteraction({
  userId: currentUser._id,
  ...interactionData
});

// Or via API endpoint
fetch('/api/interaction-tracking/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(interactionData)
});
```

### Tracking Time Spent

```javascript
// Example: Tracking time spent on a resource
const startTime = new Date();
// User engages with resource...
const endTime = new Date();

const interactionData = {
  interactionType: 'time_spent',
  resourceType: 'learning_module',
  resourceId: 'module-456',
  resourceName: 'ECG Interpretation',
  startTime,
  endTime,
  timeSpentSeconds: Math.floor((endTime - startTime) / 1000)
};

await InteractionTrackingService.trackInteraction(interactionData);
```

### Generating Learning Insights

```javascript
// Example: Getting learning insights for a user
const insights = await EngagementPatternService.generateLearningInsights(
  userId,
  { timeRange: '90d' }
);

console.log(insights.engagementSummary);
console.log(insights.recommendations);
```

## Engagement Metrics Calculation

### Engagement Score Formula

The engagement score is calculated based on:
1. **Interaction Type Weight**: Different interactions have different base scores
2. **Time Spent**: Additional points for longer engagement
3. **Performance Impact**: Higher scores for successful interactions
4. **Consistency Bonus**: Regular activity increases score

### Engagement Levels

- **Low (0-39)**: Minimal engagement, potential risk
- **Medium (40-59)**: Moderate engagement, room for improvement
- **High (60-79)**: Good engagement, consistent activity
- **Very High (80-100)**: Excellent engagement, high performance

## Best Practices

### Implementation Guidelines

1. **Track Key Interactions**: Focus on meaningful events that indicate learning progress
2. **Respect Privacy**: Only collect necessary data and anonymize where possible
3. **Real-time Tracking**: Use bulk operations for high-frequency interactions
4. **Error Handling**: Implement graceful failure for tracking operations
5. **Performance Optimization**: Use caching for frequently accessed analytics

### Data Retention

- **Interaction logs**: Retain for 365 days for trend analysis
- **Aggregate analytics**: Keep indefinitely for historical comparison
- **Personal data**: Follow privacy regulations and user consent

### Monitoring and Maintenance

- Monitor tracking queue performance
- Regularly review engagement metrics
- Update interaction types as new features are added
- Validate data quality through periodic audits

## Security Considerations

- Authentication required for all tracking operations
- Users can only access their own data (unless elevated privileges)
- Rate limiting on tracking endpoints to prevent abuse
- Data encryption for sensitive interaction details

## Performance Considerations

- Use bulk operations for high-volume tracking
- Implement caching for frequently accessed analytics
- Database indexing on frequently queried fields
- Asynchronous processing for complex analytics

## Troubleshooting

### Common Issues

1. **Missing Interactions**: Verify authentication and endpoint permissions
2. **Incorrect Engagement Scores**: Check interaction data completeness
3. **Performance Issues**: Review database indexing and query optimization
4. **Data Inconsistencies**: Validate data integrity through regular checks

### Debugging Tips

- Enable detailed logging for tracking operations
- Use test users to validate tracking functionality
- Monitor system metrics during high-load periods
- Implement health checks for tracking services

## Future Enhancements

1. **Real-time Analytics**: Live dashboards for engagement monitoring
2. **Predictive Modeling**: Advanced ML for engagement forecasting
3. **Integration Tools**: APIs for third-party system integration
4. **Custom Metrics**: Configurable engagement scoring algorithms
5. **Export Capabilities**: Data export for external analysis

## Support

For technical support or questions about the interaction tracking system, contact:
- Development Team: dev@medicalsimulator.com
- Documentation: docs.medicalsimulator.com
- Issue Tracking: github.com/medicalsimulator/issues

---

*Last Updated: 2025-09-04*
*Version: 1.0.0*