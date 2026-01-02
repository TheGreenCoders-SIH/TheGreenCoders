import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewCard from './pages/NewCard';
import MyCards from './pages/MyCards';
import DigitalTwin from './pages/DigitalTwin';
import MarketIntel from './pages/MarketIntel';
import ViewCard from './pages/ViewCard';
import Login from './pages/Login';
import QRLogin from './pages/QRLogin';
import FarmerDashboard from './pages/FarmerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NGODashboard from './pages/NGODashboard';
import GuestDashboard from './pages/GuestDashboard';
import PestDetection from './pages/PestDetection';
import NotificationSettings from './pages/NotificationSettings';
import MyCard from './pages/MyCard';
import FarmerProfile from './pages/FarmerProfile';
import CropRecommendations from './pages/CropRecommendations';
import SoilAnalysis from './pages/SoilAnalysis';
import AIAdvice from './pages/AIAdvice';
import MarketTrends from './pages/MarketTrends';
import VoiceAdvisory from './pages/VoiceAdvisory';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

function AppRoutes() {
  const { currentUser, userProfile, isAdmin, isFarmer, isNGO, isGuest } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/qr-login" element={<QRLogin />} />
        <Route path="/view-card" element={<ViewCard />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Dashboard Routes - Role Based */}
        <Route path="/" element={
          isAdmin ? <Navigate to="/admin" /> :
            isNGO ? <Navigate to="/ngo" /> :
              isGuest ? <Navigate to="/guest-dashboard" /> :
                <Navigate to="/dashboard" />
        } />
        <Route path="/dashboard" element={
          isFarmer ? <FarmerDashboard /> : <Navigate to="/" />
        } />
        <Route path="/guest-dashboard" element={
          isGuest ? <GuestDashboard /> : <Navigate to="/" />
        } />
        <Route path="/admin" element={
          isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />
        } />
        <Route path="/ngo" element={<NGODashboard />} />

        {/* Common Routes */}
        <Route path="/new-card" element={<NewCard />} />
        <Route path="/cards" element={<MyCards />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/market-intel" element={<MarketIntel />} />
        <Route path="/view-card" element={<ViewCard />} />
        <Route path="/mycard" element={<MyCard />} />
        <Route path="/profile" element={<FarmerProfile />} />
        <Route path="/crop-recommendations" element={<CropRecommendations />} />
        <Route path="/soil-analysis" element={<SoilAnalysis />} />
        <Route path="/ai-advice" element={<AIAdvice />} />
        <Route path="/market-trends" element={<MarketTrends />} />
        <Route path="/voice-advisory" element={<VoiceAdvisory />} />
        <Route path="/pest-detection" element={<PestDetection />} />
        <Route path="/notifications" element={<NotificationSettings />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/qr-login" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppRoutes />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
