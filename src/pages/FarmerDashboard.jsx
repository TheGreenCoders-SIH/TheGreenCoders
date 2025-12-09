import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getWeatherData, getMarketPrices } from '../lib/api';
import { generateFarmingSchedule, speakText, stopSpeaking } from '../lib/aiRecommendations';
import { getCropRecommendations } from '../lib/cropRecommendation';
import { Sprout, MapPin, CloudSun, TrendingUp, Sparkles, Volume2, Loader2, Plus, Activity, Satellite, Droplets, Sun, Wind, ChevronRight, AlertTriangle, Leaf, Calendar } from 'lucide-react';
import IoTDashboard from '../components/IoTDashboard';
import WeatherForecast from '../components/WeatherForecast';
import SoilHistoryGraph from '../components/SoilHistoryGraph';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import LanguageSelector from '../components/LanguageSelector';
import { T } from '../hooks/useTranslation';
import ErrorBoundary from '../components/ErrorBoundary';
import Tutorial from '../components/Tutorial';

export default function FarmerDashboard() {
    const { currentUser, userProfile } = useAuth();
    const [card, setCard] = useState(null);
    const [weather, setWeather] = useState(null);
    const [marketData, setMarketData] = useState([]);
    const [aiRecommendations, setAiRecommendations] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState('');
    const [cropRecommendations, setCropRecommendations] = useState([]);
    const [fertilizerAdvisory, setFertilizerAdvisory] = useState(null);
    const [irrigationSchedule, setIrrigationSchedule] = useState(null);
    const cardRef = useRef(null);
    const [showTutorial, setShowTutorial] = useState(false);

    // Get Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return <T>Good Morning</T>;
        if (hour < 18) return <T>Good Afternoon</T>;
        return <T>Good Evening</T>;
    };

    const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    useEffect(() => {
        // Safety timeout to prevent infinite loading
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout reached - forcing dashboard display");
                setLoading(false);
            }
        }, 8000);

        if (currentUser) {
            loadFarmerData();
        } else {
            // If no user, stop loading immediately
            setLoading(false);
        }

        return () => clearTimeout(timer);
    }, [currentUser, userProfile]);

    const loadFarmerData = async () => {
        try {
            // Market Data (Non-blocking)
            try {
                const market = await getMarketPrices();
                setMarketData(market ? market.slice(0, 4) : []);
            } catch (e) {
                console.error("Market load failed", e);
                setMarketData([]);
            }

            if (!userProfile?.farmerId) {
                console.warn("No farmer ID found");
                setLoading(false);
                return;
            }

            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data();
                setCard(cardData.card);
                const village = cardData.card?.village || 'Delhi';
                setLocation(village);

                // Weather (Non-blocking)
                try {
                    const weatherData = await getWeatherData(village);
                    setWeather(weatherData);
                } catch (e) { console.error("Weather failed", e); }

                // Schedule & Recommendations (Non-blocking)
                if (cardData.card) {
                    // Start schedule generation but don't await entirely if it's slow
                    generateFarmingSchedule(cardData.card, village, weather)
                        .then(res => setAiRecommendations(res))
                        .catch(err => console.error("AI Schedule failed", err));

                    const crops = getCropRecommendations(cardData.card, weather, 5);
                    setCropRecommendations(crops || []);
                }
            }
            setLoading(false);

            // Check if tutorial should be shown
            checkTutorialStatus();
        } catch (error) {
            console.error('Error loading farmer data:', error);
            // Ensure we turn off loading state even on error
            setLoading(false);
        }
    };

    const checkTutorialStatus = () => {
        const tutorialCompleted = localStorage.getItem('tutorial_completed');
        // Show tutorial if user has no card and hasn't completed tutorial
        if (!card && !tutorialCompleted) {
            setShowTutorial(true);
        }
    };

    const handleTutorialComplete = () => {
        localStorage.setItem('tutorial_completed', 'true');
        setShowTutorial(false);
    };

    const calculateSoilScore = (data) => {
        if (!data) return 0;
        let score = 0;
        if (data.ph >= 6.5 && data.ph <= 7.5) score += 30;
        else if (data.ph >= 6.0 && data.ph <= 8.0) score += 20;
        else score += 10;

        const npkParts = data.npk?.split(':') || [0, 0, 0];
        const avgNPK = (parseInt(npkParts[0]) + parseInt(npkParts[1]) + parseInt(npkParts[2])) / 3;
        if (avgNPK > 150) score += 40;
        else if (avgNPK > 100) score += 30;
        else score += 20;

        if (data.organicCarbon >= 1.5) score += 30;
        else if (data.organicCarbon >= 1.0) score += 20;
        else score += 10;

        return Math.round(score);
    };

    const soilScore = card ? calculateSoilScore(card) : 0;

    const toggleSpeech = () => {
        if (isSpeaking) {
            stopSpeaking();
            setIsSpeaking(false);
        } else {
            const success = speakText(aiRecommendations);
            if (success) {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), aiRecommendations.length * 50);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-green-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-green-800 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-green-50/50 pb-24">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-green-700 to-emerald-900 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 text-green-100 text-sm font-medium mb-1">
                                <Calendar className="w-4 h-4" />
                                {currentDate}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {getGreeting()}, {userProfile?.name?.split(' ')[0] || 'Farmer'}! 🌾
                            </h1>
                            <p className="text-green-100 opacity-90 max-w-lg">
                                <T>Ready for another productive day? Here's what's happening on your farm.</T>
                            </p>
                        </div>

                        {weather && (
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                                <div className="bg-white/20 p-3 rounded-full">
                                    <CloudSun className="w-8 h-8 text-yellow-300" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{weather.temp}°C</div>
                                    <div className="text-green-100 text-sm">{weather.description}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 space-y-8">

                    {/* 1. Quick Actions Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <QuickActionCard
                            to={card ? "/mycard" : "/new-card"}
                            icon={card ? MapPin : Plus}
                            color="bg-blue-500"
                            title="My Soil Card"
                            delay={0.1}
                            id="soil-card-button"
                        />
                        <QuickActionCard
                            to="/voice-advisory"
                            icon={Volume2}
                            color="bg-purple-500"
                            title="Voice Guide"
                            delay={0.2}
                        />
                        <QuickActionCard
                            to="/ai-advice"
                            icon={Sparkles}
                            color="bg-indigo-500"
                            title="AI Advisor"
                            delay={0.3}
                        />
                        <QuickActionCard
                            to="/crop-recommendations"
                            icon={Sprout}
                            color="bg-green-500"
                            title="Crop Advice"
                            delay={0.4}
                        />
                        <QuickActionCard
                            to="/market-trends"
                            icon={TrendingUp}
                            color="bg-orange-500"
                            title="Market Prices"
                            delay={0.5}
                        />
                        <QuickActionCard
                            to="/ngo?view=farmer"
                            icon={Leaf}
                            color="bg-teal-500"
                            title="NGO Support"
                            delay={0.6}
                        />
                    </div>

                    {/* 2. Smart Insights & Alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Alerts Column */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                                Farm Alerts
                            </h2>
                            {weather?.alert && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm"
                                >
                                    <h3 className="font-bold text-amber-800 flex items-center mb-1">
                                        <CloudSun className="w-4 h-4 mr-2" /> Weather Alert
                                    </h3>
                                    <p className="text-sm text-amber-700">{weather.alert}</p>
                                </motion.div>
                            )}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[140px]">
                                <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Market Insight</h3>
                                {marketData.length > 0 ? (
                                    <div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-2xl font-bold text-gray-800">{marketData[0].crop}</div>
                                                <div className="text-sm text-gray-500">Trending Crop</div>
                                            </div>
                                            <div className={`text-lg font-bold ${marketData[0].change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {marketData[0].change >= 0 ? '+' : ''}{marketData[0].change}%
                                            </div>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">No market data available.</p>
                                )}
                            </div>
                        </div>

                        {/* Soil Health Summary (Central) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Soil Health Status</h2>
                                        <p className="text-gray-500 text-sm">{location || 'Your Farm'}</p>
                                    </div>
                                    {card ? (
                                        <div className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                            Active
                                        </div>
                                    ) : (
                                        <Link to="/new-card" className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold hover:bg-blue-200">
                                            Setup Now
                                        </Link>
                                    )}
                                </div>

                                {card ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                        {/* Score Circle */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="64" cy="64" r="56" stroke="#f0fdf4" strokeWidth="12" fill="transparent" />
                                                    <circle
                                                        cx="64" cy="64" r="56"
                                                        stroke={soilScore > 75 ? "#22c55e" : soilScore > 50 ? "#eab308" : "#ef4444"}
                                                        strokeWidth="12"
                                                        fill="transparent"
                                                        strokeDasharray="351.86"
                                                        strokeDashoffset={351.86 - (351.86 * soilScore) / 100}
                                                        className="transition-all duration-1000 ease-out"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-bold text-gray-800">{soilScore}</span>
                                                    <span className="text-xs text-gray-500">Score</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm font-medium text-gray-700">Overall Health</div>
                                        </div>

                                        {/* Key Metrics */}
                                        <div className="col-span-2 grid grid-cols-2 gap-4">
                                            <SoilMetric label="pH Level" value={card.ph} unit="" status={card.ph >= 6.5 && card.ph <= 7.5 ? "Optimal" : "Check"} color="blue" />
                                            <SoilMetric label="Organic Carbon" value={card.organicCarbon} unit="%" status={card.organicCarbon > 0.75 ? "Good" : "Low"} color="emerald" />
                                            <SoilMetric label="Nitrogen" value={card.npk?.split(':')[0]} unit="mg/kg" color="indigo" />
                                            <SoilMetric label="Phosphorus" value={card.npk?.split(':')[1]} unit="mg/kg" color="amber" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No soil data linked yet.</p>
                                        <Link to="/new-card" className="text-green-600 font-bold hover:underline mt-2 inline-block">
                                            Generate Soil Card &rarr;
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Detailed Features */}
                    {card && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* IoT Section */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                        <Satellite className="w-6 h-6 text-blue-600 mr-2" />
                                        Smart Farm Monitor
                                    </h2>
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                </div>
                                <IoTDashboard farmerId={userProfile.farmerId} location={location} />
                            </div>

                            {/* Crop Recommendations List */}
                            {cropRecommendations.length > 0 && (
                                <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-sm border border-green-100 p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                        <Sprout className="w-6 h-6 text-green-600 mr-2" />
                                        Best Crops for You
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {cropRecommendations.map((crop, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                                    <Leaf className="w-5 h-5 text-green-600" />
                                                </div>
                                                <h3 className="font-bold text-gray-800 capitalize mb-1">{crop.crop}</h3>
                                                <div className="flex items-center text-xs text-gray-500 mb-2">
                                                    <Droplets className="w-3 h-3 mr-1" /> Medium Water
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${crop.suitability >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {crop.suitability}% Match
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Weather Detailed */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">7-Day Forecast</h2>
                                <WeatherForecast location={location} />
                            </div>
                        </div>
                    )}

                </div>

                {/* Tutorial Overlay */}
                {showTutorial && (
                    <Tutorial
                        targetId="soil-card-button"
                        onComplete={handleTutorialComplete}
                        message="Start your farming journey by creating your first Soil Health Card! Click here to analyze your soil and get personalized recommendations."
                        step={1}
                        totalSteps={1}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}

// Subcomponents
const QuickActionCard = ({ to, icon: Icon, color, title, delay, id }) => {
    // Map color to explicit Tailwind classes to ensure they are purged correctly
    const colorMap = {
        'bg-blue-500': 'group-hover:border-blue-200',
        'bg-purple-500': 'group-hover:border-purple-200',
        'bg-indigo-500': 'group-hover:border-indigo-200',
        'bg-green-500': 'group-hover:border-green-200',
        'bg-orange-500': 'group-hover:border-orange-200',
        'bg-teal-500': 'group-hover:border-teal-200',
    };

    return (
        <Link to={to} className="group relative" id={id}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.3 }}
                className={`
                bg-white p-4 rounded-2xl shadow-sm border border-gray-100 
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                flex flex-col items-center justify-center gap-3 aspect-square
                ${colorMap[color] || 'group-hover:border-green-200'}
            `}
            >
                <div className={`
                w-12 h-12 rounded-xl ${color} text-white 
                flex items-center justify-center shadow-md 
                transform group-hover:scale-110 transition-transform duration-300
            `}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700 text-center group-hover:text-gray-900 leading-tight">
                    <T>{title}</T>
                </span>
            </motion.div>
        </Link>
    );
};

const SoilMetric = ({ label, value, unit, status, color }) => {
    // Explicit mappings for Tailwind safelist
    const styles = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
    };

    const s = styles[color] || styles.blue;

    return (
        <div className={`p-3 ${s.bg} rounded-xl border ${s.border}`}>
            <div className={`text-xs ${s.text} font-semibold mb-1`}>{label}</div>
            <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-gray-800">{value}</span>
                <span className="text-xs text-gray-500 mb-1">{unit}</span>
            </div>
            {status && (
                <div className={`text-xs font-medium mt-1 ${status === 'Optimal' || status === 'Good' ? 'text-green-600' : 'text-amber-600'}`}>
                    {status}
                </div>
            )}
        </div>
    );
};
