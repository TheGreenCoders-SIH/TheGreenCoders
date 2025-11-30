// Market Trends Page
import React, { useState, useEffect } from 'react';
import { getMarketPrices } from '../lib/api';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketTrends() {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarketData();
    }, []);

    const loadMarketData = async () => {
        try {
            const data = await getMarketPrices();
            setMarketData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1 flex items-center">
                    <TrendingUp className="w-7 h-7 mr-2" />
                    Market Trends & Prices
                </h1>
                <p className="text-blue-100">Real-time commodity prices and market insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketData.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{item.crop}</h3>
                            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${item.change >= 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                {item.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {item.change}%
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-500">Current Price</div>
                                <div className="text-3xl font-bold text-gray-900">
                                    ₹{item.price}
                                    <span className="text-sm text-gray-500 font-normal">/{item.unit}</span>
                                </div>
                            </div>

                            {item.forecast && (
                                <div className="border-t pt-3">
                                    <div className="text-sm text-gray-500 mb-1">7-Day Forecast</div>
                                    <div className={`text-sm font-semibold ${item.forecast.includes('rise') ? 'text-green-700' : 'text-orange-700'
                                        }`}>
                                        {item.forecast}
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-3">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Demand:</span>
                                    <span className="font-semibold">{item.demand || 'High'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                    <span>Quality Grade:</span>
                                    <span className="font-semibold">{item.grade || 'A+'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-bold text-yellow-900 mb-2">💡 Market Tip</h3>
                <p className="text-sm text-yellow-800">
                    Prices shown are indicative rates from local mandis. Actual prices may vary based on quality, quantity, and location.
                    Always verify current rates with your local Agricultural Produce Market Committee (APMC) before making sales decisions.
                </p>
            </div>
        </div>
    );
}
