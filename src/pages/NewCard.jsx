import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, Sprout, Sparkles, Wifi } from 'lucide-react';
import { generateRecommendations } from '../lib/gemini';
import { generateFarmingSchedule } from '../lib/aiRecommendations';
import { getWeatherData } from '../lib/api';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function NewCard() {
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form'); // form, generating, success
    const [sensorLoading, setSensorLoading] = useState(false);

    // Form state to allow programmatic updates (Sensor Data)
    const [formData, setFormData] = useState({
        farmerName: '',
        village: '',
        state: '',
        farmSize: '',
        ph: '',
        organicCarbon: '1.0',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        temperature: '',
        humidity: '',
        rainfall: '',
        recommendations: ''
    });

    // Pre-fill data from profile
    useEffect(() => {
        const fetchProfileData = async () => {
            if (userProfile?.farmerId) {
                try {
                    const farmerRef = doc(db, 'farmers', userProfile.farmerId);
                    const farmerSnap = await getDoc(farmerRef);

                    if (farmerSnap.exists()) {
                        const data = farmerSnap.data().card;
                        if (data) {
                            setFormData(prev => ({
                                ...prev,
                                farmerName: data.farmerName || '',
                                village: data.village || '',
                                state: data.state || '',
                                farmSize: data.farmSize || '',
                                ph: data.ph || '',
                                organicCarbon: data.organicCarbon || '1.0',
                                nitrogen: data.N || data.npk?.split(':')[0] || '',
                                phosphorus: data.P || data.npk?.split(':')[1] || '',
                                potassium: data.K || data.npk?.split(':')[2] || '',
                                temperature: data.temperature || '',
                                humidity: data.humidity || '',
                                rainfall: data.rainfall || ''
                            }));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                }
            }
        };

        fetchProfileData();
    }, [userProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const fetchSensorData = async () => {
        setSensorLoading(true);
        // Simulate fetching data from IoT sensors
        await new Promise(resolve => setTimeout(resolve, 1500));

        setFormData(prev => ({
            ...prev,
            ph: (5.5 + Math.random() * 2.5).toFixed(1), // 5.5 - 8.0
            organicCarbon: (0.5 + Math.random() * 1.0).toFixed(2), // 0.5 - 1.5
            nitrogen: Math.floor(100 + Math.random() * 100).toString(), // 100 - 200
            phosphorus: Math.floor(20 + Math.random() * 40).toString(), // 20 - 60
            potassium: Math.floor(30 + Math.random() * 50).toString(), // 30 - 80
            temperature: (25 + Math.random() * 10).toFixed(1), // 25 - 35
            humidity: Math.floor(40 + Math.random() * 40).toString(), // 40 - 80
            rainfall: Math.floor(500 + Math.random() * 1000).toString() // 500 - 1500
        }));
        setSensorLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStep('generating');

        const soilData = {
            farmerName: formData.farmerName,
            village: formData.village,
            state: formData.state,
            farmSize: parseFloat(formData.farmSize),
            ph: parseFloat(formData.ph),
            organicCarbon: parseFloat(formData.organicCarbon),
            // Store NPK as string "N:P:K" for compatibility
            npk: `${formData.nitrogen}:${formData.phosphorus}:${formData.potassium}`,
            // Also store individual values for ML
            N: parseFloat(formData.nitrogen),
            P: parseFloat(formData.phosphorus),
            K: parseFloat(formData.potassium),
            temperature: parseFloat(formData.temperature),
            humidity: parseFloat(formData.humidity),
            rainfall: parseFloat(formData.rainfall)
        };

        try {
            console.log("Starting card generation...", soilData);

            if (!userProfile?.farmerId) {
                throw new Error("Farmer ID not found in user profile");
            }

            // Check if farmer already has a card
            if (userProfile.role === 'farmer') {
                const farmerRef = doc(db, 'farmers', userProfile.farmerId);
                const farmerSnap = await getDoc(farmerRef);

                if (farmerSnap.exists() && farmerSnap.data().card) {
                    alert('You already have a soil health card. Farmers can only create one card.');
                    setLoading(false);
                    setStep('form');
                    return;
                }
            }

            // Generate AI recommendations
            console.log("Generating AI recommendations...");
            const aiRecommendations = await generateRecommendations(soilData);
            console.log("AI Recommendations generated:", aiRecommendations ? "Success" : "Failed");

            // Use provided weather data or fetch if missing (though form requires it now)
            let weatherData = {
                temp: soilData.temperature,
                humidity: soilData.humidity,
                rainfall: soilData.rainfall,
                description: 'Local Sensor Data'
            };

            // Generate detailed farming schedule
            console.log("Generating farming schedule...");
            const farmingSchedule = await generateFarmingSchedule(soilData, soilData.village, weatherData);
            console.log("Farming schedule generated");

            const cardData = {
                ...soilData,
                recommendations: formData.recommendations || aiRecommendations,
                farmingSchedule: farmingSchedule,
                createdAt: new Date().toISOString(),
                userId: currentUser.uid,
                farmerId: userProfile.farmerId
            };

            // Save to farmers collection
            console.log("Saving to Firestore...", cardData);
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            await setDoc(farmerRef, {
                userId: currentUser.uid,
                card: cardData,
                hasCard: true,
                updatedAt: new Date().toISOString()
            });
            console.log("Saved to Firestore successfully");

            // Update user profile
            await updateDoc(doc(db, 'users', currentUser.uid), {
                hasCard: true
            });

            setStep('success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error) {
            console.error("Error adding card FULL DETAILS: ", error);
            console.error("Error message:", error.message);
            console.error("Error code:", error.code);

            setLoading(false);
            setStep('form');
            alert(`Failed to generate card: ${error.message || "Unknown error"}`);
        }
    };

    if (step === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-16 h-16 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mt-6">Generating AI Recommendations...</h2>
                <p className="text-gray-500 mt-2">Gemini AI is analyzing your soil data</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                    <CheckCircle className="w-20 h-20 text-green-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 mt-6">Card Generated!</h2>
                <p className="text-gray-500 mt-2">Redirecting to your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <Sprout className="w-6 h-6 text-green-600 mr-2" />
                            Register New Farmer
                        </h2>
                        <p className="text-sm text-gray-500">
                            Enter farmer details and soil conditions to generate visual smart card
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchSensorData}
                        disabled={sensorLoading}
                        className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        {sensorLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Wifi className="w-4 h-4 mr-2" />
                        )}
                        Fetch Sensor Data
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Farmer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="farmerName"
                                    value={formData.farmerName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="Test Farmer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Village <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="village"
                                    value={formData.village}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="Test Village"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Farm Size (acres) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="farmSize"
                                    value={formData.farmSize}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="2.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Soil Health Parameters */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil & Weather Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Nitrogen (N) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="nitrogen"
                                    value={formData.nitrogen}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="mg/kg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Phosphorus (P) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="phosphorus"
                                    value={formData.phosphorus}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="mg/kg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Potassium (K) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="potassium"
                                    value={formData.potassium}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="mg/kg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    pH Level <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="ph"
                                    value={formData.ph}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    max="14"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="7.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Organic Carbon (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="organicCarbon"
                                    value={formData.organicCarbon}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    max="10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="1.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Temperature (°C) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="temperature"
                                    value={formData.temperature}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="25.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Humidity (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    name="humidity"
                                    value={formData.humidity}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="60"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Rainfall (mm) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    name="rainfall"
                                    value={formData.rainfall}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="1000"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Recommendations (Optional)</label>
                        <textarea
                            name="recommendations"
                            value={formData.recommendations}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                            placeholder="Leave empty for AI-generated recommendations..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center justify-center disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate Smart Card with AI
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
