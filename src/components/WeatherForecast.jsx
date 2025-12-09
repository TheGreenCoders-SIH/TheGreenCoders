// Weather Forecast Component - 7-day forecast display
import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertCircle } from 'lucide-react';
import { getWeatherForecast, getRainPrediction, getExtremeWeatherAlerts } from '../lib/api';
import { motion } from 'framer-motion';

export default function WeatherForecast({ location = 'Delhi' }) {
    const [forecast, setForecast] = useState([]);
    const [rainPrediction, setRainPrediction] = useState(null);
    const [extremeAlerts, setExtremeAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWeatherData();
    }, [location]);

    const loadWeatherData = async () => {
        setLoading(true);
        try {
            const [forecastData, rainData, alerts] = await Promise.all([
                getWeatherForecast(location),
                getRainPrediction(location),
                getExtremeWeatherAlerts(location)
            ]);

            setForecast(forecastData);
            setRainPrediction(rainData);
            setExtremeAlerts(alerts);
        } catch (error) {
            console.error('Weather data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeatherIcon = (condition) => {
        switch (condition.toLowerCase()) {
            case 'clear':
            case 'sunny':
                return <Sun className="w-8 h-8 text-yellow-500" />;
            case 'clouds':
                return <Cloud className="w-8 h-8 text-gray-500" />;
            case 'rain':
                return <CloudRain className="w-8 h-8 text-blue-500" />;
            default:
                return <Cloud className="w-8 h-8 text-gray-400" />;
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-50 border-red-500 text-red-700';
            case 'medium': return 'bg-yellow-50 border-yellow-500 text-yellow-700';
            default: return 'bg-blue-50 border-blue-500 text-blue-700';
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const getTimeBasedBackground = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) {
            return 'bg-gradient-to-br from-orange-100 to-blue-100'; // Morning
        } else if (hour >= 11 && hour < 16) {
            return 'bg-gradient-to-br from-blue-100 to-yellow-100'; // Day (Sunny)
        } else if (hour >= 16 && hour < 19) {
            return 'bg-gradient-to-br from-orange-200 to-purple-200'; // Sunset
        } else {
            return 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white'; // Night
        }
    };

    const bgClass = getTimeBasedBackground();
    const isNight = new Date().getHours() >= 19 || new Date().getHours() < 5;

    return (
        <div className="space-y-6">
            {/* Extreme Weather Alerts */}
            {extremeAlerts.length > 0 && (
                <div className="space-y-2">
                    {extremeAlerts.slice(0, 2).map((alert, idx) => (
                        <div key={idx} className={`border-l-4 p-4 rounded-lg bg-white ${getSeverityColor(alert.severity)}`}>
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-semibold">{alert.message}</div>
                                    <div className="text-sm mt-1">Action: {alert.action}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rain Prediction & Irrigation Adjustment */}
            {rainPrediction && (
                <div className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <Droplets className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                        <div className="flex-1">
                            <div className="font-semibold text-blue-800 mb-1">
                                Rain Forecast: {rainPrediction.averageRainProbability}% (Next 3 Days)
                            </div>
                            <div className="text-sm text-blue-700">
                                {rainPrediction.irrigationAdjustment}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7-Day Forecast */}
            <div className={`${bgClass} p-6 rounded-xl shadow-lg border border-white/20 transition-all duration-1000`}>
                <h3 className={`text-lg font-bold mb-4 ${isNight ? 'text-white' : 'text-gray-800'}`}>7-Day Weather Forecast</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {forecast.map((day, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className={`${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-white/60 border-white/40 text-gray-800'} backdrop-blur-sm p-4 rounded-lg text-center border hover:shadow-lg transition-all`}
                        >
                            <div className={`font-semibold text-sm mb-2 ${isNight ? 'text-gray-200' : 'text-gray-700'}`}>
                                {formatDate(day.date)}
                            </div>

                            <div className="flex justify-center mb-2">
                                {getWeatherIcon(day.condition)}
                            </div>

                            <div className={`text-xs mb-2 capitalize ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>
                                {day.condition}
                            </div>

                            <div className="flex justify-center items-center space-x-2 mb-2">
                                <span className={`text-lg font-bold ${isNight ? 'text-white' : 'text-gray-900'}`}>{day.tempMax}°</span>
                                <span className={`text-sm ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>{day.tempMin}°</span>
                            </div>

                            {/* Rain Probability */}
                            {day.rainProbability > 20 && (
                                <div className={`flex items-center justify-center text-xs mb-1 ${isNight ? 'text-blue-300' : 'text-blue-600'}`}>
                                    <Droplets className="w-3 h-3 mr-1" />
                                    {day.rainProbability}%
                                </div>
                            )}

                            {/* Humidity */}
                            <div className={`text-xs ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Wind className="w-3 h-3 inline mr-1" />
                                {day.humidity}%
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Farming Activity Suggestions */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Recommended Activities</h4>
                <ul className="space-y-1 text-sm text-green-700">
                    {forecast[0]?.rainProbability > 60 ? (
                        <>
                            <li>• Postpone fertilizer application</li>
                            <li>• Ensure proper field drainage</li>
                            <li>• Skip irrigation for next 2-3 days</li>
                        </>
                    ) : forecast[0]?.tempMax > 35 ? (
                        <>
                            <li>• Increase irrigation frequency</li>
                            <li>• Provide shade for sensitive crops</li>
                            <li>• Monitor for heat stress</li>
                        </>
                    ) : (
                        <>
                            <li>• Good time for field operations</li>
                            <li>• Continue regular irrigation schedule</li>
                            <li>• Suitable for fertilizer application</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
