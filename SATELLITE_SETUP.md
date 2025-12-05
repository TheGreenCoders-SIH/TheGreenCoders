# Satellite Analytics - Quick Setup Guide

## 📦 Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Note for Windows users**: If `rasterio` fails to install, use:
> ```bash
> pip install rasterio --find-links=https://girder.github.io/large_image_wheels
> ```

### 2. Install Frontend Dependencies

```bash
npm install leaflet react-leaflet leaflet-draw recharts @turf/turf
```

### 3. Configure Environment Variables

Copy `.env.satellite.example` to `.env` and add your credentials:

```env
# SentinelHub API (Get from https://www.sentinel-hub.com/)
SENTINELHUB_CLIENT_ID=your_client_id
SENTINELHUB_CLIENT_SECRET=your_client_secret
SENTINELHUB_INSTANCE_ID=your_instance_id

# Firebase Admin
FIREBASE_PROJECT_ID=thegreencoders
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
```

### 4. Get SentinelHub API Credentials

1. Go to https://www.sentinel-hub.com/
2. Create a free account (30,000 processing units/month)
3. Dashboard → User Settings → OAuth clients
4. Create new OAuth client
5. Copy Client ID, Client Secret, and Instance ID

### 5. Setup Firebase Admin SDK

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save JSON file as `firebase-service-account.json` in project root
4. Update `FIREBASE_CREDENTIALS_PATH` in `.env`

### 6. Add Route to App

In `src/App.jsx`, add:

```jsx
import SatelliteAnalytics from './pages/SatelliteAnalytics';

// In your routes:
<Route path="/satellite-analytics" element={<SatelliteAnalytics />} />
```

### 7. Add Navigation Link

In your navigation component:

```jsx
<Link to="/satellite-analytics">Satellite Analytics</Link>
```

### 8. Start Development Servers

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
npm run dev
```

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Check if satellite routers are loaded
curl http://localhost:8000/docs
# Look for /farms and /analytics endpoints
```

### Test Frontend

1. Navigate to `http://localhost:5173/satellite-analytics`
2. Log in with Firebase authentication
3. Click "Add New Farm"
4. Draw a polygon on the map OR enter coordinates
5. Select the farm and click "Analyze Farm"
6. View NDVI, soil moisture, and irrigation recommendations

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/farms` | GET | List all farms |
| `/farms` | POST | Create farm |
| `/farms/{id}` | GET | Get farm details |
| `/farms/{id}` | PUT | Update farm |
| `/farms/{id}` | DELETE | Delete farm |
| `/analytics/farms/{id}/analyze` | POST | Trigger analysis |
| `/analytics/farms/{id}/latest` | GET | Latest analytics |
| `/analytics/farms/{id}/history` | POST | Historical data |
| `/analytics/farmer/history` | GET | All analyses |

## 🚀 Deployment

### Backend (Render)

Your existing `Dockerfile` and `render.yaml` are already configured. Just add environment variables in Render dashboard:

- `SENTINELHUB_CLIENT_ID`
- `SENTINELHUB_CLIENT_SECRET`
- `SENTINELHUB_INSTANCE_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CREDENTIALS_PATH` (or set credentials as JSON string)

### Frontend (Firebase Hosting)

Already configured. Just rebuild and deploy:

```bash
npm run build
firebase deploy
```

## 🔍 Troubleshooting

### "Satellite analytics routers not available"

- Check that all backend dependencies are installed
- Verify `routers/farms.py` and `routers/analytics.py` exist
- Check for import errors in backend logs

### "Failed to load farms"

- Verify Firebase authentication is working
- Check that user is logged in
- Verify Firebase Admin SDK is initialized correctly

### "Analysis failed"

- Check SentinelHub API credentials
- Verify API quota (30K units/month for free tier)
- Check backend logs for detailed error messages

### Leaflet map not displaying

- Verify `leaflet` CSS is imported in `FarmMap.jsx`
- Check browser console for errors
- Ensure map container has explicit height

## 📝 Notes

- **Demo Mode**: Current implementation uses sample NDVI/NDMI data. For production, integrate actual satellite imagery processing.
- **Rate Limits**: Monitor SentinelHub usage to stay within free tier limits.
- **Cloud Coverage**: Analysis automatically filters images with >20% cloud coverage.
- **Resolution**: Sentinel-2 provides 10m spatial resolution for NDVI.

## ✅ Verification Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] SentinelHub API credentials configured
- [ ] Firebase Admin SDK configured
- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] Can create farm with map drawing
- [ ] Can create farm with coordinates
- [ ] Can trigger satellite analysis
- [ ] Analytics display correctly
- [ ] Historical charts render
- [ ] No console errors

## 🎯 Next Steps

1. Test with real farm coordinates
2. Verify satellite data retrieval
3. Monitor API usage
4. Deploy to production
5. Add user documentation
6. Consider adding:
   - Weather integration
   - Automated alerts
   - Export functionality
   - Multi-farm comparison
