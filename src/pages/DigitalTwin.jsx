// Digital Twin - What-If Simulation Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, RefreshCw, TrendingUp, DollarSign, Sprout, Droplets } from 'lucide-react';
import { calculateYieldPrediction, calculateCostAnalysis, calculateProfitAnalysis, generateRecommendations } from '../lib/simulationEngine';
import { motion } from 'framer-motion';

export default function DigitalTwin() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [card, setCard] = useState(null);

    // Current scenario (from actual farm data)
    const [currentScenario, setCurrentScenario] = useState(null);

    // Simulated scenario (user-modified)
    const [simulatedScenario, setSimulatedScenario] = useState(null);

    // Results
    const [currentResults, setCurrentResults] = useState(null);
    const [simulatedResults, setSimulatedResults] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        if (userProfile) {
            loadFarmData();
        }
    }, [userProfile]);

    const loadFarmData = async () => {
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const cardData = farmerSnap.data().card;
                setCard(cardData);

                // Initialize current scenario from farm data
                const scenario = {
                    cropType: 'Rice',
                    soilNPK: cardData.npk || '120:60:80',
                    irrigation: 'adequate',
                    fertilizer: 'moderate',
                    organicCarbon: parseFloat(cardData.organicCarbon) || 0.75,
                    ph: parseFloat(cardData.ph) || 7.0,
                    farmSize: parseFloat(cardData.farmSize) || 2.5,
                    weather: {
                        temp: 28,
                        humidity: 70
                    }
                };

                setCurrentScenario(scenario);
                setSimulatedScenario({ ...scenario });

                // Calculate initial results
                const currentYield = calculateYieldPrediction(scenario);
                const currentCost = calculateCostAnalysis(scenario);
                const currentProfit = calculateProfitAnalysis(scenario);

                setCurrentResults({
                    yield: currentYield,
                    cost: currentCost,
                    profit: currentProfit
                });

                setSimulatedResults({
                    yield: currentYield,
                    cost: currentCost,
                    profit: currentProfit
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading farm data:', error);
            setLoading(false);
        }
    };

    const handleScenarioChange = (field, value) => {
        const updated = { ...simulatedScenario, [field]: value };
        setSimulatedScenario(updated);

        // Recalculate results
        const yieldData = calculateYieldPrediction(updated);
        const costData = calculateCostAnalysis(updated);
        const profitData = calculateProfitAnalysis(updated);

        setSimulatedResults({
            yield: yieldData,
            cost: costData,
            profit: profitData
        });

        // Generate recommendations
        const recs = generateRecommendations(currentScenario, updated);
        setRecommendations(recs);
    };

    const resetSimulation = () => {
        setSimulatedScenario({ ...currentScenario });
        setSimulatedResults({ ...currentResults });
        setRecommendations([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">Please create your soil health card first to use Digital Twin simulation.</p>
                </div>
            </div>
        );
    }

    const yieldImprovement = ((simulatedResults.yield.totalYield - currentResults.yield.totalYield) / currentResults.yield.totalYield * 100);
    const profitImprovement = ((simulatedResults.profit.profit - currentResults.profit.profit) / Math.abs(currentResults.profit.profit) * 100);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1">🔮 Digital Twin Simulation</h1>
                <p className="text-blue-100">Predict outcomes of different farming scenarios</p>
            </div>

            {/* Scenario Builder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">What-If Scenario Builder</h2>
                    <button
                        onClick={resetSimulation}
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Crop Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Sprout className="w-4 h-4 inline mr-1" />
                            Crop Type
                        </label>
                        <select
                            value={simulatedScenario.cropType}
                            onChange={(e) => handleScenarioChange('cropType', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Rice">Rice</option>
                            <option value="Wheat">Wheat</option>
                            <option value="Maize">Maize</option>
                            <option value="Cotton">Cotton</option>
                            <option value="Soybean">Soybean</option>
                            <option value="Sugarcane">Sugarcane</option>
                            <option value="Potato">Potato</option>
                            <option value="Tomato">Tomato</option>
                            <option value="Onion">Onion</option>
                        </select>
                    </div>

                    {/* NPK Ratio */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            NPK Ratio (N:P:K)
                        </label>
                        <input
                            type="text"
                            value={simulatedScenario.soilNPK}
                            onChange={(e) => handleScenarioChange('soilNPK', e.target.value)}
                            placeholder="120:60:80"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Irrigation */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Droplets className="w-4 h-4 inline mr-1" />
                            Irrigation Level
                        </label>
                        <select
                            value={simulatedScenario.irrigation}
                            onChange={(e) => handleScenarioChange('irrigation', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="insufficient">Insufficient</option>
                            <option value="adequate">Adequate</option>
                            <option value="optimal">Optimal</option>
                            <option value="excessive">Excessive</option>
                        </select>
                    </div>

                    {/* Fertilizer */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Fertilizer Application
                        </label>
                        <select
                            value={simulatedScenario.fertilizer}
                            onChange={(e) => handleScenarioChange('fertilizer', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="recommended">Recommended</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* pH Level */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            pH Level: {simulatedScenario.ph}
                        </label>
                        <input
                            type="range"
                            min="4"
                            max="10"
                            step="0.1"
                            value={simulatedScenario.ph}
                            onChange={(e) => handleScenarioChange('ph', parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Acidic (4)</span>
                            <span>Neutral (7)</span>
                            <span>Alkaline (10)</span>
                        </div>
                    </div>

                    {/* Organic Carbon */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Organic Carbon: {simulatedScenario.organicCarbon}%
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.05"
                            value={simulatedScenario.organicCarbon}
                            onChange={(e) => handleScenarioChange('organicCarbon', parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Low (0.1%)</span>
                            <span>Good (0.75%)</span>
                            <span>Excellent (2%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current State */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm border-2 border-gray-300 p-6"
                >
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Current State</h3>

                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-green-700">Expected Yield</span>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-green-800">
                                {currentResults.yield.totalYield} quintals
                            </div>
                            <div className="text-sm text-green-600 mt-1">
                                {currentResults.yield.yieldPerAcre} quintals/acre
                            </div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-red-700">Total Cost</span>
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-bold text-red-800">
                                ₹{currentResults.cost.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-red-600 mt-2 space-y-1">
                                <div>Fertilizer: ₹{currentResults.cost.fertilizer.toLocaleString()}</div>
                                <div>Irrigation: ₹{currentResults.cost.irrigation.toLocaleString()}</div>
                                <div>Seeds: ₹{currentResults.cost.seeds.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-700">Expected Profit</span>
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-blue-800">
                                ₹{currentResults.profit.profit.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                                ROI: {currentResults.profit.roi}%
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Simulated State */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border-2 border-blue-400 p-6"
                >
                    <h3 className="text-lg font-bold text-blue-800 mb-4">🔮 Simulated Outcome</h3>

                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-green-700">Predicted Yield</span>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-green-800">
                                {simulatedResults.yield.totalYield} quintals
                            </div>
                            <div className="text-sm text-green-600 mt-1">
                                {simulatedResults.yield.yieldPerAcre} quintals/acre
                            </div>
                            {yieldImprovement !== 0 && (
                                <div className={`text-xs font-semibold mt-2 ${yieldImprovement > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {yieldImprovement > 0 ? '↑' : '↓'} {Math.abs(yieldImprovement).toFixed(1)}% vs current
                                </div>
                            )}
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-red-700">Estimated Cost</span>
                                <DollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-bold text-red-800">
                                ₹{simulatedResults.cost.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-red-600 mt-2 space-y-1">
                                <div>Fertilizer: ₹{simulatedResults.cost.fertilizer.toLocaleString()}</div>
                                <div>Irrigation: ₹{simulatedResults.cost.irrigation.toLocaleString()}</div>
                                <div>Seeds: ₹{simulatedResults.cost.seeds.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-blue-700">Estimated Profit</span>
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-blue-800">
                                ₹{simulatedResults.profit.profit.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                                ROI: {simulatedResults.profit.roi}%
                            </div>
                            {profitImprovement !== 0 && !isNaN(profitImprovement) && (
                                <div className={`text-xs font-semibold mt-2 ${profitImprovement > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {profitImprovement > 0 ? '↑' : '↓'} {Math.abs(profitImprovement).toFixed(1)}% vs current
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">💡 AI Recommendations</h3>
                    <div className="space-y-3">
                        {recommendations.map((rec, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-4 rounded-lg border-l-4 ${rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                                        rec.priority === 'medium' ? 'bg-blue-50 border-blue-500' :
                                            'bg-green-50 border-green-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className={`text-xs font-bold uppercase mb-1 ${rec.priority === 'high' ? 'text-orange-700' :
                                                rec.priority === 'medium' ? 'text-blue-700' :
                                                    'text-green-700'
                                            }`}>
                                            {rec.type} • {rec.priority} priority
                                        </div>
                                        <p className="text-sm text-gray-800 font-medium mb-1">{rec.message}</p>
                                        <p className="text-xs text-gray-600">{rec.action}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
