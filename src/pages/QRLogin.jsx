// QR Login Page - Scan QR code or enter UID to login
import React, { useState } from 'react';
import { QrCode, Keyboard, Camera, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { QrReader } from 'react-qr-reader';
import { authenticateWithQR, authenticateWithUID, checkCameraPermission } from '../lib/qrAuth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function QRLogin() {
    const [mode, setMode] = useState('choice'); // 'choice', 'qr', 'uid'
    const [uid, setUid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cameraPermission, setCameraPermission] = useState(null);
    const navigate = useNavigate();

    // Check camera permission
    const handleQRMode = async () => {
        const permission = await checkCameraPermission();
        setCameraPermission(permission.granted);

        if (permission.granted) {
            setMode('qr');
            setError('');
        } else {
            setError(permission.error || 'Camera permission denied');
        }
    };

    // Handle QR code scan
    const handleQRScan = async (result, error) => {
        if (result) {
            setLoading(true);
            setError('');

            try {
                const authResult = await authenticateWithQR(result.text);

                if (authResult.success) {
                    setSuccess('QR code verified! Logging in...');

                    // For demo, we'll redirect directly
                    // In production, you'd sign in with Firebase Auth
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                } else {
                    setError(authResult.error || 'Invalid QR code');
                }
            } catch (err) {
                setError('Failed to authenticate. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        if (error) {
            console.error('QR scan error:', error);
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
                setSuccess('UID verified! Logging in...');

                // For demo, redirect directly
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                setError(authResult.error || 'Invalid UID');
            }
        } catch (err) {
            setError('Failed to authenticate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Smart Card Login</h1>
                    <p className="text-gray-600">Scan your farmer card or enter your ID</p>
                </div>

                {/* Choice Mode */}
                {mode === 'choice' && (
                    <div className="space-y-4">
                        <button
                            onClick={handleQRMode}
                            className="w-full flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            Scan QR Code
                        </button>

                        <button
                            onClick={() => setMode('uid')}
                            className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                        >
                            <Keyboard className="w-5 h-5 mr-2" />
                            Enter Farmer ID
                        </button>

                        <div className="text-center pt-4">
                            <a
                                href="/login"
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Login with email instead
                            </a>
                        </div>
                    </div>
                )}

                {/* QR Scanner Mode */}
                {mode === 'qr' && (
                    <div className="space-y-4">
                        <div className="bg-gray-100 rounded-xl overflow-hidden">
                            <QrReader
                                onResult={handleQRScan}
                                constraints={{ facingMode: 'environment' }}
                                containerStyle={{ width: '100%' }}
                                videoStyle={{ width: '100%' }}
                            />
                        </div>

                        <div className="text-center text-sm text-gray-600">
                            Position the QR code within the frame
                        </div>

                        <button
                            onClick={() => {
                                setMode('choice');
                                setError('');
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* UID Input Mode */}
                {mode === 'uid' && (
                    <form onSubmit={handleUIDLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Farmer ID
                            </label>
                            <input
                                type="text"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="FC-2025-XXXXXX"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                                pattern="FC-2025-\d{6}"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Format: FC-2025-XXXXXX
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode('choice');
                                setError('');
                                setUid('');
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Back
                        </button>
                    </form>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-start p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                        <div className="flex-1 text-sm text-red-700">{error}</div>
                    </motion.div>
                )}

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-start p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                        <div className="flex-1 text-sm text-green-700">{success}</div>
                    </motion.div>
                )}

                {/* Info */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2 text-sm">How to use:</h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Scan the QR code on your soil health card</li>
                        <li>• Or enter your Farmer ID manually</li>
                        <li>• Access your personalized dashboard instantly</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
}
