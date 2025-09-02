# Vercel Deployment Guide

## Environment Variables to Set in Vercel Dashboard

Go to your Vercel project settings > Environment Variables and add:

```
MONGODB_URI=your-mongodb-connection-string-here
PORT=5003
JWT_SECRET=p5686356e28bb399a404bd398b06556x
OPENROUTER_API_KEY=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
OPENAI-API_KEY=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
EMAIL_NOTIFICATIONS_ENABLED=true
FROM_EMAIL=noreply@medicalsimulator.com
ADMIN_EMAIL=admin@medicalsimulator.com
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_VERSION=20.14.0
SENDGRID_API_KEY=your-sendgrid-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Deployment Steps

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

## Important Notes

- Vercel functions have a 30-second timeout limit
- Database connections should use connection pooling
- Static files are served automatically
- Environment variables must be set in Vercel dashboard

## CORS Configuration

Update your frontend URL in the CORS configuration after deployment.