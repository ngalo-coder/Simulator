# Vercel Deployment Guide

## Environment Variables
Set these in Vercel Dashboard:

- MONGODB_URI=mongodb+srv://odongolera:5cffuea7HL5OdJna@cluster0.kha1r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
- JWT_SECRET=p5686356e28bb399a404bd398b06556x
- NODE_ENV=production
- OPENAI_API_KEY=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

## Deploy Commands
```bash
npm install -g vercel
vercel login
vercel --prod
```