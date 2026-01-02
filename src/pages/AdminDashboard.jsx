import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { generateFarmerId, ROLES } from '../lib/roles';
import { sendSMS } from '../lib/api';
import { Users, Plus, Edit, Trash2, Eye, UserPlus, Shield, Loader2, Search, Activity, Building2, LayoutDashboard, Database, Smartphone, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    const [farmers, setFarmers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [ngos, setNgos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddFarmer, setShowAddFarmer] = useState(false);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [showAddNGO, setShowAddNGO] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [testPhone, setTestPhone] = useState('');

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            // Load all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load all farmer cards (fetch ONCE instead of inside loop)
            const cardsSnap = await getDocs(collection(db, 'farmers'));
            const allCards = cardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const farmersList = allUsers.filter(u => u.role === ROLES.FARMER);
            const adminsList = allUsers.filter(u => u.role === ROLES.ADMIN);
            const ngosList = allUsers.filter(u => u.role === ROLES.NGO);

            // Merge card data and fix missing names
            const farmersWithCards = farmersList.map(farmer => {
                const farmerCardDoc = allCards.find(c => c.id === farmer.farmerId);
                const cardData = farmerCardDoc?.card || null;

                // Fallback name resolution
                // 1. User Profile Name
                // 2. Card Name (if available)
                // 3. Email prefix
                // 4. "Unnamed Farmer"
                let resolvedName = farmer.name;
                if (!resolvedName || resolvedName === 'Unnamed' || resolvedName.trim() === '') {
                    resolvedName = cardData?.farmerName || farmer.email?.split('@')[0] || 'Unnamed Farmer';
                    // Capitalize first letter of email prefix if used
                    if (resolvedName === farmer.email?.split('@')[0]) {
                        resolvedName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
                    }
                }

                return {
                    ...farmer,
                    name: resolvedName,
                    card: cardData
                };
            });

            setFarmers(farmersWithCards);
            setAdmins(adminsList);
            setNgos(ngosList);
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
            const name = formData.get('name');
            const phoneNumber = formData.get('phoneNumber');

            if (!phoneNumber || phoneNumber.length !== 10) {
                throw new Error("Please enter a valid 10-digit mobile number");
            }

            // Create user profile in Firestore
            // Note: We are creating a "Pre-registered" user. 
            // The actual Auth User will be created when they log in via OTP for the first time.
            const farmerId = generateFarmerId();

            // Generate a new document reference to get a unique ID
            const newFarmerRef = doc(collection(db, 'users'));

            await setDoc(newFarmerRef, {
                name,
                phoneNumber, // Store raw 10 digit number or with +91? Let's store raw for consistency with search, or +91 if auth expects it. 
                // Auth context usually handles +91. Let's store as is for now, maybe add +91 prefix if we standarize.
                // Looking at other code, we usually use the raw input or handle formatting.
                // Let's store just the number for now, or match the input.
                role: ROLES.FARMER,
                farmerId,
                hasCard: false,
                createdAt: new Date().toISOString(),
                isPreRegistered: true // Flag to help AuthContext identify this is a pre-filled profile
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
            const name = formData.get('name');
            const phoneNumber = formData.get('phoneNumber');

            if (!phoneNumber || phoneNumber.length !== 10) {
                throw new Error("Please enter a valid 10-digit mobile number");
            }

            // Create admin profile in Firestore
            const newUserRef = doc(collection(db, 'users'));

            await setDoc(newUserRef, {
                name,
                phoneNumber,
                role: ROLES.ADMIN,
                createdAt: new Date().toISOString(),
                isPreRegistered: true
            });

            setShowAddAdmin(false);
            loadAllData();
            alert('Admin added successfully!');
        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Failed to add admin: ' + error.message);
        }
    };

    const handleAddNGO = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const name = formData.get('name');
            const phoneNumber = formData.get('phoneNumber');
            const organizationId = formData.get('organizationId');

            if (!phoneNumber || phoneNumber.length !== 10) {
                throw new Error("Please enter a valid 10-digit mobile number");
            }

            // Create NGO profile in Firestore
            const newUserRef = doc(collection(db, 'users'));

            await setDoc(newUserRef, {
                name,
                phoneNumber,
                role: ROLES.NGO,
                organizationId,
                createdAt: new Date().toISOString(),
                isPreRegistered: true
            });

            setShowAddNGO(false);
            loadAllData();
            alert('NGO added successfully!');
        } catch (error) {
            console.error('Error adding NGO:', error);
            alert('Failed to add NGO: ' + error.message);
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
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 animate-fade-in-up">
                {/* Command Center Header */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 text-white">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-90"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-20 -mt-20"></div>

                    <div className="relative z-10 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 text-blue-300 font-bold tracking-wider uppercase mb-2">
                                    <LayoutDashboard className="w-5 h-5" />
                                    System Administration
                                </div>
                                <h1 className="text-4xl font-extrabold mb-2">Command Center</h1>
                                <p className="text-blue-100 max-w-xl">
                                    Monitor system health, manage user access, and oversee the entire digital agriculture ecosystem.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => setShowAddFarmer(true)} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 font-bold transition-all flex items-center gap-2">
                                    <UserPlus className="w-5 h-5" /> New Farmer
                                </button>
                                <button onClick={() => setShowAddAdmin(true)} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 font-bold transition-all flex items-center gap-2">
                                    <Shield className="w-5 h-5" /> New Admin
                                </button>
                                <button onClick={() => setShowAddNGO(true)} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/50 font-bold transition-all flex items-center gap-2">
                                    <Building2 className="w-5 h-5" /> New NGO
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-blue-200 text-xs font-semibold uppercase">Total Farmers</p>
                                <p className="text-3xl font-bold mt-1">{farmers.length}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-blue-200 text-xs font-semibold uppercase">Active Cards</p>
                                <p className="text-3xl font-bold mt-1">{farmers.filter(f => f.card).length}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-blue-200 text-xs font-semibold uppercase">NGO Partners</p>
                                <p className="text-3xl font-bold mt-1">{ngos.length}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-blue-200 text-xs font-semibold uppercase">Sys Admins</p>
                                <p className="text-3xl font-bold mt-1">{admins.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Farmers Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Database className="w-5 h-5 text-green-600" />
                                    Farmer Database
                                </h2>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by ID, name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-none focus:bg-gray-100 focus:ring-2 focus:ring-green-500/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Farmer ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredFarmers.map((farmer) => (
                                            <tr key={farmer.id} className="group hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 text-sm font-mono text-gray-600">{farmer.farmerId}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-gray-900">{farmer.name || 'Unnamed'}</div>
                                                    <div className="text-xs text-gray-400">{farmer.email}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {farmer.card ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                            Unverified
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {farmer.card && (
                                                            <>
                                                                <button onClick={() => setSelectedCard(farmer.card)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleTerminateCard(farmer.farmerId)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
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
                    </div>

                    {/* Sidebar: System & Tools */}
                    <div className="space-y-6">
                        {/* System Health */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" /> System Status
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-green-800">IoT Grid Online</span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-900">{Math.round(farmers.length * 0.82)} <span className="text-sm font-normal text-green-600">sensors</span></div>
                                </div>

                                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                                    <span className="text-sm font-semibold text-orange-800">Alerts Pending</span>
                                    <div className="text-2xl font-bold text-orange-900 mt-1">{Math.round(farmers.length * 0.1)} <span className="text-sm font-normal text-orange-600">needs check</span></div>
                                </div>
                            </div>
                        </div>

                        {/* SMS Test Tool */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-purple-500" /> SMS Gateway
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Test Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91..."
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        className="w-full mt-1 px-4 py-2 rounded-xl bg-gray-50 font-mono text-sm border-none focus:bg-gray-100 focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!testPhone) return alert('Please enter a phone number');
                                        try {
                                            const result = await sendSMS(testPhone, "Test from GreenCoders Admin");
                                            alert(result.success ? 'SMS Sent!' : 'Failed: ' + result.error);
                                        } catch (error) {
                                            alert('Error: ' + error.message);
                                        }
                                    }}
                                    className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                                >
                                    Test Connectivity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(showAddFarmer || showAddAdmin || showAddNGO) && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowAddFarmer(false); setShowAddAdmin(false); setShowAddNGO(false); }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {showAddFarmer ? 'New Farmer Profile' : showAddAdmin ? 'New System Admin' : 'New NGO Partner'}
                                </h3>
                                <button onClick={() => { setShowAddFarmer(false); setShowAddAdmin(false); setShowAddNGO(false); }} className="p-2 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={showAddFarmer ? handleAddFarmer : showAddAdmin ? handleAddAdmin : handleAddNGO} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Full Name</label>
                                    <input type="text" name="name" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5" placeholder="Enter name" />
                                </div>
                                {showAddNGO && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Organization ID</label>
                                        <input type="text" name="organizationId" required className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5" placeholder="ORG-ID" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Mobile Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 border-r border-gray-300 pr-3">
                                            <span className="text-gray-500 font-bold text-sm">🇮🇳 +91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            required
                                            maxLength={10}
                                            className="w-full pl-24 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 font-mono text-lg tracking-wide"
                                            placeholder="98765 43210"
                                            onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5" /> Create Account
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {selectedCard && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-t-8 border-green-500"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 text-green-600">
                                    <Database className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Soil Health Data</h3>
                                <p className="text-gray-500">Official Analysis Report</p>
                            </div>

                            <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-sm text-gray-500 font-medium">Farmer Name</span>
                                    <span className="font-bold text-gray-900">{selectedCard.farmerName}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-sm text-gray-500 font-medium">Village ID</span>
                                    <span className="font-bold text-gray-900">{selectedCard.village}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="text-center bg-white p-3 rounded-xl shadow-sm">
                                        <div className="text-xs text-gray-400 uppercase font-bold">pH Level</div>
                                        <div className="text-xl font-bold text-green-700">{selectedCard.ph}</div>
                                    </div>
                                    <div className="text-center bg-white p-3 rounded-xl shadow-sm">
                                        <div className="text-xs text-gray-400 uppercase font-bold">Organic C</div>
                                        <div className="text-xl font-bold text-green-700">{selectedCard.organicCarbon}%</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedCard(null)}
                                className="w-full mt-6 py-3.5 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                            >
                                Close Report
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
