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

    return (
        <div className="space-y-6">
            {/* Extreme Weather Alerts */}
            {extremeAlerts.length > 0 && (
                <div className="space-y-2">
                    {extremeAlerts.slice(0, 2).map((alert, idx) => (
                        <div key={idx} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
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
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">7-Day Weather Forecast</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {forecast.map((day, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200 hover:shadow-md transition-all"
                        >
                            <div className="font-semibold text-sm text-gray-700 mb-2">
                                {formatDate(day.date)}
                            </div>

                            <div className="flex justify-center mb-2">
                                {getWeatherIcon(day.condition)}
                            </div>

                            <div className="text-xs text-gray-600 mb-2 capitalize">
                                {day.condition}
                            </div>

                            <div className="flex justify-center items-center space-x-2 mb-2">
                                <span className="text-lg font-bold text-gray-900">{day.tempMax}°</span>
                                <span className="text-sm text-gray-500">{day.tempMin}°</span>
                            </div>

                            {/* Rain Probability */}
                            {day.rainProbability > 20 && (
                                <div className="flex items-center justify-center text-xs text-blue-600 mb-1">
                                    <Droplets className="w-3 h-3 mr-1" />
                                    {day.rainProbability}%
                                </div>
                            )}

                            {/* Humidity */}
                            <div className="text-xs text-gray-500">
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
