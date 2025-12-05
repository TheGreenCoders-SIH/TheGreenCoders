import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import FarmMap from '../components/FarmMap';
import CoordinateForm from '../components/CoordinateForm';
import NDVIChart from '../components/NDVIChart';
import { satelliteApi } from '../lib/satelliteApi';
import { Satellite, MapPin, Plus, Activity, Droplets, Info, X, ChevronRight, Loader2, Calendar, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SatelliteAnalytics = () => {
    const [user, setUser] = useState(null);
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [mode, setMode] = useState('map'); // 'map' or 'coordinates'
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFarmName, setNewFarmName] = useState('');
    const [mapVersion, setMapVersion] = useState(0);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                loadFarms();
            }
        });
        return () => unsubscribe();
    }, []);

    const loadFarms = async () => {
        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();
            const data = await satelliteApi.getFarms(token);
            setFarms(data);
            setError('');
        } catch (error) {
            console.error('Failed to load farms:', error);
            setError('Failed to load farms: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBoundaryCreated = async (boundary) => {
        if (!boundary) return;
        if (!newFarmName.trim()) {
            setError('Please enter a farm name');
            return;
        }

        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();

            const farm = await satelliteApi.createFarm(token, {
                name: newFarmName,
                boundary
            });

            setFarms([...farms, farm]);
            setSelectedFarm(farm);
            setShowCreateModal(false);
            setNewFarmName('');
            setError('');
        } catch (error) {
            console.error('Failed to create farm:', error);
            setError('Failed to create farm: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCoordinatesSubmit = async (coordinates) => {
        if (!newFarmName.trim()) {
            setError('Please enter a farm name');
            return;
        }

        try {
            setLoading(true);
            const token = await auth.currentUser.getIdToken();

            const farm = await satelliteApi.createFarmFromCoordinates(token, newFarmName, coordinates);

            setFarms([...farms, farm]);
            setSelectedFarm(farm);
            setShowCreateModal(false);
            setNewFarmName('');
            setError('');
        } catch (error) {
            console.error('Failed to create farm:', error);
            setError('Failed to create farm: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFarm) return;

        setAnalyzing(true);
        setError('');

        try {
            const token = await auth.currentUser.getIdToken();

            // Trigger analysis
            const result = await satelliteApi.analyzeFarm(token, selectedFarm.farm_id, {
                lookbackDays: 10
            });
            setAnalytics(result);

            // Load historical data
            const endDate = new Date();
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const history = await satelliteApi.getHistoricalAnalytics(
                token,
                selectedFarm.farm_id,
                {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    interval_days: 5
                }
            );
            setHistoricalData(history.data_points || []);
        } catch (error) {
            console.error('Analysis failed:', error);
            setError('Analysis failed: ' + error.message);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-100 max-w-md w-full">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Satellite className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
                    <p className="text-gray-600">Please log in to access satellite analytics features.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-12 px-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm mb-4 border border-white/20 shadow-xl">
                            <Satellite className="w-10 h-10 text-green-300" />
                        </div>
                        <h1 className="text-4xl font-bold mb-3 tracking-tight">Satellite Farm Analytics</h1>
                        <p className="text-lg text-green-100 max-w-2xl font-light">
                            Leverage advanced space-borne imagery to monitor crop health,
                            soil moisture, and vegetation indices (NDVI) with precision.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 -mt-8 relative z-20">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-md flex justify-between items-center">
                        <div className="text-red-700 font-medium">{error}</div>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar: Farms List */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <h2 className="font-bold text-gray-800 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                                    Your Farms
                                </h2>
                                const [mapVersion, setMapVersion] = useState(0);

                                // ... inside component ...

                                <button
                                    onClick={() => {
                                        setNewFarmName('');
                                        setError('');
                                        setMapVersion(v => v + 1);
                                        setShowCreateModal(true);
                                    }}
                                    className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add New
                                </button>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto p-2 space-y-2">
                                {loading && farms.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-green-400" />
                                        <span className="text-sm">Loading farms...</span>
                                    </div>
                                ) : farms.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg m-2">
                                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No farms added yet.</p>
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="text-green-600 font-medium text-sm mt-2 hover:underline"
                                        >
                                            Create your first farm
                                        </button>
                                    </div>
                                ) : (
                                    farms.map(farm => (
                                        <motion.div
                                            key={farm.farm_id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setSelectedFarm(farm)}
                                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${selectedFarm?.farm_id === farm.farm_id
                                                ? 'bg-green-50 border-green-200 shadow-md transform scale-[1.01]'
                                                : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className={`font-bold ${selectedFarm?.farm_id === farm.farm_id ? 'text-green-900' : 'text-gray-700'}`}>
                                                        {farm.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {new Date(farm.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {selectedFarm?.farm_id === farm.farm_id && (
                                                    <div className="bg-green-100 p-1 rounded-full">
                                                        <ChevronRight className="w-4 h-4 text-green-600" />
                                                    </div>
                                                )}
                                            </div>
                                            {farm.area_hectares && (
                                                <div className="mt-3 flex items-center text-xs font-medium text-green-600 bg-green-50/50 p-1.5 rounded w-fit">
                                                    <Activity className="w-3 h-3 mr-1" />
                                                    {farm.area_hectares.toFixed(2)} hectares
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Analysis */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode='wait'>
                            {selectedFarm ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Analysis Header Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                                <span className="bg-green-100 p-1.5 rounded-lg mr-2">
                                                    <Activity className="w-5 h-5 text-green-600" />
                                                </span>
                                                Analysis for {selectedFarm.name}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1 ml-10">
                                                Run satellite analysis to get real-time insights
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={analyzing}
                                            className={`px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center ${analyzing
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30'
                                                }`}
                                        >
                                            {analyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Processing Satellite Data...
                                                </>
                                            ) : (
                                                <>
                                                    <Satellite className="w-4 h-4 mr-2" />
                                                    Analyze Farm Now
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {analytics ? (
                                        <div className="space-y-6">
                                            {/* Status Cards Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Overall Health */}
                                                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                                        <Activity className="w-32 h-32 text-green-600" />
                                                    </div>
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-green-900 mb-1">Overall Farm Health</h3>
                                                            <p className="text-green-700/80 text-sm max-w-lg">{analytics.overall_health.description}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-4xl font-black text-green-600">{analytics.overall_health.score.toFixed(1)}</div>
                                                            <div className="text-sm font-bold text-green-700 uppercase tracking-wider">{analytics.overall_health.status}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* NDVI Metric */}
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-700 flex items-center">
                                                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                                                NDVI Index
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-1">Vegetation Health</p>
                                                        </div>
                                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                                                            Min: {analytics.ndvi.min?.toFixed(2)} | Max: {analytics.ndvi.max?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="text-3xl font-bold text-gray-800 mr-2">{analytics.ndvi.mean?.toFixed(2)}</span>
                                                        <span className="text-sm font-medium" style={{ color: analytics.ndvi.classification?.color }}>
                                                            {analytics.ndvi.classification?.health}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${(analytics.ndvi.mean || 0) * 100}%`,
                                                                backgroundColor: analytics.ndvi.classification?.color || '#cbd5e1'
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Soil Moisture */}
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-700 flex items-center">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                                                Soil Moisture
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-1">Water Content</p>
                                                        </div>
                                                        <Droplets className="w-5 h-5 text-blue-500 opacity-50" />
                                                    </div>
                                                    <div className="flex items-baseline">
                                                        <span className="text-3xl font-bold text-gray-800 mr-2">{analytics.soil_moisture.moisture_percentage}%</span>
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {analytics.soil_moisture.category}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                            style={{ width: `${analytics.soil_moisture.moisture_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Irrigation Alert */}
                                            <div className={`rounded-xl p-6 border-l-4 shadow-sm flex items-start gap-4 ${analytics.irrigation.priority === 'High'
                                                ? 'bg-red-50 border-red-500'
                                                : analytics.irrigation.priority === 'Medium'
                                                    ? 'bg-amber-50 border-amber-500'
                                                    : 'bg-blue-50 border-blue-500'
                                                }`}>
                                                <div className={`p-2 rounded-full ${analytics.irrigation.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                    analytics.irrigation.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    <Info className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{analytics.irrigation.recommendation}</h3>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Priority: {analytics.irrigation.priority}</span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm mb-2 font-medium">{analytics.irrigation.action}</p>
                                                    <p className="text-gray-500 text-sm">{analytics.irrigation.reason}</p>
                                                </div>
                                            </div>

                                            {/* History Chart */}
                                            {historicalData.length > 0 && (
                                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                                    <NDVIChart data={historicalData} title="30-Day Vegetation Health Trend" />
                                                </div>
                                            )}

                                            {/* Metadata Footer */}
                                            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 flex flex-wrap gap-4 justify-between items-center">
                                                <div>
                                                    <span className="font-semibold">Provider:</span> {analytics.satellite_data.provider}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Analysis Date:</span> {analytics.analysis_date}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Cloud Cover:</span> {analytics.satellite_data.cloud_coverage}%
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Satellite className="w-10 h-10 text-green-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Analyze</h3>
                                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                                Click the "Analyze Farm Now" button to fetch the latest satellite imagery and health metrics for <strong>{selectedFarm.name}</strong>.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 p-12 text-center h-full flex flex-col items-center justify-center">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <MapPin className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700">No Farm Selected</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                        Select a farm from the list on the left or create a new one to view analytics.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Create Farm Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">Add New Farm</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[85vh] overflow-y-auto">
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rice Field North"
                                        value={newFarmName}
                                        onChange={(e) => setNewFarmName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow"
                                    />
                                </div>

                                <div className="bg-gray-50 p-1 rounded-lg flex mb-6">
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'map' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        onClick={() => setMode('map')}
                                    >
                                        📍 Draw on Map
                                    </button>
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'coordinates' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        onClick={() => setMode('coordinates')}
                                    >
                                        📝 Enter Coordinates
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 min-h-[400px]">
                                    {mode === 'map' ? (
                                        <FarmMap key={mapVersion} onBoundaryCreated={handleBoundaryCreated} />
                                    ) : (
                                        <div className="p-4">
                                            <CoordinateForm
                                                onCoordinatesSubmit={handleCoordinatesSubmit}
                                                onCancel={() => setShowCreateModal(false)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SatelliteAnalytics;
