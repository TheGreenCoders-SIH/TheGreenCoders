// AI Farming Suggestions Page
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateFarmingSchedule, speakText, stopSpeaking } from '../lib/aiRecommendations';
import { getWeatherData } from '../lib/api';
import { Sparkles, Volume2, VolumeX, Loader2 } from 'lucide-react';

export default function AIAdvice() {
    const { userProfile } = useAuth();
    const [card, setCard] = useState(null);
    const [aiRecommendations, setAiRecommendations] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAIAdvice();
    }, [userProfile]);

    const loadAIAdvice = async () => {
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data().card;
                setCard(cardData);

                const weatherData = await getWeatherData(cardData.village);
                const schedule = await generateFarmingSchedule(cardData, cardData.village, weatherData);
                setAiRecommendations(schedule);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
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

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-purple-700 to-purple-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                    <Sparkles className="w-7 h-7 mr-2" />
                    AI Farming Suggestions
                </h1>
                <p className="text-purple-100">Personalized advice powered by Gemini AI</p>
            </div>

            {aiRecommendations ? (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Your Custom Farming Schedule</h2>
                        <button
                            onClick={toggleSpeech}
                            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${isSpeaking
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {isSpeaking ? (
                                <>
                                    <VolumeX className="w-5 h-5 mr-2" />
                                    Stop Voice
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-5 h-5 mr-2" />
                                    Read Aloud
                                </>
                            )}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {aiRecommendations.split('\n').filter(line => line.trim()).map((line, idx) => {
                            const cleanLine = line.replace(/^#{1,6}\s/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
                            const isHeader = line.trim().startsWith('#');

                            if (!cleanLine) return null;

                            return isHeader ? (
                                <h3 key={idx} className="text-lg font-bold text-purple-800 mt-6 mb-3 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                                    {cleanLine}
                                </h3>
                            ) : (
                                <p key={idx} className="text-gray-700 leading-relaxed ml-4 pl-4 border-l-2 border-purple-200">
                                    {cleanLine}
                                </p>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-yellow-600" />
                    <p className="text-yellow-700">Generating AI recommendations...</p>
                </div>
            )}
        </div>
    );
}
