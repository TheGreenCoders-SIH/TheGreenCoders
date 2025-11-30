// Visual Soil Analysis Page - Charts and Analytics
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, Loader2 } from 'lucide-react';
import { Radar, Bar } from 'react-chartjs-2';
import SoilHistoryGraph from '../components/SoilHistoryGraph';

export default function SoilAnalysis() {
    const { userProfile } = useAuth();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSoilData();
    }, [userProfile]);

    const loadSoilData = async () => {
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);
            if (farmerSnap.exists()) {
                setCard(farmerSnap.data().card);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const calculateSoilScore = (data) => {
        if (!data) return 0;
        let score = 0;
        if (data.ph >= 6.5 && data.ph <= 7.5) score += 30;
        else if (data.ph >= 6.0 && data.ph <= 8.0) score += 20;
        else score += 10;

        const npkParts = data.npk?.split(':') || [0, 0, 0];
        const avgNPK = (parseInt(npkParts[0]) + parseInt(npkParts[1]) + parseInt(npkParts[2])) / 3;
        if (avgNPK > 150) score += 40;
        else if (avgNPK > 100) score += 30;
        else score += 20;

        if (data.organicCarbon >= 1.5) score += 30;
        else if (data.organicCarbon >= 1.0) score += 20;
        else score += 10;

        return Math.round(score);
    };

    const getSoilHealthColor = (score) => {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    };

    const getPhColor = (ph) => {
        if (ph < 6.5) return '#ff4444';
        if (ph > 7.5) return '#0099ff';
        return '#44ff44';
    };

    const getPhStatus = (ph) => {
        if (ph < 6.5) return 'Acidic';
        if (ph > 7.5) return 'Alkaline';
        return 'Neutral - Ideal';
    };

    const soilScore = card ? calculateSoilScore(card) : 0;

    const radarData = card ? {
        labels: ['pH Balance', 'Nitrogen', 'Phosphorus', 'Potassium', 'Organic Carbon'],
        datasets: [{
            label: 'Soil Health',
            data: [
                (card.ph / 14) * 100,
                Math.min((parseInt(card.npk.split(':')[0]) / 200) * 100, 100),
                Math.min((parseInt(card.npk.split(':')[1]) / 100) * 100, 100),
                Math.min((parseInt(card.npk.split(':')[2]) / 200) * 100, 100),
                Math.min((card.organicCarbon / 3) * 100, 100)
            ],
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2
        }]
    } : null;

    const barData = card ? {
        labels: ['Nitrogen', 'Phosphorus', 'Potassium'],
        datasets: [{
            label: 'NPK Levels (mg/kg)',
            data: card.npk.split(':').map(v => parseInt(v)),
            backgroundColor: ['#3b82f6', '#eab308', '#a855f7']
        }]
    } : null;

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    if (!card) {
        return <div className="text-center p-8">No soil data available</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                    <Sprout className="w-6 h-6 mr-2" />
                    Visual Soil Analysis
                </h1>
                <p className="text-blue-100">Comprehensive soil health metrics and trends</p>
            </div>

            {/* Soil Health Score */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-4">🎯 Overall Soil Health Score</h3>
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="w-full h-full rounded-full flex items-center justify-center"
                            style={{ background: `conic-gradient(from 0deg, #ff4444 0deg 60deg, #ffaa00 60deg 120deg, #44ff44 120deg 240deg, #0088ff 240deg 360deg)` }}>
                            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center flex-col shadow-inner">
                                <div className="text-4xl font-bold" style={{ color: getSoilHealthColor(soilScore) }}>
                                    {soilScore}%
                                </div>
                                <div className="text-sm text-gray-600">Health Score</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* pH Meter */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">🌡️ pH Level: {card.ph}</h4>
                    <div className="w-full h-8 rounded-full relative border-2 border-gray-800"
                        style={{ background: 'linear-gradient(to right, #ff4444, #ffaa00, #44ff44, #0099ff)' }}>
                        <div className="absolute top-[-4px] w-5 h-10 bg-gray-800 rounded"
                            style={{ left: `${((card.ph - 4) / 6) * 100}%`, transform: 'translateX(-50%)' }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span>Acidic (4)</span>
                        <span>Neutral (7)</span>
                        <span>Alkaline (10)</span>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{ backgroundColor: getPhColor(card.ph) + '20', color: getPhColor(card.ph) }}>
                            {getPhStatus(card.ph)}
                        </span>
                    </div>
                </div>

                {/* NPK Bars */}
                <div>
                    <h4 className="font-semibold mb-3">🧪 NPK Nutrient Levels</h4>
                    {card.npk?.split(':').map((value, idx) => {
                        const labels = ['Nitrogen', 'Phosphorus', 'Potassium'];
                        const colors = ['#3b82f6', '#eab308', '#a855f7'];
                        const percentage = Math.min((parseInt(value) / 200) * 100, 100);
                        return (
                            <div key={idx} className="mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">{labels[idx]}</span>
                                    <span className="text-sm font-bold">{value} mg/kg</span>
                                </div>
                                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${colors[idx]}, ${colors[idx]}dd)` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4 text-center">📊 Soil Health Analysis</h4>
                    <div className="h-64">
                        {radarData && <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100 } } }} />}
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border">
                    <h4 className="font-semibold mb-4 text-center">📈 NPK Comparison</h4>
                    <div className="h-64">
                        {barData && <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                    </div>
                </div>
            </div>

            {/* Soil History */}
            <SoilHistoryGraph soilData={card} days={30} />
        </div>
    );
}
