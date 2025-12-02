# Railway Web Deployment - Step by Step

Since the CLI requires an upgraded account, let's deploy via the Railway web interface instead.

## Step 1: Prepare Your Code for GitHub

First, let's push your code to GitHub (if not already done):

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
git add .
git commit -m "Ready for Railway deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Railway Web Interface

### 2.1 Go to Railway Dashboard
1. Open https://railway.app/dashboard
2. Click **"New Project"**

### 2.2 Deploy from GitHub
1. Click **"Deploy from GitHub repo"**
2. If prompted, authorize Railway to access your GitHub
3. Select your repository: `The_GreenCoders_Project`
4. Click **"Deploy Now"**

### 2.3 Railway Auto-Detection
Railway will automatically:
- Detect your `Dockerfile`
- Start building the container
- Deploy the service

## Step 3: Configure Environment Variables

### 3.1 Add Gemini API Key
1. In Railway dashboard, click on your deployed service
2. Go to the **"Variables"** tab
3. Click **"+ New Variable"**
4. Add:
   - **Variable Name**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo`
5. Click **"Add"**

The service will automatically redeploy with the new variable.

## Step 4: Generate Public URL

### 4.1 Create Domain
1. In your service dashboard, go to **"Settings"** tab
2. Scroll down to **"Networking"** section
3. Click **"Generate Domain"**
4. Railway will create a URL like: `https://thegreencoders-production.up.railway.app`

### 4.2 Copy Your Backend URL
Copy the generated URL - you'll need it for the frontend.

## Step 5: Update Frontend Configuration

### 5.1 Update .env File
Edit your `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=AIzaSyBUIdSvNbfEPyBsgFudlJHif5scN3nHDxo
VITE_OPENWEATHER_API_KEY=2939187d6a548e75cda7f3638a9fbd8f
VITE_ML_API_URL=https://thegreencoders-production.up.railway.app
```

Replace `https://thegreencoders-production.up.railway.app` with your actual Railway URL.

### 5.2 Rebuild and Redeploy Frontend

```bash
npm run build
npx firebase deploy --only hosting
```

## Step 6: Test Your Deployment

### 6.1 Test Backend Health
Visit: `https://your-railway-url.up.railway.app/health`

You should see:
```json
{
  "status": "healthy",
  "model_status": "loaded"
}
```

### 6.2 Test Full Application
Visit: `https://thegreencoders.web.app`

Test features that use the backend:
- AI Chat
- Crop Recommendations
- Image Analysis

## Updating After Code Changes

### Update Backend:
1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```
2. Railway will automatically detect and redeploy!

### Update Frontend:
```bash
npm run build
npx firebase deploy --only hosting
```

## Troubleshooting

### Build Fails
1. Check Railway logs in the **"Deployments"** tab
2. Common issues:
   - Missing files in GitHub
   - Dockerfile errors
   - Missing dependencies

### Service Not Starting
1. Check **"Logs"** tab in Railway dashboard
2. Verify environment variables are set correctly
3. Check that port 8080 is exposed in Dockerfile (already configured)

### CORS Errors
Already configured in `backend/main.py` to allow Firebase domains.

### No Public URL
Make sure you clicked **"Generate Domain"** in Settings → Networking.

## Railway Account Notes

Railway free tier includes:
- **$5 free credit/month**
- **500 execution hours**
- **100GB bandwidth**

If you see "limited plan" errors, you may need to:
1. Add a payment method (no charges until you exceed free tier)
2. Or verify your account via email

Visit: https://railway.app/account/plans

## Summary

1. ✅ Push code to GitHub
2. ✅ Deploy from Railway dashboard (https://railway.app/dashboard)
3. ✅ Add `VITE_GEMINI_API_KEY` environment variable
4. ✅ Generate public domain
5. ✅ Update frontend `.env` with Railway URL
6. ✅ Redeploy frontend: `npm run build && npx firebase deploy --only hosting`

Done! 🚀
