import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Phone, User, ArrowRight, ShieldCheck, QrCode, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'

    // Login State
    const [loginPhone, setLoginPhone] = useState('');

    // Signup State
    const [signupName, setSignupName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { loginWithPhone, signupWithPhone, loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (loginPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }

        const result = await loginWithPhone(loginPhone);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (signupPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }
        if (signupName.length < 3) {
            setError('Please enter your full name');
            setLoading(false);
            return;
        }

        const result = await signupWithPhone(signupName, signupPhone);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        const result = await loginAsGuest();
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError('Failed to start guest mode');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left Side - Visual Hero */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-green-900">
                <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-950 opacity-90"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-20 -mt-20 anim-pulse-slow"></div>

                <div className="relative z-10 flex flex-col justify-between p-16 h-full text-white">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-300 font-bold tracking-wider uppercase mb-4">
                            <Sprout className="w-5 h-5" />
                            The GreenCoders Project
                        </div>
                        <h1 className="text-5xl font-extrabold leading-tight mb-6">
                            Start Your Digital <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
                                Farming Journey
                            </span>
                        </h1>
                        <p className="text-lg text-emerald-100 max-w-md leading-relaxed">
                            Join thousands of farmers using AI-driven insights to improve yield and sustainability.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-green-300" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Instant Access</h3>
                                <p className="text-sm text-green-100 opacity-80">Simple mobile number login. No passwords. No OTPs.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setActiveTab('login'); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'login' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LogIn className="w-4 h-4" /> Login
                        </button>
                        <button
                            onClick={() => { setActiveTab('signup'); setError(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'signup' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <UserPlus className="w-4 h-4" /> Sign Up
                        </button>
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {activeTab === 'login' ? 'Enter your registered mobile number' : 'Enter your details to get started'}
                        </p>
                    </div>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'login' ? (
                            <motion.form
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Mobile Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 border-r border-gray-300 pr-3">
                                            <span className="text-gray-500 font-bold text-sm">🇮🇳 +91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            maxLength={10}
                                            value={loginPhone}
                                            onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full pl-24 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none font-mono text-lg tracking-wide"
                                            placeholder="98765 43210"
                                        />
                                    </div>
                                </div>

                                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-medium">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Login Securely'}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="signup-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSignup}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={signupName}
                                            onChange={(e) => setSignupName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
                                            placeholder="e.g. Rajesh Kumar"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Mobile Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 border-r border-gray-300 pr-3">
                                            <span className="text-gray-500 font-bold text-sm">🇮🇳 +91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            maxLength={10}
                                            value={signupPhone}
                                            onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full pl-24 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none font-mono text-lg tracking-wide"
                                            placeholder="98765 43210"
                                        />
                                    </div>
                                </div>

                                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-medium">{error}</div>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Sign Up'}
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Secondary Actions */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/qr-login')}
                                className="flex items-center justify-center p-3 gap-2 rounded-xl border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all group"
                            >
                                <QrCode className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
                                <span className="text-sm font-semibold text-gray-600 group-hover:text-green-700">QR Login</span>
                            </button>
                            <button
                                onClick={handleGuestLogin}
                                className="flex items-center justify-center p-3 gap-2 rounded-xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <ShieldCheck className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                                <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-700">Guest Mode</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
