// Voice Advisory Page - Text-to-Speech Farming Guidance
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateFarmingSchedule, speakText, stopSpeaking } from '../lib/aiRecommendations';
import { getWeatherData } from '../lib/api';
import { Volume2, VolumeX, Loader2, Mic, FileText } from 'lucide-react';

export default function VoiceAdvisory() {
    const { userProfile } = useAuth();
    const [card, setCard] = useState(null);
    const [aiRecommendations, setAiRecommendations] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    useEffect(() => {
        loadAdvice();
    }, [userProfile]);

    const loadAdvice = async () => {
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
            const success = speakText(aiRecommendations, selectedLanguage);
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
            <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                    <Volume2 className="w-7 h-7 mr-2" />
                    Voice Advisory
                </h1>
                <p className="text-indigo-100">Listen to personalized farming guidance in your language</p>
            </div>

            {/* Voice Controls */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="en">🇬🇧 English</option>
                            <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                            <option value="pa">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
                            <option value="bn">🇮🇳 বাংলা (Bengali)</option>
                        </select>
                    </div>

                    <button
                        onClick={toggleSpeech}
                        disabled={!aiRecommendations}
                        className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${isSpeaking
                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSpeaking ? (
                            <>
                                <VolumeX className="w-6 h-6 mr-2" />
                                Stop Voice
                            </>
                        ) : (
                            <>
                                <Mic className="w-6 h-6 mr-2" />
                                Start Voice Advisory
                            </>
                        )}
                    </button>
                </div>

                {isSpeaking && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-center">
                            <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-8 bg-purple-600 rounded-full animate-pulse"
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    />
                                ))}
                            </div>
                            <span className="ml-4 text-purple-700 font-semibold">Playing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Text Content */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center mb-4">
                    <FileText className="w-6 h-6 text-gray-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Advisory Content</h2>
                </div>

                {aiRecommendations ? (
                    <div className="space-y-4">
                        {aiRecommendations.split('\n').filter(line => line.trim()).map((line, idx) => {
                            // Remove markdown symbols
                            const cleanLine = line.replace(/^#{1,6}\s/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();

                            // Check if it's a header (originally had #)
                            const isHeader = line.trim().startsWith('#');

                            if (!cleanLine) return null;

                            return isHeader ? (
                                <h3 key={idx} className="text-lg font-bold text-gray-800 mt-4 mb-2">
                                    {cleanLine}
                                </h3>
                            ) : (
                                <p key={idx} className="text-gray-700 leading-relaxed ml-4">
                                    • {cleanLine}
                                </p>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                        <p>Loading advisory content...</p>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">📢 Voice Advisory Features</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Listen to farming advice hands-free while working</li>
                    <li>• Content automatically tailored to your soil and crops</li>
                    <li>• Updated based on current weather conditions</li>
                    <li>• Can be paused and resumed anytime</li>
                </ul>
            </div>
        </div>
    );
}
