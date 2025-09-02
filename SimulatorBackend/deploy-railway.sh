#!/bin/bash

# Railway Deployment Script
echo "🚀 Preparing for Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Link to project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment initiated! Check Railway dashboard for status."
echo "📊 View logs: railway logs"
echo "🌐 Open project: railway open"