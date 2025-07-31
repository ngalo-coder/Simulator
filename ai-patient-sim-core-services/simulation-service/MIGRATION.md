# Template Cases Database Migration

This document explains how to migrate template cases from JSON files to the MongoDB database.

## Overview

The system has been updated to store template cases in MongoDB instead of JSON files. This provides better:
- Scalability
- Query performance
- Data management
- Concurrent access
- Backup and recovery

## Migration Process

### 1. Prerequisites

Ensure you have:
- MongoDB running and accessible
- Environment variables configured in `.env`
- All dependencies installed (`npm install`)

### 2. Run the Migration

Execute the migration script:

```bash
npm run migrate-cases
```

Or run directly:

```bash
node src/scripts/migrateTemplateCases.js
```

### 3. Verify Migration

The script will output:
- Number of cases processed
- Success/failure counts
- Sample migrated cases
- Total cases in database

### 4. Database Schema

Template cases are stored with the following structure:

```javascript
{
  caseId: String,           // Unique identifier
  title: String,            // Case title
  programArea: String,      // Basic/Specialty Program
  specialty: String,        // Medical specialty
  difficulty: String,       // Easy/Intermediate/Hard
  tags: [String],          // Search tags
  location: String,        // Geographic location
  patientPersona: {        // Patient information
    name: String,
    age: Mixed,
    gender: String,
    // ... more fields
  },
  clinicalDossier: {       // Clinical information
    hiddenDiagnosis: String,
    // ... detailed clinical data
  },
  // ... additional fields
}
```

## API Changes

### Template Cases Endpoint
- `GET /api/template-simulations/cases` - Now queries database
- Supports all existing filters
- Returns same format as before

### New Management Endpoints (Admin Only)
- `GET /api/template-cases/stats` - Case statistics
- `POST /api/template-cases/create` - Create new case
- `PUT /api/template-cases/:caseId` - Update case
- `DELETE /api/template-cases/:caseId` - Delete case
- `GET /api/template-cases/:caseId/details` - Get full case details
- `POST /api/template-cases/bulk-import` - Import multiple cases

## Benefits

1. **Performance**: Database queries are faster than file parsing
2. **Scalability**: Can handle thousands of cases efficiently
3. **Concurrent Access**: Multiple users can access cases simultaneously
4. **Data Integrity**: Database constraints ensure data quality
5. **Backup**: Cases are included in database backups
6. **Management**: Admin interface for case management
7. **Search**: Advanced search capabilities with indexing

## Rollback

If you need to rollback to JSON files:
1. Keep the original `case_templates.json` file
2. Revert the `TemplateCaseService` changes
3. Update the service to use file-based loading

## Troubleshooting

### Migration Fails
- Check MongoDB connection
- Verify environment variables
- Ensure sufficient disk space
- Check for duplicate case IDs

### Cases Not Loading
- Verify database connection
- Check case data integrity
- Review server logs for errors

### Performance Issues
- Ensure database indexes are created
- Monitor database performance
- Consider adding more indexes for specific queries

## Maintenance

### Adding New Cases
Use the admin API endpoints or create cases programmatically:

```javascript
const templateCaseService = new TemplateCaseService();
await templateCaseService.createCase(caseData);
```

### Updating Cases
```javascript
await templateCaseService.updateCase(caseId, updateData);
```

### Backup
Include template cases in your MongoDB backup strategy:

```bash
mongodump --db ai_patient_sim_simulations --collection templatecases
```

## Support

For issues with migration or database operations, check:
1. Server logs
2. MongoDB logs
3. Network connectivity
4. Database permissions