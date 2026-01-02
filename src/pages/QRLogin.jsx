import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, Camera, Loader2, CheckCircle2, XCircle, Upload, ArrowLeft, ScanLine, ImagePlus, Shield } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { authenticateWithQR, authenticateWithUID, checkCameraPermission } from '../lib/qrAuth';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRLogin() {
    const [mode, setMode] = useState('choice'); // 'choice', 'qr', 'uid'
    const [uid, setUid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);
    const { loginWithQR } = useAuth();
    const navigate = useNavigate();

    const handleQRMode = () => {
        setMode('qr');
        setError('');
    };

    // Initialize Scanner when mode is 'qr'
    React.useEffect(() => {
        if (mode === 'qr') {
            const scanner = new Html5Qrcode("reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            scanner.start({ facingMode: "environment" }, config,
                (decodedText) => {
                    handleQRScan({ text: decodedText }, null);
                    scanner.stop().catch(err => console.error("Failed to stop scanner", err));
                },
                (errorMessage) => {
                    // ignore errors for better UX
                }
            ).catch(err => {
                console.error("Camera start failed", err);
                setError("Camera failed to start. Please check permissions.");
            });

            return () => {
                scanner.stop().catch(err => console.error("Failed to stop scanner cleanup", err));
            };
        }
    }, [mode]);

    // Handle QR code scan from Camera (Simplified)
    const handleQRScan = async (result, error) => {
        if (result && result.text) {
            setLoading(true);
            setError('');
            try {
                const authResult = await authenticateWithQR(result.text);
                if (authResult.success) {
                    loginWithQR(authResult);
                    setSuccess('Identity Verified! Redirecting...');
                    setTimeout(() => navigate('/dashboard'), 1500);
                } else {
                    setError(authResult.error || 'Invalid Card');
                }
            } catch (err) {
                setError('Authentication failed. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle File Upload Scan
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        try {
            const html5QrCode = new Html5Qrcode("reader-hidden");
            const decodedText = await html5QrCode.scanFile(file, true);
            const authResult = await authenticateWithQR(decodedText);

            if (authResult.success) {
                loginWithQR(authResult);
                setSuccess('Quick Scan Successful! Redirecting...');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setError(authResult.error || 'Invalid QR in image');
            }
        } catch (err) {
            setError('Could not read QR code. Try a clearer image.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Handle UID login
    const handleUIDLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const authResult = await authenticateWithUID(uid);
            if (authResult.success) {
                loginWithQR(authResult);
                setSuccess('ID Verified! Accessing Dashboard...');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setError(authResult.error || 'Invalid Farmer ID');
            }
        } catch (err) {
            setError('System Error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Hidden div for html5-qrcode file scanning */}
            <div id="reader-hidden" className="hidden"></div>

            {/* Main Container */}
            <div className="w-full max-w-md">
                {/* Visual Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-lg shadow-green-500/30 mb-6 transform rotate-3">
                        <ScanLine className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Quick Access
                    </h1>
                    <p className="text-gray-500">Secure entry to your farm dashboard</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden relative">
                    <div className="p-8">
                        {/* Back Button (if not in choice mode) */}
                        {mode !== 'choice' && (
                            <button
                                onClick={() => { setMode('choice'); setError(''); }}
                                className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <AnimatePresence mode="wait">
                            {/* Choice Mode */}
                            {mode === 'choice' && (
                                <motion.div
                                    key="choice"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <button
                                        onClick={handleQRMode}
                                        className="w-full p-5 flex items-center gap-4 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 hover:border-green-300 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-900">Scan QR Code</div>
                                            <div className="text-xs text-gray-500">Use your camera</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full p-5 flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 hover:border-blue-300 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                            <ImagePlus className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-900">Upload Image</div>
                                            <div className="text-xs text-gray-500">From gallery</div>
                                        </div>
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                    <button
                                        onClick={() => setMode('uid')}
                                        className="w-full p-5 flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 hover:border-gray-300 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-600 shadow-sm group-hover:scale-110 transition-transform">
                                            <Keyboard className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-900">Enter Farmer ID</div>
                                            <div className="text-xs text-gray-500">Manually type ID</div>
                                        </div>
                                    </button>

                                    <div className="pt-4 text-center">
                                        <a href="/login" className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
                                            Use Phone No instead
                                        </a>
                                    </div>
                                </motion.div>
                            )}

                            {/* QR Scanner Mode */}
                            {mode === 'qr' && (
                                <motion.div
                                    key="qr"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="text-center"
                                >
                                    <h2 className="text-xl font-bold mb-6">Scan Code</h2>
                                    <div id="reader" className="bg-black rounded-3xl overflow-hidden relative shadow-inner aspect-square mx-auto max-w-[300px]"></div>
                                    <p className="mt-6 text-sm text-gray-500">Align the QR code within the frame</p>
                                </motion.div>
                            )}

                            {/* UID Mode */}
                            {mode === 'uid' && (
                                <motion.div
                                    key="uid"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                >
                                    <h2 className="text-2xl font-bold text-center mb-6">Farmer ID Verification</h2>
                                    <form onSubmit={handleUIDLogin} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Enter ID Number</label>
                                            <input
                                                type="text"
                                                value={uid}
                                                onChange={(e) => setUid(e.target.value)}
                                                placeholder="FC-2025-XXXXXX"
                                                className="w-full px-5 py-4 text-lg bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-mono tracking-wider outline-none text-center uppercase"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:translate-y-px transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Verifying...' : 'Access Dashboard'}
                                            {!loading && <Shield className="w-5 h-5" />}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Status Messages */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium"
                                >
                                    <XCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 text-sm font-medium"
                                >
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
