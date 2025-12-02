# Backend Deployment Guide (Google Cloud Run)

This guide explains how to deploy your FastAPI backend to Google Cloud Run, which integrates seamlessly with Firebase.

## Why Google Cloud Run?

- **Serverless**: Auto-scales to zero when not in use (cost-effective)
- **Container-based**: Works with your existing FastAPI code
- **Fast deployment**: Simple Docker-based deployment
- **Firebase integration**: Same Google Cloud ecosystem

## Prerequisites

1. **Google Cloud Account**: Use the same account as your Firebase project
2. **gcloud CLI**: Install from https://cloud.google.com/sdk/docs/install

## Step 1: Install Google Cloud CLI

```bash
# Download and install from:
# https://cloud.google.com/sdk/docs/install

# After installation, authenticate
gcloud auth login

# Set your project (use the same project ID as Firebase)
gcloud config set project thegreencoders
```

## Step 2: Build and Deploy

### Option A: Deploy Directly (Recommended)

```bash
# Deploy to Cloud Run (builds and deploys in one command)
gcloud run deploy greencoders-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_GEMINI_API_KEY=your_api_key_here
```

### Option B: Build Docker Image Locally First

```bash
# Build the Docker image
docker build -t greencoders-backend .

# Test locally
docker run -p 8080:8080 --env-file .env greencoders-backend

# Tag for Google Container Registry
docker tag greencoders-backend gcr.io/thegreencoders/greencoders-backend

# Push to GCR
docker push gcr.io/thegreencoders/greencoders-backend

# Deploy to Cloud Run
gcloud run deploy greencoders-backend \
  --image gcr.io/thegreencoders/greencoders-backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_GEMINI_API_KEY=your_api_key_here
```

## Step 3: Get Your Backend URL

After deployment, Cloud Run will provide a URL like:
```
https://greencoders-backend-xxxxx-as.a.run.app
```

## Step 4: Update Frontend API URLs

You need to update your frontend code to use the deployed backend URL instead of `localhost:8000`.

### Create Environment Variable

Create/update `.env` in your project root:

```env
VITE_API_URL=https://greencoders-backend-xxxxx-as.a.run.app
```

### Update API Calls in Frontend

In your frontend files (`src/lib/gemini.js`, `src/lib/aiRecommendations.js`, `src/lib/geminiVision.js`), replace:

```javascript
const API_URL = 'http://localhost:8000';
```

With:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Step 5: Redeploy Frontend

After updating the API URL:

```bash
npm run build
npx firebase deploy --only hosting
```

## Environment Variables

Set environment variables in Cloud Run:

```bash
gcloud run services update greencoders-backend \
  --set-env-vars VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Updating After Code Changes

Whenever you make changes to the backend:

```bash
# Redeploy (Cloud Run will rebuild automatically)
gcloud run deploy greencoders-backend \
  --source . \
  --region asia-south1
```

## Monitoring and Logs

```bash
# View logs
gcloud run logs read greencoders-backend --region asia-south1

# View service details
gcloud run services describe greencoders-backend --region asia-south1
```

## Cost Optimization

Cloud Run pricing:
- **Free tier**: 2 million requests/month
- **Pay per use**: Only charged when requests are being processed
- **Auto-scales to zero**: No cost when idle

## Troubleshooting

### CORS Errors
The backend is already configured to allow requests from your Firebase Hosting domain (`thegreencoders.web.app`).

### 404 Errors
Ensure the API URL in your frontend matches the Cloud Run URL exactly.

### Environment Variables Not Working
Use `gcloud run services update` to set environment variables, not the `.env` file.

## Summary

| Step | Command |
| :--- | :--- |
| **Deploy Backend** | `gcloud run deploy greencoders-backend --source . --region asia-south1 --allow-unauthenticated` |
| **Update Backend** | Same as deploy |
| **View Logs** | `gcloud run logs read greencoders-backend --region asia-south1` |
| **Set Env Vars** | `gcloud run services update greencoders-backend --set-env-vars KEY=value` |
