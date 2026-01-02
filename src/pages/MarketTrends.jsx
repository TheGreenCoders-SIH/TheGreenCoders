// Market Trends Page
import React, { useState, useEffect } from 'react';
import { getMarketPrices } from '../lib/api';
import { TrendingUp, TrendingDown, Loader2, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketTrends() {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

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

    // Filter market data based on search query and price filter
    const filteredData = marketData.filter(item => {
        const matchesSearch = item.crop.toLowerCase().includes(searchQuery.toLowerCase());

        if (!priceFilter) {
            return matchesSearch;
        }

        const price = parseFloat(item.price);
        const filterPrice = parseFloat(priceFilter);

        // If price filter is a number, show items within ±20% of that price
        if (!isNaN(filterPrice)) {
            const lowerBound = filterPrice * 0.8;
            const upperBound = filterPrice * 1.2;
            return matchesSearch && price >= lowerBound && price <= upperBound;
        }

        return matchesSearch;
    });

    // Sort filtered data by price
    const sortedData = [...filteredData].sort((a, b) => {
        if (sortOrder === 'asc') {
            return parseFloat(a.price) - parseFloat(b.price);
        } else if (sortOrder === 'desc') {
            return parseFloat(b.price) - parseFloat(a.price);
        }
        return 0; // no sorting
    });

    const clearFilters = () => {
        setSearchQuery('');
        setPriceFilter('');
        setSortOrder('none');
    };

    const toggleSort = () => {
        if (sortOrder === 'none') setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder('none');
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

            {/* Search Bar Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Crop Name Search */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Search by Crop Name
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="e.g., Wheat, Rice, Cotton..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Price Filter */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Filter by Price (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                            <input
                                type="number"
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value)}
                                placeholder="Enter target price..."
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        {priceFilter && (
                            <p className="text-xs text-gray-500 mt-1">
                                Showing items within ±20% of ₹{priceFilter}
                            </p>
                        )}
                    </div>

                    {/* Sort Button */}
                    <div className="flex items-end">
                        <button
                            onClick={toggleSort}
                            className={`px-4 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${sortOrder !== 'none'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {sortOrder === 'asc' && <ArrowUp className="w-4 h-4" />}
                            {sortOrder === 'desc' && <ArrowDown className="w-4 h-4" />}
                            {sortOrder === 'none' && <ArrowUpDown className="w-4 h-4" />}
                            {sortOrder === 'asc' ? 'Low to High' : sortOrder === 'desc' ? 'High to Low' : 'Sort Price'}
                        </button>
                    </div>

                    {/* Clear Filters Button */}
                    {(searchQuery || priceFilter || sortOrder !== 'none') && (
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing <span className="font-bold text-blue-600">{filteredData.length}</span> of {marketData.length} crops
                </div>
            </div>

            {/* Market Data Grid */}
            {sortedData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedData.map((item, idx) => (
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
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <Search className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No crops found</h3>
                    <p className="text-gray-500 mb-4">
                        Try adjusting your search criteria or clear filters to see all crops.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

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
