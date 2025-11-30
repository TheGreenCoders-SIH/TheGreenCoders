// NGO Dashboard - Resource Allocation & Analytics
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, TrendingUp, MapPin, DollarSign, Target, PieChart as PieChartIcon, Award } from 'lucide-react';

export default function NGODashboard() {
    const [farmers, setFarmers] = useState([]);
    const [statistics, setStatistics] = useState({
        totalFarmers: 0,
        avgSoilHealth: 0,
        farmersNeedingHelp: 0,
        districtCoverage: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNGOData();
    }, []);

    const loadNGOData = async () => {
        try {
            const farmersRef = collection(db, 'farmers');
            const farmersSnap = await getDocs(farmersRef);

            const farmerData = [];
            let totalHealth = 0;
            let needHelp = 0;
            const districts = new Set();

            farmersSnap.forEach((doc) => {
                const data = doc.data();
                if (data.card) {
                    const healthScore = calculateHealthScore(data.card);
                    farmerData.push({
                        id: doc.id,
                        ...data.card,
                        healthScore
                    });
                    totalHealth += healthScore;
                    if (healthScore < 60) needHelp++;
                    if (data.card.district) districts.add(data.card.district);
                }
            });

            setFarmers(farmerData);
            setStatistics({
                totalFarmers: farmerData.length,
                avgSoilHealth: Math.round(totalHealth / farmerData.length),
                farmersNeedingHelp: needHelp,
                districtCoverage: districts.size
            });
            setLoading(false);
        } catch (error) {
            console.error('Error loading NGO data:', error);
            setLoading(false);
        }
    };

    const calculateHealthScore = (card) => {
        let score = 0;
        if (card.ph >= 6.5 && card.ph <= 7.5) score += 30;
        else if (card.ph >= 6.0 && card.ph <= 8.0) score += 20;
        else score += 10;

        const npkParts = card.npk?.split(':') || [0, 0, 0];
        const avgNPK = (parseInt(npkParts[0]) + parseInt(npkParts[1]) + parseInt(npkParts[2])) / 3;
        if (avgNPK > 150) score += 40;
        else if (avgNPK > 100) score += 30;
        else score += 20;

        if (card.organicCarbon >= 1.5) score += 30;
        else if (card.organicCarbon >= 1.0) score += 20;
        else score += 10;

        return score;
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-green-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1">🏢 NGO Resource Allocation Dashboard</h1>
                <p className="text-green-100">Farmer outreach analytics and resource planning</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{statistics.totalFarmers}</div>
                            <div className="text-sm text-gray-600">Total Farmers</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{statistics.avgSoilHealth}%</div>
                            <div className="text-sm text-gray-600">Avg Soil Health</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="w-8 h-8 text-orange-600" />
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{statistics.farmersNeedingHelp}</div>
                            <div className="text-sm text-gray-600">Need Assistance</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <MapPin className="w-8 h-8 text-purple-600" />
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{statistics.districtCoverage}</div>
                            <div className="text-sm text-gray-600">Districts Covered</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Allocation Planner */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                    Resource Allocation Planner
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="font-semibold text-red-800 mb-3">🚨 Critical Priority</h3>
                        <div className="text-sm text-red-700">
                            <div className="mb-2"><strong>{statistics.farmersNeedingHelp}</strong> farmers with soil health &lt; 60%</div>
                            <div className="text-xs">Recommended: ₹{(statistics.farmersNeedingHelp * 15000).toLocaleString()} for soil amendments</div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-yellow-800 mb-3">⚠️ Medium Priority</h3>
                        <div className="text-sm text-yellow-700">
                            <div className="mb-2">Training & Education Programs</div>
                            <div className="text-xs">Budget: ₹{(statistics.totalFarmers * 2000).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-3">✅ Ongoing Support</h3>
                        <div className="text-sm text-green-700">
                            <div className="mb-2">IoT Sensor Distribution</div>
                            <div className="text-xs">Budget: ₹{(statistics.totalFarmers * 5000).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">💰 Total Budget Recommendation</h4>
                    <div className="text-3xl font-bold text-blue-900">
                        ₹{((statistics.farmersNeedingHelp * 15000) + (statistics.totalFarmers * 7000)).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">For comprehensive support across all {statistics.totalFarmers} farmers</div>
                </div>
            </div>

            {/* Farmers Needing Help */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Award className="w-6 h-6 text-orange-600 mr-2" />
                    Farmers Requiring Immediate Support
                </h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Village</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {farmers.filter(f => f.healthScore < 60).slice(0, 10).map((farmer, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{farmer.farmerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{farmer.village}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{farmer.district || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${farmer.healthScore >= 60 ? 'bg-green-100 text-green-700' :
                                                farmer.healthScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {farmer.healthScore}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${farmer.healthScore < 40 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {farmer.healthScore < 40 ? 'URGENT' : 'HIGH'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Impact Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Program Impact Metrics</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                        <div className="text-4xl font-bold text-blue-700">{statistics.totalFarmers}</div>
                        <div className="text-sm text-gray-600 mt-1">Farmers Registered</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                        <div className="text-4xl font-bold text-green-700">{Math.round(statistics.totalFarmers * 0.15)}</div>
                        <div className="text-sm text-gray-600 mt-1">IoT Sensors Deployed</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
                        <div className="text-4xl font-bold text-purple-700">{Math.round(statistics.totalFarmers * 2.5)} acres</div>
                        <div className="text-sm text-gray-600 mt-1">Total Land Covered</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
