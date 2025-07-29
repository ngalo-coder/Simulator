# Deployment Troubleshooting Checklist

## Issues Fixed:
1. ✅ Added missing `mongoose` import in simulation routes
2. ✅ Fixed simulation service URL in gateway (ai-patient-sim-simulation-service.onrender.com)
3. ✅ Added better error handling and logging for cases endpoint
4. ✅ Temporarily removed auth requirement for cases endpoint (for debugging)
5. ✅ Enhanced test endpoint with persona information

## To Test After Deployment:

### 1. Test Gateway Health
```bash
curl https://ai-patient-sim-gateway.onrender.com/health
```

### 2. Test Simulation Service Health
```bash
curl https://ai-patient-sim-gateway.onrender.com/health/simulations
```

### 3. Test Cases Endpoint
```bash
curl https://ai-patient-sim-gateway.onrender.com/api/simulations/cases
```

### 4. Test Direct Simulation Service
```bash
curl https://ai-patient-sim-simulation-service.onrender.com/health
```

## Common Issues to Check:

### Environment Variables
- ✅ REACT_APP_API_GATEWAY_URL set in Netlify
- ⚠️ Check OPENROUTER_API_KEY in Render dashboard
- ⚠️ Verify all service URLs are correct

### Service URLs
- Gateway: https://ai-patient-sim-gateway.onrender.com
- Simulation: https://ai-patient-sim-simulation-service.onrender.com
- Frontend: https://simuatech.netlify.app

### CORS Configuration
- ✅ Frontend URL added to all services
- ✅ Gateway URL added to simulation service

### Database Connection
- ⚠️ Check MongoDB connection string
- ⚠️ Verify database is accessible from Render

## Next Steps:
1. Deploy these changes
2. Test each endpoint above
3. Check browser console for any remaining errors
4. Re-enable authentication once basic connectivity works