# Vercel Deployment Guide for Simulator Backend

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **MongoDB Database**: Set up a MongoDB Atlas cluster or use another MongoDB provider

## Environment Variables Setup

Before deploying, you need to set up the following environment variables in your Vercel project:

### Required Variables
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret for JWT token generation
- `NODE_ENV`: Set to `production`
- `PORT`: Vercel will handle this automatically

### Optional Variables (Email Configuration)
Choose one email service:

**SendGrid:**
- `SENDGRID_API_KEY`: Your SendGrid API key
- `EMAIL_NOTIFICATIONS_ENABLED`: `true`
- `FROM_EMAIL`: Your sender email address
- `ADMIN_EMAIL`: Admin notification email

**AWS SES:**
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: AWS region (e.g., `us-east-1`)

**SMTP:**
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP port (usually 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password

### Frontend Integration
- `FRONTEND_URL`: URL of your Netlify-deployed frontend
- `ADDITIONAL_ORIGINS`: Additional CORS origins if needed

## Deployment Methods

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend directory**:
   ```bash
   cd SimulatorBackend
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

5. **Follow the prompts** to set up your project

### Method 2: GitHub Integration

1. **Push your code to GitHub**
2. **Connect your GitHub repository to Vercel**
3. **Configure environment variables** in Vercel dashboard
4. **Deploy automatically** on every push to main branch

### Method 3: Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Import Project"**
3. **Select "Import Git Repository"**
4. **Choose your repository**
5. **Configure root directory as `SimulatorBackend`**
6. **Set up environment variables**

## Environment Variables in Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Navigate to **Settings > Environment Variables**
3. Add all required variables from `.env.vercel` template
4. For production, mark them all as **Production Environment Variables**

## Post-Deployment Steps

1. **Test your API endpoints**:
   - Health check: `https://your-domain.vercel.app/health`
   - API docs: `https://your-domain.vercel.app/api-docs`

2. **Update frontend configuration**:
   - Update the API base URL in your frontend to point to your Vercel domain

3. **Configure CORS**:
   - Ensure your frontend domain is included in CORS origins
   - Update `FRONTEND_URL` environment variable

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas IP whitelist if using Atlas

2. **Build Failures**:
   - Check Node.js version compatibility (requires Node 20+)
   - Verify all dependencies are in package.json

3. **CORS Issues**:
   - Ensure `FRONTEND_URL` is set correctly
   - Check `ADDITIONAL_ORIGINS` if using multiple domains

4. **Environment Variables**:
   - All variables must be set in Vercel dashboard, not in local `.env` files

### Logs and Debugging

- Use `vercel logs` to view deployment logs
- Check Vercel dashboard for build and runtime logs
- Enable detailed logging by setting `NODE_ENV=development` temporarily

## Monitoring

- Use Vercel's built-in analytics and monitoring
- Set up error tracking services if needed
- Monitor database connections and performance

## Rollback

If deployment fails:
1. Use Vercel's deployment history to rollback
2. Check logs for specific errors
3. Fix issues and redeploy

## Support

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/atlas
- Project GitHub Issues: Check project repository

---

**Note**: Remember that Vercel is a serverless platform. For database-intensive applications, ensure your MongoDB connection is optimized for serverless environments and consider connection pooling.