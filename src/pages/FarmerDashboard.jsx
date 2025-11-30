import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getWeatherData, getMarketPrices } from '../lib/api';
import { generateFarmingSchedule, speakText, stopSpeaking } from '../lib/aiRecommendations';
import { getCropRecommendations } from '../lib/cropRecommendation';
import advisoryEngine from '../lib/advisoryEngine';
import { Sprout, MapPin, CloudSun, TrendingUp, Sparkles, Volume2, VolumeX, Loader2, Plus, Download, Activity } from 'lucide-react';
import IoTDashboard from '../components/IoTDashboard';
import WeatherForecast from '../components/WeatherForecast';
import SoilHistoryGraph from '../components/SoilHistoryGraph';
import { motion } from 'framer-motion';
import { Radar, Bar } from 'react-chartjs-2';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

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

    useEffect(() => {
        if (currentUser && userProfile) {
            loadFarmerData();
        }
    }, [currentUser, userProfile]);

    const loadFarmerData = async () => {
        try {
            // Always load market data regardless of card status
            const market = await getMarketPrices();
            setMarketData(market.slice(0, 4));

            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data();
                setCard(cardData.card);
                setLocation(cardData.card.village);

                const weatherData = await getWeatherData(cardData.card.village);
                setWeather(weatherData);

                // Check if we already have the schedule saved
                if (cardData.card.farmingSchedule) {
                    setAiRecommendations(cardData.card.farmingSchedule);
                } else {
                    // Generate and save if not exists
                    const recommendations = await generateFarmingSchedule(
                        cardData.card,
                        cardData.card.village,
                        weatherData
                    );
                    setAiRecommendations(recommendations);

                    // Save back to Firestore for instant load next time
                    try {
                        await updateDoc(farmerRef, {
                            'card.farmingSchedule': recommendations
                        });
                    } catch (err) {
                        console.error("Error saving generated schedule:", err);
                    }
                }

                // Get crop recommendations from CSV
                const crops = getCropRecommendations(cardData.card, weatherData, 5);
                setCropRecommendations(crops);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading farmer data:', error);
            setLoading(false);
        }
    };

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

    const downloadCard = async () => {
        if (!cardRef.current) return;

        try {
            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 0,
                removeContainer: true,
            });

            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            const fileName = `soil-card-${userProfile.farmerId}.png`;

            link.setAttribute('download', fileName);
            link.setAttribute('href', dataUrl);
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading card:", error);
            alert("Failed to download card. Please try again.");
        }
    };

    // Helper functions for visual analysis
    const calculateSoilScore = (data) => {
        if (!data) return 0;
        let score = 0;

        // pH score (30%)
        if (data.ph >= 6.5 && data.ph <= 7.5) score += 30;
        else if (data.ph >= 6.0 && data.ph <= 8.0) score += 20;
        else score += 10;

        // NPK score (40%)
        const npkParts = data.npk?.split(':') || [0, 0, 0];
        const avgNPK = (parseInt(npkParts[0]) + parseInt(npkParts[1]) + parseInt(npkParts[2])) / 3;
        if (avgNPK > 150) score += 40;
        else if (avgNPK > 100) score += 30;
        else score += 20;

        // Organic carbon (30%)
        if (data.organicCarbon >= 1.5) score += 30;
        else if (data.organicCarbon >= 1.0) score += 20;
        else score += 10;

        return Math.round(score);
    };

    const getSoilHealthColor = (score) => {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    };

    const getPhColor = (ph) => {
        if (ph >= 6.5 && ph <= 7.5) return '#28a745';
        if (ph >= 6.0 && ph <= 8.0) return '#ffc107';
        return '#dc3545';
    };

    const getPhStatus = (ph) => {
        if (ph < 6.0) return 'Too Acidic';
        if (ph > 8.0) return 'Too Alkaline';
        if (ph >= 6.5 && ph <= 7.5) return 'Optimal';
        return 'Acceptable';
    };

    const getNutrientWidth = (npk) => {
        if (!npk) return 0;
        const npkParts = npk.split(':');
        if (npkParts.length === 3) {
            const avg = (parseInt(npkParts[0]) + parseInt(npkParts[1]) + parseInt(npkParts[2])) / 3;
            return Math.min((avg / 200) * 100, 100);
        }
        return 50;
    };

    // Chart data
    const radarData = card ? {
        labels: ['pH Level', 'NPK Average', 'Organic Carbon', 'Overall Health'],
        datasets: [{
            label: 'Soil Status',
            data: [
                ((card.ph - 4) / 6) * 100,
                getNutrientWidth(card.npk),
                (card.organicCarbon / 2) * 100,
                calculateSoilScore(card)
            ],
            backgroundColor: 'rgba(34, 139, 34, 0.2)',
            borderColor: 'rgba(34, 139, 34, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(34, 139, 34, 1)',
        }]
    } : null;

    const barData = card ? {
        labels: ['Nitrogen', 'Phosphorus', 'Potassium'],
        datasets: [{
            label: 'NPK Levels (mg/kg)',
            data: card.npk?.split(':').map(v => parseInt(v)) || [0, 0, 0],
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 2
        }]
    } : null;

    const soilScore = card ? calculateSoilScore(card) : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-2xl p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Farmer Dashboard</h1>
                        <p className="text-green-100">Farmer ID: {userProfile?.farmerId}</p>
                    </div>
                    {!card && (
                        <Link
                            to="/new-card"
                            className="bg-white text-green-800 px-4 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Card
                        </Link>
                    )}
                </div>
            </div>

            {/* Real-time Data Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weather Widget */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Weather - {location || 'Your Location'}</h3>
                        <CloudSun className="w-6 h-6 text-orange-500" />
                    </div>
                    {weather ? (
                        <>
                            <div className="text-3xl font-bold text-gray-800">{weather.temp}°C</div>
                            <p className="text-sm text-gray-500">{weather.description}, Humidity {weather.humidity}%</p>
                            <div className="mt-4 p-3 bg-orange-50 text-orange-700 text-xs rounded-lg border border-orange-100">
                                {weather.alert}
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">Create a card to see weather data</p>
                    )}
                </motion.div>

                {/* Market Trends */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Market Trends</h3>
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                    <ul className="space-y-3">
                        {marketData.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{item.crop}</span>
                                <span className={`font-bold ${item.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    ₹{item.price}/{item.unit} ({item.change >= 0 ? '+' : ''}{item.change}%)
                                </span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Quick Access - Feature Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">🚀 Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Link to="/profile" className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all border border-blue-200">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">My Profile</span>
                    </Link>

                    <Link to="/crop-recommendations" className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all border border-green-200">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2">
                            <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">Crop Advice</span>
                    </Link>

                    <Link to="/soil-analysis" className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-all border border-purple-200">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-2">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">Soil Analysis</span>
                    </Link>

                    <Link to="/ai-advice" className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg hover:shadow-md transition-all border border-indigo-200">
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">AI Advice</span>
                    </Link>

                    <Link to="/market-trends" className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:shadow-md transition-all border border-orange-200">
                        <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mb-2">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">Market Prices</span>
                    </Link>

                    <Link to="/voice-advisory" className="flex flex-col items-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg hover:shadow-md transition-all border border-pink-200">
                        <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mb-2">
                            <Volume2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 text-center">Voice Guide</span>
                    </Link>
                </div>
            </div>

            {/* Visual Soil Health Analysis - Only show if card exists */}
            {card && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        📊 Visual Soil Health Analysis
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Gauges and Meters */}
                        <div className="space-y-6">
                            {/* Soil Health Gauge */}
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-4">🎯 Overall Soil Health Score</h3>
                                <div className="relative w-48 h-48 mx-auto">
                                    <div
                                        className="w-full h-full rounded-full flex items-center justify-center"
                                        style={{
                                            background: `conic-gradient(from 0deg, #ff4444 0deg 60deg, #ffaa00 60deg 120deg, #44ff44 120deg 240deg, #0088ff 240deg 360deg)`
                                        }}
                                    >
                                        <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center flex-col shadow-inner">
                                            <div className="text-4xl font-bold" style={{ color: getSoilHealthColor(soilScore) }}>
                                                {soilScore}%
                                            </div>
                                            <div className="text-sm text-gray-600">Health Score</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* pH Meter */}
                            <div>
                                <h4 className="font-semibold mb-2">🌡️ pH Level: {card.ph}</h4>
                                <div
                                    className="w-full h-8 rounded-full relative border-2 border-gray-800"
                                    style={{
                                        background: 'linear-gradient(to right, #ff4444, #ffaa00, #44ff44, #0099ff)'
                                    }}
                                >
                                    <div
                                        className="absolute top-[-4px] w-5 h-10 bg-gray-800 rounded"
                                        style={{ left: `${((card.ph - 4) / 6) * 100}%`, transform: 'translateX(-50%)' }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span>Acidic (4)</span>
                                    <span>Neutral (7)</span>
                                    <span>Alkaline (10)</span>
                                </div>
                                <div className="mt-2 text-center">
                                    <span
                                        className="px-3 py-1 rounded-full text-sm font-semibold"
                                        style={{
                                            backgroundColor: getPhColor(card.ph) + '20',
                                            color: getPhColor(card.ph)
                                        }}
                                    >
                                        {getPhStatus(card.ph)}
                                    </span>
                                </div>
                            </div>

                            {/* NPK Bars */}
                            <div>
                                <h4 className="font-semibold mb-3">🧪 NPK Nutrient Levels</h4>
                                {card.npk?.split(':').map((value, idx) => {
                                    const labels = ['Nitrogen', 'Phosphorus', 'Potassium'];
                                    const colors = ['#3b82f6', '#eab308', '#a855f7'];
                                    const percentage = Math.min((parseInt(value) / 200) * 100, 100);

                                    return (
                                        <div key={idx} className="mb-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium">{labels[idx]}</span>
                                                <span className="text-sm font-bold">{value} mg/kg</span>
                                            </div>
                                            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        background: `linear-gradient(90deg, ${colors[idx]}, ${colors[idx]}dd)`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Soil Indicators */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg border-2" style={{ borderColor: getSoilHealthColor(soilScore) }}>
                                    <div className="text-3xl mb-2">🌱</div>
                                    <h4 className="font-semibold text-sm">Soil Type</h4>
                                    <p className="text-xs text-gray-600">
                                        {card.ph < 6.5 ? 'Acidic' : card.ph > 7.5 ? 'Alkaline' : 'Neutral'}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-green-500">
                                    <div className="text-3xl mb-2">💧</div>
                                    <h4 className="font-semibold text-sm">Irrigation</h4>
                                    <p className="text-xs text-gray-600">Regular</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Charts */}
                        <div className="space-y-6">
                            {/* Radar Chart */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-4 text-center">📊 Soil Health Analysis</h4>
                                <div className="h-64">
                                    {radarData && (
                                        <Radar
                                            data={radarData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: {
                                                    r: {
                                                        beginAtZero: true,
                                                        max: 100,
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold mb-4 text-center">📈 NPK Comparison</h4>
                                <div className="h-64">
                                    {barData && (
                                        <Bar
                                            data={barData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'mg/kg'
                                                        }
                                                    }
                                                },
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Additional Properties */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <div className="font-semibold text-sm">Organic Carbon</div>
                                    <div className="text-2xl font-bold text-blue-600">{card.organicCarbon}%</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                    <div className="font-semibold text-sm">Farm Size</div>
                                    <div className="text-2xl font-bold text-purple-600">2.5 acres</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Crop Recommendations from CSV */}
            {
                card && cropRecommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm border border-green-100 p-6">
                        <div className="flex items-center mb-4">
                            <Sprout className="w-6 h-6 text-green-600 mr-2" />
                            <h3 className="text-lg font-bold text-gray-800">Recommended Crops for Your Soil</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Based on your soil analysis and CSV crop database</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cropRecommendations.map((crop, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-gray-800 capitalize">{crop.crop}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${crop.suitability >= 80 ? 'bg-green-100 text-green-700' :
                                            crop.suitability >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            {crop.suitability}% Match
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Nitrogen:</span>
                                            <span className="font-semibold">{Math.round(crop.requirements.N)} kg/ha</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Phosphorus:</span>
                                            <span className="font-semibold">{Math.round(crop.requirements.P)} kg/ha</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Potassium:</span>
                                            <span className="font-semibold">{Math.round(crop.requirements.K)} kg/ha</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>pH:</span>
                                            <span className="font-semibold">{crop.requirements.ph.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Advanced Features - Show if card exists */}
            {
                card && (
                    <>
                        {/* IoT Sensor Dashboard */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                    <Activity className="w-6 h-6 text-blue-600 mr-2" />
                                    Real-Time IoT Sensors
                                </h2>
                            </div>
                            <IoTDashboard farmerId={userProfile.farmerId} location={location} />
                        </div>

                        {/* Weather Forecast */}
                        <div className="mt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">7-Day Weather Forecast</h2>
                            <WeatherForecast location={location} />
                        </div>

                        {/* Soil Health History */}
                        <div className="mt-6">
                            <SoilHistoryGraph soilData={card} days={30} />
                        </div>

                        {/* Fertilizer Advisory */}
                        {fertilizerAdvisory && (
                            <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Fertilizer Recommendations</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600 mb-1">Urea (Nitrogen)</div>
                                        <div className="text-2xl font-bold text-blue-700">
                                            {fertilizerAdvisory.fertilizers.urea.quantity} kg
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1">
                                            ₹{fertilizerAdvisory.fertilizers.urea.price}/kg
                                        </div>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="text-sm text-yellow-600 mb-1">DAP (Phosphorus)</div>
                                        <div className="text-2xl font-bold text-yellow-700">
                                            {fertilizerAdvisory.fertilizers.dap.quantity} kg
                                        </div>
                                        <div className="text-xs text-yellow-600 mt-1">
                                            ₹{fertilizerAdvisory.fertilizers.dap.price}/kg
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <div className="text-sm text-purple-600 mb-1">MOP (Potassium)</div>
                                        <div className="text-2xl font-bold text-purple-700">
                                            {fertilizerAdvisory.fertilizers.mop.quantity} kg
                                        </div>
                                        <div className="text-xs text-purple-600 mt-1">
                                            ₹{fertilizerAdvisory.fertilizers.mop.price}/kg
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="font-semibold text-green-800 mb-2">Total Cost</div>
                                    <div className="text-3xl font-bold text-green-700">
                                        ₹{fertilizerAdvisory.totalCost}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-semibold text-gray-800 mb-3">Application Schedule</h3>
                                    <div className="space-y-2">
                                        {fertilizerAdvisory.applicationSchedule.map((stage, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <div className="font-medium text-gray-800">{stage.stage}</div>
                                                    <div className="text-sm text-gray-600">{stage.timing}</div>
                                                </div>
                                                <div className="text-lg font-bold text-green-600">
                                                    {stage.percentage}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Irrigation Schedule */}
                        {irrigationSchedule && (
                            <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Irrigation Schedule</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="text-sm text-blue-600 mb-1">Daily Requirement</div>
                                        <div className="text-2xl font-bold text-blue-700">
                                            {irrigationSchedule.dailyRequirement} mm/day
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="text-sm text-green-600 mb-1">Frequency</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {irrigationSchedule.frequency}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <div className="text-sm text-purple-600 mb-1">Total Water/Day</div>
                                        <div className="text-2xl font-bold text-purple-700">
                                            {irrigationSchedule.totalWaterPerDay} L
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                    <div className="font-semibold text-blue-800 mb-1">Current Status</div>
                                    <div className="text-sm text-blue-700">{irrigationSchedule.recommendation}</div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="font-semibold text-gray-800 mb-2">Recommended Method</div>
                                    <div className="text-gray-700">{irrigationSchedule.method}</div>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-semibold text-gray-800 mb-2">Critical Growth Stages</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {irrigationSchedule.criticalStages.map((stage, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                                {stage}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )
            }
        </div >
    );
}
