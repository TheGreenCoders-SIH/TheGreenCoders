import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, TrendingUp, MapPin, DollarSign, Target, PieChart as PieChartIcon, Award, Briefcase, Leaf, AlertCircle, ArrowUpRight, HandHeart, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NGODashboard() {
    const [farmers, setFarmers] = useState([]);
    const [statistics, setStatistics] = useState({
        totalFarmers: 0,
        avgSoilHealth: 0,
        farmersNeedingHelp: 0,
        districtCoverage: 0
    });
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();
    const isFarmerView = searchParams.get('view') === 'farmer';

    useEffect(() => {
        if (isFarmerView) {
            setLoading(false);
            return;
        }
        loadNGOData();
    }, [isFarmerView]);

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
                avgSoilHealth: farmerData.length > 0 ? Math.round(totalHealth / farmerData.length) : 0,
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
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // --- Farmer View Component ---
    if (isFarmerView) {
        return (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
                {/* Header */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl bg-teal-800 text-white">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-700 to-emerald-800 opacity-90"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-10 -mt-10 animate-pulse"></div>

                    <div className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-teal-200 font-bold uppercase tracking-wider mb-2">
                                <HandHeart className="w-5 h-5" /> Community Support
                            </div>
                            <h1 className="text-4xl font-extrabold mb-4">Partner Ecosystem</h1>
                            <p className="text-teal-50 text-lg max-w-xl">
                                Access certified NGO partners, government schemes, and financial resources tailored for your farm's growth.
                            </p>
                        </div>
                        <button className="bg-white text-teal-800 px-6 py-3 rounded-xl font-bold hover:bg-teal-50 shadow-lg transition-transform hover:-translate-y-1">
                            Browse All Schemes
                        </button>
                    </div>
                </div>

                {/* Available NGOs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Demo Partner Cards */}
                    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-2xl">
                                <Leaf className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Green Earth Foundation</h3>
                        <p className="text-gray-500 text-sm mb-4">Specialists in organic certification and soil health regeneration projects.</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                                <span>Serving: All Districts</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Target className="w-4 h-4 mr-2 text-green-500" />
                                <span>Focus: Sustainable Inputs</span>
                            </div>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors">
                            Contact Organization
                        </button>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Financial Aid</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Rural Growth Trust</h3>
                        <p className="text-gray-500 text-sm mb-4">Providing low-interest micro-loans and equipment subsidies for small farmers.</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                <span>Serving: North Zone</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Target className="w-4 h-4 mr-2 text-blue-500" />
                                <span>Focus: Equipment & Infra</span>
                            </div>
                        </div>

                        <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                            View Eligibility
                        </button>
                    </motion.div>
                </div>

                {/* Schemes */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-orange-500" /> Active Government Schemes
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between group cursor-pointer hover:bg-orange-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-orange-400">01</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">PM-Kisan Samman Nidhi</h4>
                                    <p className="text-sm text-gray-600">Direct income support of ₹6,000 per year</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-orange-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between group cursor-pointer hover:bg-orange-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-bold text-orange-400">02</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Micro Irrigation Fund</h4>
                                    <p className="text-sm text-gray-600">Subsidy for installing drip/sprinkler systems</p>
                                </div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-orange-400 group-hover:text-orange-600 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- NGO View Component (Redesigned) ---
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Command Header */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-indigo-900 text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-900 opacity-90"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-20 -mb-20"></div>

                <div className="relative z-10 p-10 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-indigo-300 font-bold tracking-wider uppercase mb-2">
                                <Briefcase className="w-5 h-5" /> NGO Operations
                            </div>
                            <h1 className="text-4xl font-extrabold mb-2">Strategic Resource Planner</h1>
                            <p className="text-indigo-100 max-w-xl">
                                Visualize soil health trends, allocate budgets efficiently, and identify high-priority farming clusters.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[150px]">
                            <p className="text-xs text-indigo-200 uppercase font-bold mb-1">Total Impact</p>
                            <p className="text-3xl font-extrabold text-white">{statistics.totalFarmers}</p>
                            <p className="text-xs text-indigo-200">Farmers Reached</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600"><Leaf className="w-6 h-6" /></div>
                        <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full h-fit">Avg</span>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{statistics.avgSoilHealth}%</div>
                    <div className="text-sm text-gray-500 font-medium">Overall Soil Health Score</div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600"><AlertCircle className="w-6 h-6" /></div>
                        <span className="text-xs font-bold bg-red-100 text-red-800 px-3 py-1 rounded-full h-fit">Action</span>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{statistics.farmersNeedingHelp}</div>
                    <div className="text-sm text-gray-500 font-medium">Farmers Need Aid</div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><MapPin className="w-6 h-6" /></div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-1">{statistics.districtCoverage}</div>
                    <div className="text-sm text-gray-500 font-medium">Districts Active</div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><DollarSign className="w-6 h-6" /></div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">₹{(statistics.farmersNeedingHelp * 15 + statistics.totalFarmers * 7).toLocaleString()}k</div>
                    <div className="text-sm text-gray-500 font-medium">Proj. Budget Req.</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Resource Allocation */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-indigo-500" /> Budget Allocation Strategy
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Critical Intervention (Soil &lt; 60%)</span>
                                <span className="text-gray-900 font-bold">₹{(statistics.farmersNeedingHelp * 15000).toLocaleString()}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(statistics.farmersNeedingHelp / statistics.totalFarmers) * 100}%` }}
                                    className="h-full bg-red-500 rounded-full"
                                ></motion.div>
                            </div>
                            <p className="text-xs text-gray-500">Immediate soil amendments and fertilizer subsidies required.</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-yellow-700 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Capacity Building</span>
                                <span className="text-gray-900 font-bold">₹{(statistics.totalFarmers * 2000).toLocaleString()}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "60%" }}
                                    className="h-full bg-yellow-500 rounded-full"
                                ></motion.div>
                            </div>
                            <p className="text-xs text-gray-500">Workshops, digital literacy training, and awareness campaigns.</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-green-700 flex items-center gap-1"><Leaf className="w-3 h-3" /> Sustainable Tech Adoption</span>
                                <span className="text-gray-900 font-bold">₹{(statistics.totalFarmers * 5000).toLocaleString()}</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "40%" }}
                                    className="h-full bg-green-500 rounded-full"
                                ></motion.div>
                            </div>
                            <p className="text-xs text-gray-500">Subsidies for IoT sensors and automated irrigation tools.</p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-indigo-50 rounded-2xl flex items-center justify-between border border-indigo-100">
                        <div>
                            <p className="text-indigo-900 font-bold text-lg">Total Fund Requirement</p>
                            <p className="text-indigo-600 text-sm">For Q1 2026 Fiscal Year</p>
                        </div>
                        <div className="text-3xl font-extrabold text-indigo-700">
                            ₹{((statistics.farmersNeedingHelp * 15000) + (statistics.totalFarmers * 7000)).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Priority List */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" /> High Priority Regions
                    </h2>
                    <div className="space-y-4">
                        {farmers.filter(f => f.healthScore < 60).slice(0, 5).map((farmer, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                                    {farmer.healthScore}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{farmer.farmerName}</h4>
                                    <p className="text-xs text-gray-500">{farmer.village}, {farmer.district}</p>
                                </div>
                                <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold text-gray-700 hover:text-indigo-600 hover:border-indigo-200">
                                    View
                                </button>
                            </div>
                        ))}
                        {farmers.filter(f => f.healthScore < 60).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Check className="w-12 h-12 mx-auto text-green-300 mb-2" />
                                <p>All farmers are in good standing!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
