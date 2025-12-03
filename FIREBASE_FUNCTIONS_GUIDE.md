# Firebase Cloud Functions Deployment Guide

This guide explains how to deploy your FastAPI backend to Firebase Cloud Functions (2nd Gen).

## Prerequisites

1. **Blaze Plan**: You MUST upgrade your Firebase project to the Blaze (pay-as-you-go) plan.
   - Cloud Functions (2nd Gen) requires billing to be enabled.
   - It includes a generous free tier (2 million invocations/month).
   - Upgrade here: https://console.firebase.google.com/project/thegreencoders/usage/details

2. **Python 3.11**: Ensure Python 3.11 is installed locally if you want to test functions locally.

## Deployment Steps

### 1. Deploy Functions

```bash
npx firebase deploy --only functions
```

This command will:
- Package the `functions` directory
- Upload it to Google Cloud Build
- Deploy it as a Cloud Function named `api`

### 2. Get Function URL

After deployment, you'll see a URL like:
`https://api-xxxxx-uc.a.run.app`

### 3. Update Frontend

Update your `.env` file:

```env
VITE_ML_API_URL=https://api-xxxxx-uc.a.run.app
```

### 4. Redeploy Frontend

```bash
npm run build
npx firebase deploy --only hosting
```

## Local Development

To run functions locally:

```bash
cd functions
pip install -r requirements.txt
python main.py
```
*Note: This runs the wrapper. For better dev experience, just run the original backend:*
```bash
cd backend
python -m uvicorn main:app --reload
```

## Troubleshooting

### Billing Error
If you see `HTTP Error: 400, Billing account for project... is not enabled`, you must upgrade to the Blaze plan.

### Deployment Fails
Check the logs:
```bash
npx firebase functions:log
```

### Missing Dependencies
Ensure all packages used in `backend/` are listed in `functions/requirements.txt`.
