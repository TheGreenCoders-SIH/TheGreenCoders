// Farmer Profile Management Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Edit2, Wifi, Save, Loader2, Sprout, Phone, MapPin, Thermometer, Droplets, CloudRain, Wind, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmerProfile() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);

    // Separate edit states
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [editingSoil, setEditingSoil] = useState(false);

    const [saving, setSaving] = useState(false);
    const [dataSource, setDataSource] = useState('manual'); // 'manual' or 'iot'

    // Separate form data states
    const [personalData, setPersonalData] = useState({});
    const [soilData, setSoilData] = useState({});

    useEffect(() => {
        loadProfile();
    }, [userProfile]);

    const loadProfile = async () => {
        try {
            if (!userProfile?.farmerId) return;

            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const farmerSnap = await getDoc(farmerRef);

            if (farmerSnap.exists()) {
                const data = farmerSnap.data().card || {};
                setCard(data);

                // Initialize form data
                setPersonalData({
                    farmerName: data.farmerName || '',
                    village: data.village || '',
                    state: data.state || '',
                    farmSize: data.farmSize || '',
                    phone: data.phone || '' // New field
                });

                setSoilData({
                    ph: data.ph || '',
                    organicCarbon: data.organicCarbon || '',
                    nitrogen: data.N || data.npk?.split(':')[0] || '',
                    phosphorus: data.P || data.npk?.split(':')[1] || '',
                    potassium: data.K || data.npk?.split(':')[2] || '',
                    temperature: data.temperature || '',
                    humidity: data.humidity || '',
                    rainfall: data.rainfall || ''
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading profile:', error);
            setLoading(false);
        }
    };

    const fetchIoTData = async () => {
        setDataSource('iot');
        // Simulate IoT data fetch
        const iotData = {
            ph: (Math.random() * (8 - 6) + 6).toFixed(1),
            organicCarbon: (Math.random() * (2 - 0.5) + 0.5).toFixed(2),
            nitrogen: Math.floor(100 + Math.random() * 100).toString(),
            phosphorus: Math.floor(20 + Math.random() * 40).toString(),
            potassium: Math.floor(30 + Math.random() * 50).toString(),
            temperature: (25 + Math.random() * 10).toFixed(1),
            humidity: Math.floor(40 + Math.random() * 40).toString(),
            rainfall: Math.floor(500 + Math.random() * 1000).toString()
        };

        setSoilData(prev => ({ ...prev, ...iotData }));
        alert('✅ IoT sensor data updated!');
    };

    const handleSavePersonal = async () => {
        setSaving(true);
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);
            const updatedCard = { ...card, ...personalData };

            await updateDoc(farmerRef, {
                card: updatedCard,
                updatedAt: new Date().toISOString()
            });

            setCard(updatedCard);
            setEditingPersonal(false);
            alert('✅ Personal details updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Failed to update profile');
        }
        setSaving(false);
    };

    const handleSaveSoil = async () => {
        setSaving(true);
        try {
            const farmerRef = doc(db, 'farmers', userProfile.farmerId);

            // Construct NPK string for compatibility
            const npkString = `${soilData.nitrogen}:${soilData.phosphorus}:${soilData.potassium}`;

            const updatedCard = {
                ...card,
                ...soilData,
                npk: npkString,
                N: parseFloat(soilData.nitrogen),
                P: parseFloat(soilData.phosphorus),
                K: parseFloat(soilData.potassium)
            };

            await updateDoc(farmerRef, {
                card: updatedCard,
                updatedAt: new Date().toISOString()
            });

            setCard(updatedCard);
            setEditingSoil(false);
            alert('✅ Soil data updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('❌ Failed to update profile');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!card) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 mb-4">You don't have a soil health card yet.</p>
                    <button
                        onClick={() => navigate('/new-card')}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                        Create Your Card
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-2xl p-8 shadow-lg">
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                    <User className="w-8 h-8 mr-3" />
                    Farmer Profile
                </h1>
                <p className="text-green-100 text-lg">Manage your personal details and farm soil data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: Edit Farmer Profile */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <User className="w-5 h-5 mr-2 text-blue-600" />
                            Personal Details
                        </h2>
                        {!editingPersonal ? (
                            <button
                                onClick={() => setEditingPersonal(true)}
                                className="text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setEditingPersonal(false)}
                                    className="text-gray-600 hover:text-gray-800 text-sm px-3 py-1.5 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePersonal}
                                    disabled={saving}
                                    className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-3 py-1.5 rounded-lg flex items-center shadow-sm"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Farmer Name</label>
                            {editingPersonal ? (
                                <input
                                    type="text"
                                    value={personalData.farmerName}
                                    onChange={(e) => setPersonalData({ ...personalData, farmerName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-gray-800 font-medium text-lg">{card.farmerName}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Village</label>
                                {editingPersonal ? (
                                    <input
                                        type="text"
                                        value={personalData.village}
                                        onChange={(e) => setPersonalData({ ...personalData, village: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-800 flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {card.village}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                                {editingPersonal ? (
                                    <input
                                        type="text"
                                        value={personalData.state}
                                        onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-800">{card.state}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Farm Size (Acres)</label>
                                {editingPersonal ? (
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={personalData.farmSize}
                                        onChange={(e) => setPersonalData({ ...personalData, farmSize: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-800">{card.farmSize}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                {editingPersonal ? (
                                    <input
                                        type="tel"
                                        value={personalData.phone}
                                        onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                                        placeholder="+91..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-800 flex items-center">
                                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                        {card.phone || <span className="text-gray-400 italic">Not added</span>}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section 2: Edit Soil Data */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Sprout className="w-5 h-5 mr-2 text-green-600" />
                            Soil & Weather Data
                        </h2>
                        {!editingSoil ? (
                            <button
                                onClick={() => setEditingSoil(true)}
                                className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={fetchIoTData}
                                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm px-3 py-1.5 rounded-lg flex items-center"
                                    title="Fetch from IoT Sensor"
                                >
                                    <Wifi className="w-3 h-3 mr-1" /> IoT
                                </button>
                                <button
                                    onClick={() => setEditingSoil(false)}
                                    className="text-gray-600 hover:text-gray-800 text-sm px-3 py-1.5 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSoil}
                                    disabled={saving}
                                    className="bg-green-600 text-white hover:bg-green-700 text-sm px-3 py-1.5 rounded-lg flex items-center shadow-sm"
                                >
                                    {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Nutrients */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <Activity className="w-4 h-4 mr-1" /> Nutrients (mg/kg)
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Nitrogen (N)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            value={soilData.nitrogen}
                                            onChange={(e) => setSoilData({ ...soilData, nitrogen: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800">{card.N || card.npk?.split(':')[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Phosphorus (P)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            value={soilData.phosphorus}
                                            onChange={(e) => setSoilData({ ...soilData, phosphorus: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800">{card.P || card.npk?.split(':')[1]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Potassium (K)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            value={soilData.potassium}
                                            onChange={(e) => setSoilData({ ...soilData, potassium: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800">{card.K || card.npk?.split(':')[2]}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Soil Properties */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <Droplets className="w-4 h-4 mr-1" /> Properties
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">pH Level</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={soilData.ph}
                                            onChange={(e) => setSoilData({ ...soilData, ph: parseFloat(e.target.value) })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800">{card.ph}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Organic Carbon (%)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={soilData.organicCarbon}
                                            onChange={(e) => setSoilData({ ...soilData, organicCarbon: parseFloat(e.target.value) })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800">{card.organicCarbon}%</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Weather */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center">
                                <CloudRain className="w-4 h-4 mr-1" /> Weather
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Temp (°C)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={soilData.temperature}
                                            onChange={(e) => setSoilData({ ...soilData, temperature: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800 flex items-center">
                                            <Thermometer className="w-3 h-3 mr-1 text-red-400" /> {card.temperature || '-'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Humidity (%)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            value={soilData.humidity}
                                            onChange={(e) => setSoilData({ ...soilData, humidity: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800 flex items-center">
                                            <Wind className="w-3 h-3 mr-1 text-blue-400" /> {card.humidity || '-'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Rainfall (mm)</label>
                                    {editingSoil ? (
                                        <input
                                            type="number"
                                            value={soilData.rainfall}
                                            onChange={(e) => setSoilData({ ...soilData, rainfall: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-800 flex items-center">
                                            <CloudRain className="w-3 h-3 mr-1 text-blue-600" /> {card.rainfall || '-'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
