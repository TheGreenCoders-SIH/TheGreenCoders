// Soil History Graph Component - Time-series visualization
import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SoilHistoryGraph({ soilData, days = 30 }) {
    // Generate historical soil data
    const generateHistoricalData = () => {
        const history = [];
        const now = new Date();

        // Parse current NPK
        const [currentN, currentP, currentK] = soilData.npk.split(':').map(v => parseInt(v));

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Add some variation to simulate real data
            const variation = (Math.random() - 0.5) * 20;

            history.push({
                date: date.toISOString().split('T')[0],
                ph: Math.max(4, Math.min(9, soilData.ph + (Math.random() - 0.5) * 0.5)),
                nitrogen: Math.max(0, currentN + variation),
                phosphorus: Math.max(0, currentP + variation * 0.8),
                potassium: Math.max(0, currentK + variation * 0.9),
                organicCarbon: Math.max(0, soilData.organicCarbon + (Math.random() - 0.5) * 0.2)
            });
        }

        return history;
    };

    const history = generateHistoricalData();

    // Chart data
    const chartData = {
        labels: history.map(h => {
            const date = new Date(h.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'pH Level',
                data: history.map(h => h.ph),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Organic Carbon (%)',
                data: history.map(h => h.organicCarbon),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };

    const npkChartData = {
        labels: history.map(h => {
            const date = new Date(h.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Nitrogen (N)',
                data: history.map(h => h.nitrogen),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            },
            {
                label: 'Phosphorus (P)',
                data: history.map(h => h.phosphorus),
                borderColor: 'rgb(251, 191, 36)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                tension: 0.4
            },
            {
                label: 'Potassium (K)',
                data: history.map(h => h.potassium),
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y.toFixed(2);
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'pH Level'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Organic Carbon (%)'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        }
    };

    const npkOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'NPK Levels (mg/kg)'
                }
            }
        }
    };

    // Calculate trends
    const calculateTrend = (data) => {
        if (data.length < 2) return 0;
        const recent = data.slice(-7).reduce((a, b) => a + b, 0) / 7;
        const older = data.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
        return ((recent - older) / older) * 100;
    };

    const phTrend = calculateTrend(history.map(h => h.ph));
    const nTrend = calculateTrend(history.map(h => h.nitrogen));
    const pTrend = calculateTrend(history.map(h => h.phosphorus));
    const kTrend = calculateTrend(history.map(h => h.potassium));

    const TrendIndicator = ({ value, label }) => (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{label}:</span>
            <div className={`flex items-center text-sm font-semibold ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                <TrendingUp className={`w-4 h-4 mr-1 ${value < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(value).toFixed(1)}%
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Calendar className="w-6 h-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-bold text-gray-800">Soil Health History ({days} Days)</h3>
                    </div>
                </div>

                {/* Trend Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                        <TrendIndicator value={phTrend} label="pH" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-4 bg-green-50 rounded-lg border border-green-200"
                    >
                        <TrendIndicator value={nTrend} label="Nitrogen" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                        <TrendIndicator value={pTrend} label="Phosphorus" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                    >
                        <TrendIndicator value={kTrend} label="Potassium" />
                    </motion.div>
                </div>

                {/* pH and Organic Carbon Chart */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">pH & Organic Carbon Trends</h4>
                    <div className="h-64">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* NPK Chart */}
                <div>
                    <h4 className="font-semibold text-gray-700 mb-3">NPK Nutrient Trends</h4>
                    <div className="h-64">
                        <Line data={npkChartData} options={npkOptions} />
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Trend Analysis</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                        {phTrend > 2 && <li>• pH is increasing. Monitor for alkalinity.</li>}
                        {phTrend < -2 && <li>• pH is decreasing. Consider lime application.</li>}
                        {nTrend < -5 && <li>• Nitrogen levels declining. Apply nitrogen fertilizer.</li>}
                        {pTrend < -5 && <li>• Phosphorus levels declining. Consider DAP application.</li>}
                        {kTrend < -5 && <li>• Potassium levels declining. Apply MOP or potash.</li>}
                        {Math.abs(phTrend) < 2 && Math.abs(nTrend) < 5 && Math.abs(pTrend) < 5 && Math.abs(kTrend) < 5 && (
                            <li>• Soil parameters are stable. Continue current practices.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
