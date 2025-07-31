# Production Setup Guide

## Issue: /cases endpoint not showing cases in production

The `/template-cases` endpoint works but `/cases` doesn't display cases because the database migration hasn't been run in the production environment.

## Solution Steps

### 1. Check Database Status

Run this command in production to check if cases exist:

```bash
npm run check-db
```

This will:
- Connect to the production MongoDB
- Check how many template cases exist
- Show sample cases if they exist
- Automatically run migration if no cases found

### 2. Manual Migration (if needed)

If the check shows 0 cases, run the migration:

```bash
npm run migrate-cases
```

### 3. Verify Environment Variables

Ensure these environment variables are set in production:

```bash
MONGODB_URI=your_production_mongodb_uri
NODE_ENV=production
```

### 4. Test API Endpoints

After migration, test these endpoints:

- `GET /api/template-simulations/cases` - Should return 91 cases
- `GET /health` - Should show database connection status

### 5. Frontend Verification

The frontend `/cases` route should now display all template cases because:

1. `CaseSelection` component calls `simulationAPI.getTemplateCases()`
2. This calls `/api/template-simulations/cases`
3. Which queries the `templatecases` collection in MongoDB

## Common Issues

### Database Connection
- Verify MongoDB URI is correct
- Check network connectivity
- Ensure database user has read/write permissions

### Migration Errors
- Check if `case_100.json` file exists
- Verify file permissions
- Check MongoDB disk space

### API Routing
- Ensure gateway is proxying correctly
- Check CORS settings
- Verify service URLs in gateway configuration

## Database Schema

Template cases are stored in:
- **Database**: `ai_patient_sim_simulations`
- **Collection**: `templatecases`
- **Documents**: 91 cases with sanitized titles and filtered tags

## Monitoring

Check these logs for issues:
- Gateway logs: Proxy requests to simulation service
- Simulation service logs: Database queries and case retrieval
- Frontend logs: API calls and error messages

## Rollback Plan

If issues persist:
1. Check if old regular simulation cases API is available
2. Temporarily switch frontend to use regular cases
3. Debug template cases in staging environment first