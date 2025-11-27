import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, Sprout, Sparkles } from 'lucide-react';
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

const NPK_LEVELS = {
    nitrogen: [
        { label: 'Low (< 280 kg/ha)', value: 'Low', range: [0, 280] },
        { label: 'Medium (280-560 kg/ha)', value: 'Medium', range: [280, 560] },
        { label: 'High (> 560 kg/ha)', value: 'High', range: [560, 1000] }
    ],
    phosphorus: [
        { label: 'Low (< 10 kg/ha)', value: 'Low', range: [0, 10] },
        { label: 'Medium (10-25 kg/ha)', value: 'Medium', range: [10, 25] },
        { label: 'High (> 25 kg/ha)', value: 'High', range: [25, 100] }
    ],
    potassium: [
        { label: 'Low (< 110 kg/ha)', value: 'Low', range: [0, 110] },
        { label: 'Medium (110-280 kg/ha)', value: 'Medium', range: [110, 280] },
        { label: 'High (> 280 kg/ha)', value: 'High', range: [280, 600] }
    ]
};

export default function NewCard() {
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('form'); // form, generating, success

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStep('generating');

        const formData = new FormData(e.target);

        // Convert NPK levels to numeric values (using mid-range)
        const nLevel = NPK_LEVELS.nitrogen.find(l => l.value === formData.get('nitrogen'));
        const pLevel = NPK_LEVELS.phosphorus.find(l => l.value === formData.get('phosphorus'));
        const kLevel = NPK_LEVELS.potassium.find(l => l.value === formData.get('potassium'));

        const nValue = Math.round((nLevel.range[0] + nLevel.range[1]) / 2);
        const pValue = Math.round((pLevel.range[0] + pLevel.range[1]) / 2);
        const kValue = Math.round((kLevel.range[0] + kLevel.range[1]) / 2);

        const soilData = {
            farmerName: formData.get('farmerName'),
            village: formData.get('village'),
            state: formData.get('state'),
            farmSize: parseFloat(formData.get('farmSize')),
            ph: parseFloat(formData.get('ph')),
            organicCarbon: parseFloat(formData.get('organicCarbon') || 1.0),
            npk: `${nValue}:${pValue}:${kValue}`,
            nitrogenLevel: formData.get('nitrogen'),
            phosphorusLevel: formData.get('phosphorus'),
            potassiumLevel: formData.get('potassium'),
        };

        try {
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
            const aiRecommendations = await generateRecommendations(soilData);

            // Get weather data for farming schedule
            const weatherData = await getWeatherData(soilData.village);

            // Generate detailed farming schedule
            const farmingSchedule = await generateFarmingSchedule(soilData, soilData.village, weatherData);

            const cardData = {
                ...soilData,
                recommendations: formData.get('recommendations') || aiRecommendations,
                farmingSchedule: farmingSchedule,
                createdAt: new Date().toISOString(),
                userId: currentUser.uid,
                farmerId: userProfile.farmerId
            };

            // Save to farmers collection
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            await setDoc(farmerRef, {
                userId: currentUser.uid,
                card: cardData,
                hasCard: true,
                updatedAt: new Date().toISOString()
            });

            // Update user profile
            await updateDoc(doc(db, 'users', currentUser.uid), {
                hasCard: true
            });

            setStep('success');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error) {
            console.error("Error adding card: ", error);
            setLoading(false);
            setStep('form');
            alert("Failed to generate card. Please try again.");
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    <Sprout className="w-6 h-6 text-green-600 mr-2" />
                    Register New Farmer
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Enter farmer details and soil conditions to generate visual smart card
                </p>

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
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="2.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Soil Health Parameters */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Health Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    pH Level <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="ph"
                                    required
                                    min="0"
                                    max="14"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="7.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Nitrogen Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="nitrogen"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                >
                                    <option value="">Select Level</option>
                                    {NPK_LEVELS.nitrogen.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Phosphorus Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="phosphorus"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                >
                                    <option value="">Select Level</option>
                                    {NPK_LEVELS.phosphorus.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Potassium Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="potassium"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                >
                                    <option value="">Select Level</option>
                                    {NPK_LEVELS.potassium.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">
                                    Organic Carbon (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="organicCarbon"
                                    required
                                    min="0"
                                    max="10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="1.5"
                                    defaultValue="1.0"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Recommendations (Optional)</label>
                        <textarea
                            name="recommendations"
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
