# Railway Deployment Guide

## Prerequisites
1. Railway account (https://railway.app)
2. GitHub repository with your backend code

## Deployment Steps

### 1. Connect Repository
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `SimulatorBackend` folder as the root directory

### 2. Environment Variables
Set these environment variables in Railway dashboard:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `PORT` - Will be automatically set by Railway (usually 3000)

**Optional (Email features):**
- `EMAIL_NOTIFICATIONS_ENABLED=true`
- `FROM_EMAIL=noreply@yourdomain.com`
- `ADMIN_EMAIL=admin@yourdomain.com`
- `FRONTEND_URL` - Your frontend URL after deployment

**Email Service (choose one):**
- SendGrid: `SENDGRID_API_KEY`
- AWS SES: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

### 3. Domain Configuration
1. Railway will provide a default domain like `your-app-name.up.railway.app`
2. You can add a custom domain in the Railway dashboard under "Settings" > "Domains"

### 4. Database Setup
- Use MongoDB Atlas (recommended) or Railway's MongoDB addon
- Update `MONGODB_URI` with your connection string

### 5. CORS Configuration
Update your frontend URL in the CORS configuration once deployed.

## Railway-Specific Features

### Health Checks
- Railway will use `/health` endpoint for health checks
- Configured in `railway.json`

### Automatic Deployments
- Railway automatically deploys on git push to main branch
- You can configure different branches in Railway settings

### Logs
- View logs in Railway dashboard under "Deployments" tab
- Use `railway logs` CLI command for real-time logs

### Scaling
- Railway automatically handles scaling
- You can configure resource limits in the dashboard

## Troubleshooting

### Common Issues:
1. **Build failures**: Check Node.js version in `package.json` engines
2. **Environment variables**: Ensure all required vars are set
3. **Database connection**: Verify MongoDB URI and network access
4. **CORS errors**: Update CORS configuration with Railway domain

### Useful Commands:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project
railway link

# View logs
railway logs

# Open project in browser
railway open
```

## Post-Deployment
1. Test all API endpoints
2. Update frontend to use Railway backend URL
3. Test database connectivity
4. Verify email functionality (if enabled)
5. Monitor logs for any issues