// NDVI Map Component - Crop Health Visualization
import React, { useState, useEffect } from 'react';
import { Layers, TrendingUp, AlertCircle, MapPin } from 'lucide-react';
import satelliteDataService from '../lib/satelliteData';
import { motion } from 'framer-motion';

export default function NDVIMap({ farmerId, location, farmSize = 2.5 }) {
    const [ndviData, setNdviData] = useState(null);
    const [historicalTrend, setHistoricalTrend] = useState([]);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNDVIData();
    }, [farmerId, location]);

    const loadNDVIData = async () => {
        setLoading(true);
        try {
            // Get current NDVI data
            const latitude = 28.6139; // Delhi coordinates (default)
            const longitude = 77.2090;

            const ndvi = satelliteDataService.generateMockNDVI(latitude, longitude, farmSize);
            const trend = satelliteDataService.getHistoricalNDVI(latitude, longitude, 6);
            const cropInsights = satelliteDataService.getCropHealthInsights(ndvi);

            setNdviData(ndvi);
            setHistoricalTrend(trend);
            setInsights(cropInsights);
        } catch (error) {
            console.error('NDVI data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getHealthColor = (health) => {
        switch (health.status) {
            case 'excellent': return health.color;
            case 'good': return health.color;
            case 'moderate': return health.color;
            case 'poor': return health.color;
            case 'critical': return health.color;
            default: return '#ccc';
        }
    };

    const getHealthLabel = (status) => {
        const labels = {
            excellent: 'Excellent',
            good: 'Good',
            moderate: 'Moderate',
            poor: 'Poor',
            critical: 'Critical'
        };
        return labels[status] || 'Unknown';
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Layers className="w-6 h-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-bold text-gray-800">NDVI Crop Health Map</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {location || 'Your Farm'}
                    </div>
                </div>

                {/* NDVI Grid Heatmap */}
                <div className="mb-6">
                    <div className="grid gap-1" style={{
                        gridTemplateColumns: `repeat(${ndviData.gridSize}, 1fr)`,
                        aspectRatio: '1/1',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        {ndviData.grid.map((row, rowIdx) =>
                            row.map((cell, colIdx) => (
                                <motion.div
                                    key={`${rowIdx}-${colIdx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (rowIdx * ndviData.gridSize + colIdx) * 0.01 }}
                                    className="rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ backgroundColor: getHealthColor(cell.health) }}
                                    title={`NDVI: ${cell.ndvi} - ${getHealthLabel(cell.health.status)}`}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {['excellent', 'good', 'moderate', 'poor', 'critical'].map((status) => {
                        const health = satelliteDataService.getNDVIHealthStatus(
                            status === 'excellent' ? 0.85 :
                                status === 'good' ? 0.7 :
                                    status === 'moderate' ? 0.5 :
                                        status === 'poor' ? 0.3 : 0.15
                        );
                        return (
                            <div key={status} className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded mr-2"
                                    style={{ backgroundColor: health.color }}
                                />
                                <span className="text-sm text-gray-700 capitalize">{status}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm text-green-600 mb-1">Average NDVI</div>
                        <div className="text-2xl font-bold text-green-700">
                            {ndviData.statistics.average.toFixed(3)}
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">Min NDVI</div>
                        <div className="text-2xl font-bold text-blue-700">
                            {ndviData.statistics.min.toFixed(3)}
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm text-purple-600 mb-1">Max NDVI</div>
                        <div className="text-2xl font-bold text-purple-700">
                            {ndviData.statistics.max.toFixed(3)}
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-sm text-yellow-600 mb-1">Farm Size</div>
                        <div className="text-2xl font-bold text-yellow-700">
                            {farmSize} acres
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-4">Health Distribution</h4>
                <div className="space-y-3">
                    {Object.entries(ndviData.statistics.healthDistribution).map(([status, count]) => {
                        const percentage = (count / ndviData.statistics.totalCells) * 100;
                        const health = satelliteDataService.getNDVIHealthStatus(
                            status === 'excellent' ? 0.85 :
                                status === 'good' ? 0.7 :
                                    status === 'moderate' ? 0.5 :
                                        status === 'poor' ? 0.3 : 0.15
                        );

                        return (
                            <div key={status}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                                    <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: health.color
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
                <div className="space-y-3">
                    {insights.map((insight, idx) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border-l-4 ${insight.type === 'positive' ? 'bg-green-50 border-green-500 text-green-700' :
                                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' :
                                        'bg-blue-50 border-blue-500 text-blue-700'
                                }`}
                        >
                            <div className="flex items-start">
                                {insight.type === 'warning' ? (
                                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                                ) : (
                                    <TrendingUp className="w-5 h-5 mr-2 mt-0.5" />
                                )}
                                <div>
                                    <div className="font-semibold mb-1">{insight.message}</div>
                                    <div className="text-sm">{insight.recommendation}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Historical Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-4">6-Month NDVI Trend</h4>
                <div className="space-y-2">
                    {historicalTrend.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="text-sm text-gray-600 w-24">
                                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${(point.ndvi / 1) * 100}%`,
                                            backgroundColor: satelliteDataService.getNDVIHealthStatus(point.ndvi).color
                                        }}
                                    />
                                </div>
                                <div className="text-sm font-semibold text-gray-700 w-16">
                                    {point.ndvi.toFixed(3)}
                                </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full capitalize ${point.health === 'excellent' || point.health === 'good' ? 'bg-green-100 text-green-700' :
                                    point.health === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {point.health}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
