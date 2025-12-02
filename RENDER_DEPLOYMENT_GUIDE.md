# Backend Deployment on Render.com (Free)

Since Google Cloud Run requires billing to be enabled, we'll use **Render.com** which offers a generous free tier without requiring credit card information.

## Why Render.com?

- ✅ **Free tier** - No credit card required
- ✅ **Easy deployment** - Deploy from GitHub in minutes
- ✅ **Auto-deploy** - Automatically redeploys when you push to GitHub
- ✅ **Works with FastAPI** - Native Python support

## Prerequisites

1. GitHub account
2. Render.com account (free) - Sign up at https://render.com

## Step 1: Push Your Code to GitHub

If you haven't already, push your project to GitHub:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Create render.yaml

Create a `render.yaml` file in your project root (this file tells Render how to deploy):

```yaml
services:
  - type: web
    name: greencoders-backend
    runtime: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: VITE_GEMINI_API_KEY
        sync: false
```

## Step 3: Deploy on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` file
5. Click **"Create Web Service"**

## Step 4: Set Environment Variables

In the Render dashboard:
1. Go to your service → **Environment**
2. Add environment variable:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo`
3. Click **"Save Changes"**

The service will automatically redeploy.

## Step 5: Get Your Backend URL

After deployment completes, Render will provide a URL like:
```
https://greencoders-backend.onrender.com
```

## Step 6: Update Frontend

Update your `.env` file:

```env
VITE_ML_API_URL=https://greencoders-backend.onrender.com
```

Then redeploy frontend:

```bash
npm run build
npx firebase deploy --only hosting
```

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free (enough for 24/7 operation)

### Updating After Code Changes

Just push to GitHub:
```bash
git add .
git commit -m "Update backend"
git push
```

Render will automatically rebuild and redeploy!

## Alternative: Manual Deployment (Without GitHub)

If you don't want to use GitHub:

1. Create a new Web Service on Render
2. Choose **"Deploy from Git"** → **"Public Git repository"**
3. Or use Render's CLI: https://render.com/docs/cli

## Troubleshooting

### Cold Starts
The free tier spins down after inactivity. First request will be slow. Consider:
- Upgrading to paid tier ($7/month for always-on)
- Using a cron job to ping the service every 10 minutes

### CORS Errors
Already configured in `backend/main.py` to allow Firebase domain.

### Environment Variables Not Working
Make sure to set them in Render dashboard, not just in `.env` file.
