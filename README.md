# 🌱 E-Soil Smart Card System

A comprehensive web application for soil health management with role-based dashboards, AI-powered recommendations, and data-driven crop suggestions.

## 🎯 Features

### 👨‍💼 Admin Dashboard
- **Farmer Management**: View all farmers, add new farmers with auto-generated IDs (FC-2025-XXXXXX)
- **Card Administration**: View and terminate farmer soil health cards
- **Admin Management**: Add new administrators to the system
- **Statistics**: Overview of total farmers, active cards, and admins

### 👨‍🌾 Farmer Dashboard
- **Single Card Creation**: Each farmer can create one comprehensive soil health card
- **Visual Soil Analysis**:
  - 🎯 Soil Health Gauge (0-100% score)
  - 🌡️ pH Meter with gradient visualization
  - 🧪 NPK Nutrient Bars (Nitrogen, Phosphorus, Potassium)
  - 📊 Interactive Radar Chart
  - 📈 NPK Comparison Bar Chart
  - 🌱 Soil Type Indicators
- **QR Code**: Scannable QR code on each card containing essential soil data
- **Download**: Export soil health card as high-quality PNG image
- **Real-time Weather**: Location-based weather data and farming alerts
- **Market Intelligence**: Live commodity prices and trends
- **AI Recommendations**: 
  - Data-driven crop suggestions from CSV dataset (2200+ samples)
  - Personalized farming schedule
  - Soil adjustment recommendations
  - Text-to-speech for accessibility

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Google Gemini API key
- OpenWeatherMap API key (optional, for live weather)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anmol2Singh/TheGreenCoders.git
   cd TheGreenCoders
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Gemini AI
   VITE_GEMINI_API_KEY=your_gemini_api_key

   # OpenWeatherMap (Optional)
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage

### Admin Access
1. Navigate to `/login`
2. Sign up with `admin@greencoders.com` (or any email in the ADMIN_EMAILS list)
3. Access the Admin Dashboard at `/admin`
4. Add farmers, manage cards, and create new admins

### Farmer Access
1. Admin creates a farmer account
2. Farmer logs in with provided credentials
3. Create a soil health card with:
   - Farmer name
   - Village/location
   - pH level
   - NPK values (N:P:K format, e.g., "120:80:100")
   - Organic carbon percentage
4. View visual soil analysis, AI recommendations, and real-time data
5. Download card as PNG or scan QR code

## 🛠️ Technology Stack

### Frontend
- **React** (Vite) - Fast, modern build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Chart.js** - Interactive charts
- **Lucide React** - Beautiful icons
- **React Markdown** - Formatted AI recommendations

### Backend & Services
- **Firebase Firestore** - Real-time database
- **Firebase Auth** - User authentication
- **Google Gemini AI** - Farming recommendations
- **OpenWeatherMap API** - Weather data

### Data Processing
- **CSV Parser** - Crop recommendation dataset
- **html2canvas** - Card export to PNG
- **qrcode.react** - QR code generation

## 📊 Database Structure

```
users/
  └── {userId}/
      ├── role: "admin" | "farmer"
      ├── farmerId: "FC-2025-XXXXXX"
      ├── email: string
      ├── hasCard: boolean
      └── createdAt: timestamp

farmers/
  └── {farmerId}/
      ├── userId: string
      ├── hasCard: boolean
      ├── updatedAt: timestamp
      └── card: {
            farmerName: string
            village: string
            ph: number
            organicCarbon: number
            npk: string
            recommendations: string
            createdAt: string
          }
```

## 🌾 Crop Recommendation System

The system uses a CSV dataset (`data/Crop_recommendation.csv`) containing:
- **2200+ crop samples** with optimal growing conditions
- **Parameters**: N, P, K, temperature, humidity, pH, rainfall
- **22 crop types**: rice, wheat, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean, blackgram, lentil, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee

### How It Works
1. Analyzes farmer's soil data (NPK, pH)
2. Calculates similarity scores with crop requirements
3. Ranks crops by suitability percentage
4. Provides soil adjustment recommendations
5. Integrates with Gemini AI for detailed farming advice

## 🎨 Visual Features

- **Soil Health Score**: Color-coded gauge (Green: 80%+, Yellow: 60-79%, Red: <60%)
- **pH Visualization**: Gradient bar from acidic to alkaline
- **NPK Bars**: Individual progress bars with gradient fills
- **Interactive Charts**: Radar and bar charts for multi-dimensional analysis
- **Responsive Design**: Mobile-friendly layouts
- **Smooth Animations**: Framer Motion transitions

## 🔐 Security

- Role-based access control (RBAC)
- Protected routes for admin/farmer areas
- Firebase authentication
- User-specific data isolation
- Secure API key management

## 📝 Key Files

- `src/pages/FarmerDashboard.jsx` - Farmer interface with visual analysis
- `src/pages/AdminDashboard.jsx` - Admin management interface
- `src/lib/cropRecommendation.js` - CSV-based crop recommendation engine
- `src/lib/aiRecommendations.js` - Gemini AI integration
- `src/lib/roles.js` - Role management utilities
- `src/lib/api.js` - Weather and market data APIs
- `data/Crop_recommendation.csv` - Crop requirements dataset

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is part of the Smart India Hackathon 2025 initiative.

## 👥 Team: The GreenCoders

Built with ❤️ for sustainable agriculture and farmer empowerment.

---

**Note**: Make sure to add your actual Firebase and API credentials to the `.env` file before running the application.
