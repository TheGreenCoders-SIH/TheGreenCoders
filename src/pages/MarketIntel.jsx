import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Newspaper, Loader2, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMarketPrices } from '../lib/api';

export default function MarketIntel() {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

    useEffect(() => {
        getMarketPrices().then(data => {
            setMarketData(data);
            setLoading(false);
        });
    }, []);

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

    const news = [
        {
            title: "Wheat Prices Rise Due to Export Demand",
            date: "2 hours ago",
            summary: "International demand for Indian wheat has pushed prices up by 2% this week."
        },
        {
            title: "Monsoon Forecast Positive for Kharif Crops",
            date: "5 hours ago",
            summary: "IMD predicts normal rainfall, benefiting rice and cotton cultivation."
        },
        {
            title: "Government Announces MSP Increase",
            date: "1 day ago",
            summary: "Minimum Support Price for major crops increased by 4-6% for the upcoming season."
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Market Intelligence</h2>
                <p className="text-gray-500">Real-time commodity prices and agricultural news</p>
            </div>

            {/* Market Prices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Today's Mandi Prices</h3>
                    <span className="text-xs text-gray-500">Updated: {new Date().toLocaleTimeString()}</span>
                </div>

                {/* Search and Filter Section */}
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
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
                                className={`px-4 py-3 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap ${sortOrder !== 'none'
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
                        Showing <span className="font-bold text-blue-600">{sortedData.length}</span> of {marketData.length} crops
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : sortedData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedData.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100 hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-gray-800 text-lg">{item.crop}</h4>
                                    {item.change >= 0 ? (
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-900">
                                        ₹{item.price}
                                        <span className="text-sm font-normal text-gray-500">/{item.unit}</span>
                                    </div>
                                    <div className={`text-sm font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.change >= 0 ? '+' : ''}{item.change}% from yesterday
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
            </div>

            {/* Agricultural News */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <Newspaper className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-bold text-gray-800">Agricultural News</h3>
                </div>

                <div className="space-y-4">
                    {news.map((article, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="border-l-4 border-green-500 pl-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-gray-800">{article.title}</h4>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{article.date}</span>
                            </div>
                            <p className="text-sm text-gray-600">{article.summary}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Data Sources */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    <strong>Data Sources:</strong> AgMarkNet, eNAM, and Government Agriculture Portals
                </p>
            </div>
        </div>
    );
}
