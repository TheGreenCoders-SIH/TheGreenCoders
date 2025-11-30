// Crop Recommendations Page - ML-Powered Crop Advisor
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getWeatherData } from '../lib/api';
import { getCropRecommendations } from '../lib/cropRecommendation';
import { Sprout, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CropRecommendationsPage() {
    const { currentUser, userProfile } = useAuth();
    const [cropRecommendations, setCropRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [card, setCard] = useState(null);

    useEffect(() => {
        loadRecommendations();
    }, [userProfile]);

    const loadRecommendations = async () => {
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data().card;
                setCard(cardData);

                const weatherData = await getWeatherData(cardData.village);

                // Try ML first, fallback to CSV
                try {
                    const mlAPI = await import('../lib/mlAPI');
                    const crops = await mlAPI.getEnhancedCropRecommendations(cardData, weatherData, 10);
                    setCropRecommendations(crops);
                } catch (error) {
                    const crops = getCropRecommendations(cardData, weatherData, 10);
                    setCropRecommendations(crops);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                    <Sprout className="w-7 h-7 mr-2" />
                    🌾 Crop Recommendations
                </h1>
                <p className="text-green-100">
                    {cropRecommendations[0]?.source === 'ML'
                        ? '🤖 AI-Powered predictions based on your soil and weather'
                        : 'Based on your soil parameters and local conditions'}
                </p>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cropRecommendations.map((crop, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        className={`p-6 rounded-xl border-2 shadow-lg transition-all ${index === 0
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white'
                                : 'bg-white border-green-200 hover:border-green-400'
                            }`}
                    >
                        {index === 0 && (
                            <div className="flex items-center justify-between mb-3">
                                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                    ⭐ TOP CHOICE
                                </span>
                                {crop.suitability && (
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold">
                                        {crop.suitability}% Match
                                    </span>
                                )}
                            </div>
                        )}

                        <h3 className={`text-2xl font-bold mb-2 capitalize ${index === 0 ? 'text-white' : 'text-gray-800'}`}>
                            {crop.crop}
                        </h3>

                        {index !== 0 && crop.suitability && (
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-semibold">Suitability</span>
                                    <span className="text-green-700 font-bold">{crop.suitability}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${crop.suitability}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <p className={`text-sm mb-4 ${index === 0 ? 'text-green-50' : 'text-gray-600'}`}>
                            {crop.reason || 'Suitable for your soil conditions'}
                        </p>

                        {crop.requirements && (
                            <div className={`text-xs ${index === 0 ? 'text-green-100' : 'text-gray-500'} space-y-1 border-t ${index === 0 ? 'border-green-400' : 'border-gray-200'} pt-3`}>
                                <div className="flex justify-between">
                                    <span>NPK Required:</span>
                                    <span className="font-semibold">
                                        {Math.round(crop.requirements.N)}:{Math.round(crop.requirements.P)}:{Math.round(crop.requirements.K)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ideal pH:</span>
                                    <span className="font-semibold">{crop.requirements.ph?.toFixed(1)}</span>
                                </div>
                            </div>
                        )}

                        {crop.source === 'ML' && (
                            <div className={`mt-3 px-2 py-1 rounded text-xs font-semibold ${index === 0 ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
                                <Sparkles className="w-3 h-3 inline mr-1" />
                                ML Prediction
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Info Card */}
            {cropRecommendations[0]?.source === 'ML' && card && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-2">🤖 Machine Learning Analysis</h3>
                    <p className="text-sm text-purple-800">
                        Our AI model analyzed your soil's N:{card.npk.split(':')[0]}, P:{card.npk.split(':')[1]}, K:{card.npk.split(':')[2]},
                        pH:{card.ph}, organic carbon:{card.organicCarbon}%, and current weather to generate these predictions with
                        <strong> {cropRecommendations[0].suitability}% confidence</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
