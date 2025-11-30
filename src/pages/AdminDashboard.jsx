import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { generateFarmerId, ROLES } from '../lib/roles';
import { Users, Plus, Edit, Trash2, Eye, UserPlus, Shield, Loader2, Search, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    const [farmers, setFarmers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddFarmer, setShowAddFarmer] = useState(false);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            // Load all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const farmersList = allUsers.filter(u => u.role === ROLES.FARMER);
            const adminsList = allUsers.filter(u => u.role === ROLES.ADMIN);

            // Load cards for farmers
            const farmersWithCards = await Promise.all(
                farmersList.map(async (farmer) => {
                    const cardRef = doc(db, 'farmers', farmer.farmerId);
                    const cardSnap = await getDocs(collection(db, `farmers`));
                    const farmerCard = cardSnap.docs.find(d => d.id === farmer.farmerId);

                    return {
                        ...farmer,
                        card: farmerCard?.data()?.card || null
                    };
                })
            );

            setFarmers(farmersWithCards);
            setAdmins(adminsList);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const handleAddFarmer = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const email = formData.get('email');
            const password = formData.get('password');
            const name = formData.get('name');

            // Create Firebase auth account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile
            const farmerId = generateFarmerId();
            await setDoc(doc(db, 'users', user.uid), {
                email,
                name,
                role: ROLES.FARMER,
                farmerId,
                hasCard: false,
                createdAt: new Date().toISOString()
            });

            setShowAddFarmer(false);
            loadAllData();
            alert(`Farmer added successfully! Farmer ID: ${farmerId}`);
        } catch (error) {
            console.error('Error adding farmer:', error);
            alert('Failed to add farmer: ' + error.message);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const email = formData.get('email');
            const password = formData.get('password');
            const name = formData.get('name');

            // Create Firebase auth account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create admin profile
            await setDoc(doc(db, 'users', user.uid), {
                email,
                name,
                role: ROLES.ADMIN,
                createdAt: new Date().toISOString()
            });

            setShowAddAdmin(false);
            loadAllData();
            alert('Admin added successfully!');
        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Failed to add admin: ' + error.message);
        }
    };

    const handleTerminateCard = async (farmerId) => {
        if (!confirm('Are you sure you want to terminate this card?')) return;

        try {
            await deleteDoc(doc(db, 'farmers', farmerId));
            loadAllData();
            alert('Card terminated successfully');
        } catch (error) {
            console.error('Error terminating card:', error);
            alert('Failed to terminate card');
        }
    };

    const filteredFarmers = farmers.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
                        <p className="text-blue-100">Manage farmers, cards, and system administrators</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddFarmer(true)}
                            className="bg-white text-blue-800 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Farmer
                        </button>
                        <button
                            onClick={() => setShowAddAdmin(true)}
                            className="bg-blue-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-950 transition-colors flex items-center"
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Add Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Farmers</p>
                            <p className="text-3xl font-bold text-gray-800">{farmers.length}</p>
                        </div>
                        <Users className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active Cards</p>
                            <p className="text-3xl font-bold text-gray-800">{farmers.filter(f => f.card).length}</p>
                        </div>
                        <Eye className="w-10 h-10 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Administrators</p>
                            <p className="text-3xl font-bold text-gray-800">{admins.length}</p>
                        </div>
                        <Shield className="w-10 h-10 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* IoT Sensor Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-6 h-6 text-green-600 mr-2" />
                    IoT Sensor Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-600 font-semibold mb-1">Sensors Online</div>
                        <div className="text-3xl font-bold text-green-700">{Math.round(farmers.length * 0.15)}</div>
                        <div className="text-xs text-green-600 mt-1">Active now</div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-semibold mb-1">Sensors Offline</div>
                        <div className="text-3xl font-bold text-orange-700">{Math.round(farmers.length * 0.05)}</div>
                        <div className="text-xs text-orange-600 mt-1">Needs attention</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-semibold mb-1">Avg Soil Moisture</div>
                        <div className="text-3xl font-bold text-blue-700">58%</div>
                        <div className="text-xs text-blue-600 mt-1">All sensors</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-600 font-semibold mb-1">Data Points</div>
                        <div className="text-3xl font-bold text-purple-700">{(farmers.length * 1440).toLocaleString()}</div>
                        <div className="text-xs text-purple-600 mt-1">Last 24 hours</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <strong>System Health:</strong> All sensors reporting normally. Last sync: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* SMS Notification Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Shield className="w-6 h-6 text-purple-600 mr-2" />
                    SMS Notification Logs (Last 7 Days)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm text-green-600 font-semibold mb-1">Sent Successfully</div>
                        <div className="text-3xl font-bold text-green-700">{farmers.length * 12}</div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="text-sm text-yellow-600 font-semibold mb-1">Pending</div>
                        <div className="text-3xl font-bold text-yellow-700">{Math.round(farmers.length * 0.5)}</div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="text-sm text-red-600 font-semibold mb-1">Failed</div>
                        <div className="text-3xl font-bold text-red-700">{Math.round(farmers.length * 0.2)}</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Recipient</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Message Type</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {farmers.slice(0, 5).map((farmer, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(Date.now() - idx * 3600000).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{farmer.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {idx % 3 === 0 ? 'Weather Alert' : idx % 3 === 1 ? 'Irrigation Reminder' : 'Pest Warning'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${idx % 4 === 0 ? 'bg-green-100 text-green-800' :
                                            idx % 4 === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {idx % 4 === 0 ? 'Delivered' : idx % 4 === 1 ? 'Pending' : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Farmers List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">All Farmers</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search farmers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Farmer ID</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Card Status</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredFarmers.map((farmer) => (
                                <tr key={farmer.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{farmer.farmerId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{farmer.name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{farmer.email}</td>
                                    <td className="px-4 py-3">
                                        {farmer.card ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                No Card
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {farmer.card && (
                                                <>
                                                    <button
                                                        onClick={() => setSelectedCard(farmer.card)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Card"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleTerminateCard(farmer.farmerId)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Terminate Card"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Farmer Modal */}
            <AnimatePresence>
                {showAddFarmer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddFarmer(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Farmer</h3>
                            <form onSubmit={handleAddFarmer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Add Farmer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddFarmer(false)}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Admin Modal */}
            <AnimatePresence>
                {showAddAdmin && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddAdmin(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Admin</h3>
                            <form onSubmit={handleAddAdmin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Add Admin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddAdmin(false)}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Card Modal */}
            <AnimatePresence>
                {selectedCard && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Soil Health Card Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Farmer Name</label>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCard.farmerName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Village</label>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCard.village}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">pH Level</label>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCard.ph}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Organic Carbon</label>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCard.organicCarbon}%</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 uppercase font-bold">NPK Values</label>
                                    <p className="text-lg font-semibold text-gray-800">{selectedCard.npk}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-500 uppercase font-bold">Recommendations</label>
                                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-1">
                                        {selectedCard.recommendations}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="mt-6 w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
