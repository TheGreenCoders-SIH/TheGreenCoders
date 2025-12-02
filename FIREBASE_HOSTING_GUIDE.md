# Firebase Hosting Guide

This guide outlines the steps to host your website on Firebase and how to update the deployment after making changes.

## Prerequisites

Ensure you have the Firebase CLI installed and are logged in:

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
npx firebase login
```

## Initial Setup (Already Completed)

*Note: These steps have already been configured for this project.*

1.  Initialize Firebase in your project: `npx firebase init`
2.  Select **Hosting**.
3.  Select your project (`thegreencoders`).
4.  Set public directory to `dist`.
5.  Configure as a single-page app (Yes).

## How to Deploy (Standard Procedure)

Whenever you want to push your latest code to the live website, follow these two steps:

### 1. Build the Application

This compiles your React code into static files in the `dist` folder.

```bash
npm run build
```

### 2. Deploy to Firebase

This uploads the contents of the `dist` folder to Firebase Hosting.

```bash
npx firebase deploy --only hosting
```

---

## Summary of Commands

| Action | Command |
| :--- | :--- |
| **Build** | `npm run build` |
| **Deploy** | `npx firebase deploy --only hosting` |
| **Build & Deploy** | `npm run build && npx firebase deploy --only hosting` |

## Troubleshooting

-   **Login Issues**: If you get permission errors, try running `npx firebase login --reauth`.
-   **Changes Not Showing**: Ensure you ran `npm run build` *before* deploying. Firebase deploys the `dist` folder, so it must be updated first.

---

## Backend Deployment

The frontend is now hosted on Firebase, but the **backend (FastAPI) needs separate deployment**. 

### Quick Setup

1. **Deploy Backend to Google Cloud Run** (see [BACKEND_DEPLOYMENT_GUIDE.md](file:///d:/Files/Anmol/SIH%20Hackathon/2025/The_GreenCoders_Project/BACKEND_DEPLOYMENT_GUIDE.md))
2. **Update `.env` file** with your Cloud Run URL:
   ```env
   VITE_ML_API_URL=https://your-backend-url.run.app
   ```
3. **Rebuild and redeploy frontend**:
   ```bash
   npm run build
   npx firebase deploy --only hosting
   ```

### Environment Variables

Your `.env` file should contain:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_ML_API_URL=https://your-cloud-run-backend-url.run.app
```

> **Note**: For local development, keep `VITE_ML_API_URL=http://localhost:8000`. For production deployment, update it to your Cloud Run URL.
