# Backend Deployment on Railway.app

Railway.app is the easiest way to deploy your FastAPI backend with generous free tier and instant deployment.

## Why Railway.app?

- ✅ **$5 free credit/month** - Enough for small projects
- ✅ **Instant deployment** - Deploy in seconds from GitHub or CLI
- ✅ **Auto-deploy** - Automatically redeploys on git push
- ✅ **No cold starts** - Always-on service (unlike Render free tier)
- ✅ **Simple setup** - Minimal configuration needed

## Prerequisites

1. Railway account - Sign up at https://railway.app (use GitHub login)
2. Railway CLI (optional, for command-line deployment)

---

## Method 1: Deploy via Railway CLI (Fastest)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

### Step 3: Initialize and Deploy

```bash
# Initialize Railway project
railway init

# Link to your project (or create new)
railway link

# Add environment variables
railway variables set VITE_GEMINI_API_KEY=AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo

# Deploy!
railway up
```

That's it! Railway will automatically detect your Dockerfile and deploy.

### Step 4: Get Your URL

```bash
# Generate a public URL
railway domain
```

Your backend will be available at: `https://your-app.up.railway.app`

---

## Method 2: Deploy via Web Interface (No CLI)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect the Dockerfile
5. Click **"Deploy"**

### Step 3: Add Environment Variables

1. In Railway dashboard, click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add:
   - **Variable**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo`
5. Click **"Add"**

### Step 4: Generate Public Domain

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Copy your URL: `https://your-app.up.railway.app`

---

## Update Frontend with Railway URL

Edit `.env` file:

```env
VITE_GEMINI_API_KEY=AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo
VITE_OPENWEATHER_API_KEY=2939187d6a548e75cda7f3638a9fbd8f
VITE_ML_API_URL=https://your-app.up.railway.app
```

Redeploy frontend:

```bash
npm run build
npx firebase deploy --only hosting
```

---

## Updating After Code Changes

### With CLI:
```bash
railway up
```

### With GitHub:
```bash
git add .
git commit -m "Update backend"
git push
```

Railway will automatically redeploy!

---

## Railway Configuration (Optional)

Create `railway.json` in project root for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Monitoring and Logs

### View Logs (CLI):
```bash
railway logs
```

### View Logs (Web):
1. Go to Railway dashboard
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on latest deployment to see logs

---

## Cost Estimation

Railway free tier includes:
- **$5 free credit/month**
- **500 hours of usage** (enough for 24/7 if under $5)
- **100GB outbound bandwidth**

Typical usage for this project: **~$2-3/month** (well within free tier)

---

## Troubleshooting

### Port Issues
Railway automatically sets the `PORT` environment variable. The Dockerfile already uses port 8080, which Railway will map correctly.

### CORS Errors
Already configured in `backend/main.py` to allow your Firebase domain.

### Build Failures
Check Railway logs. Common issues:
- Missing dependencies in `requirements.txt`
- Incorrect Dockerfile path

### Environment Variables Not Working
Make sure to set them in Railway dashboard, not just `.env` file.

---

## Quick Commands Reference

| Task | Command |
| :--- | :--- |
| **Install CLI** | `npm install -g @railway/cli` |
| **Login** | `railway login` |
| **Deploy** | `railway up` |
| **View Logs** | `railway logs` |
| **Generate Domain** | `railway domain` |
| **Set Variable** | `railway variables set KEY=value` |
| **Open Dashboard** | `railway open` |

---

## Summary

Railway.app is the simplest option:
1. Install CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Generate domain: `railway domain`
5. Update frontend `.env` with Railway URL
6. Redeploy frontend: `npm run build && npx firebase deploy --only hosting`

Done! 🚀
