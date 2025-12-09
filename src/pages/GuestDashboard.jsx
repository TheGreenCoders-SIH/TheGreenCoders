import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, CloudSun, MapPin, TrendingUp, Sparkles, Volume2, Leaf, Calendar, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import WeatherForecast from '../components/WeatherForecast';
import LanguageSelector from '../components/LanguageSelector';
import { T } from '../hooks/useTranslation';

export default function GuestDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    // Mock data for guests
    const weather = { temp: 24, description: 'Sunny', location: 'Demo Village' };

    return (
        <div className="min-h-screen bg-green-50/50 pb-24">
            {/* Guest Hero */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-800 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-green-100 text-sm font-medium mb-1">
                            <Calendar className="w-4 h-4" />
                            {currentDate}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            <T>Welcome, Guest Farmer!</T> 🌿
                        </h1>
                        <p className="text-green-100 opacity-90 max-w-lg">
                            <T>Explore the features of GreenCoders in this demo mode.</T>
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
                            <div className="bg-white/20 p-3 rounded-full">
                                <CloudSun className="w-8 h-8 text-yellow-300" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{weather.temp}°C</div>
                                <div className="text-green-100 text-sm"><T>{weather.description}</T></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 space-y-8">
                {/* Guest Action Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <GuestCard icon={MapPin} color="bg-blue-500" title="Soil Card" />
                    <GuestCard icon={Volume2} color="bg-purple-500" title="Voice Guide" />
                    <GuestCard icon={Sparkles} color="bg-indigo-500" title="AI Advisor" />
                    <GuestCard icon={Sprout} color="bg-green-500" title="Crop Advice" />
                    <GuestCard icon={TrendingUp} color="bg-orange-500" title="Market" />
                    <GuestCard icon={Leaf} color="bg-teal-500" title="NGOs" />
                </div>

                {/* Call to Action */}
                <div className="bg-white rounded-3xl shadow-lg border border-green-100 p-8 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            <T>Unlock Full Potential</T>
                        </h2>
                        <p className="text-gray-600 mb-6">
                            <T>You are viewing a limited guest version. Log in to save your soil data, get personalized AI recommendations, and connect with real buyers.</T>
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/login" className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center shadow-lg hover:shadow-green-500/30">
                                <T>Login / Sign Up</T>
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <button onClick={() => navigate('/')} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition">
                                <T>Back to Home</T>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const GuestCard = ({ icon: Icon, color, title }) => (
    <div className="group relative opacity-75 hover:opacity-100 transition-opacity">
        <div className={`
            bg-white p-4 rounded-2xl shadow-sm border border-gray-100 
            flex flex-col items-center justify-center gap-3 aspect-square
        `}>
            <div className={`
                w-12 h-12 rounded-xl ${color} text-white 
                flex items-center justify-center shadow-md 
            `}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs md:text-sm font-bold text-gray-700 text-center leading-tight">
                <T>{title}</T>
            </span>
        </div>
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
            <Lock className="w-6 h-6 text-gray-500" />
        </div>
    </div>
);
