# Complete Deployment Guide

This is a quick reference for deploying both frontend and backend.

## Prerequisites

- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud CLI: Install from https://cloud.google.com/sdk/docs/install
- Authenticated accounts: `npx firebase login` and `gcloud auth login`

## Initial Setup (One-Time)

### 1. Deploy Backend to Google Cloud Run

```bash
# Set project
gcloud config set project thegreencoders

# Deploy backend (replace YOUR_API_KEY with actual Gemini API key)
gcloud run deploy greencoders-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_GEMINI_API_KEY=YOUR_API_KEY
```

After deployment, you'll get a URL like: `https://greencoders-backend-xxxxx-as.a.run.app`

### 2. Update Frontend Environment

Edit `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_ML_API_URL=https://greencoders-backend-xxxxx-as.a.run.app
```

### 3. Deploy Frontend to Firebase

```bash
npm run build
npx firebase deploy --only hosting
```

Your app is now live at: `https://thegreencoders.web.app`

---

## Updating After Changes

### Frontend Changes Only

```bash
npm run build
npx firebase deploy --only hosting
```

### Backend Changes Only

```bash
gcloud run deploy greencoders-backend \
  --source . \
  --region asia-south1
```

### Both Frontend and Backend

```bash
# Update backend
gcloud run deploy greencoders-backend --source . --region asia-south1

# Update frontend
npm run build
npx firebase deploy --only hosting
```

---

## Quick Commands Reference

| Task | Command |
| :--- | :--- |
| **Deploy Frontend** | `npm run build && npx firebase deploy --only hosting` |
| **Deploy Backend** | `gcloud run deploy greencoders-backend --source . --region asia-south1` |
| **View Backend Logs** | `gcloud run logs read greencoders-backend --region asia-south1` |
| **Test Backend Locally** | `cd backend && python -m uvicorn main:app --reload` |
| **Test Frontend Locally** | `npm run dev` |

---

## Environment Variables

### Frontend (.env)
- `VITE_GEMINI_API_KEY` - Gemini API key
- `VITE_OPENWEATHER_API_KEY` - OpenWeather API key
- `VITE_ML_API_URL` - Backend URL (localhost for dev, Cloud Run URL for production)

### Backend (Cloud Run)
Set via: `gcloud run services update greencoders-backend --set-env-vars KEY=value`
- `VITE_GEMINI_API_KEY` - Gemini API key

---

## URLs

- **Frontend (Production)**: https://thegreencoders.web.app
- **Backend (Production)**: https://greencoders-backend-xxxxx-as.a.run.app
- **Frontend (Local)**: http://localhost:5173
- **Backend (Local)**: http://localhost:8000
