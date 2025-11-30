// Pest & Disease Detection Page
import React, { useState } from 'react';
import { Bug, Loader2, AlertCircle, CheckCircle, History, Download } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import geminiVisionService from '../lib/geminiVision';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function PestDetection() {
    const [image, setImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const { currentLanguage } = useLanguage();

    // Load history on mount
    React.useEffect(() => {
        const loadedHistory = geminiVisionService.getHistory(10);
        setHistory(loadedHistory);
    }, []);

    const handleImageCapture = (imageData) => {
        setImage(imageData);
        setResult(null);
    };

    const analyzeImage = async () => {
        if (!image) return;

        setAnalyzing(true);
        setResult(null);

        try {
            const analysis = await geminiVisionService.analyzeCropImage(image, currentLanguage);

            if (analysis.success) {
                setResult(analysis);
                // Reload history
                const loadedHistory = geminiVisionService.getHistory(10);
                setHistory(loadedHistory);
            } else {
                setResult({
                    success: false,
                    error: analysis.error || 'Analysis failed'
                });
            }
        } catch (error) {
            console.error('Analysis error:', error);
            setResult({
                success: false,
                error: 'Failed to analyze image. Please try again.'
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high':
            case 'critical':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'medium':
            case 'moderate':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low':
                return 'text-green-600 bg-green-50 border-green-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getHealthStatusColor = (status) => {
        if (status?.toLowerCase().includes('healthy')) {
            return 'text-green-600 bg-green-50';
        } else if (status?.toLowerCase().includes('diseased')) {
            return 'text-red-600 bg-red-50';
        } else if (status?.toLowerCase().includes('pest')) {
            return 'text-orange-600 bg-orange-50';
        }
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Pest & Disease Detection</h1>
                        <p className="text-green-100">AI-powered crop health analysis</p>
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                        <History className="w-4 h-4 mr-2" />
                        History
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image Upload */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Upload Crop Image</h2>

                        <ImageUpload onImageCapture={handleImageCapture} maxSize={5} />

                        {image && !analyzing && !result && (
                            <button
                                onClick={analyzeImage}
                                className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                                <Bug className="w-5 h-5 mr-2" />
                                Analyze for Pests & Diseases
                            </button>
                        )}

                        {analyzing && (
                            <div className="mt-4 flex items-center justify-center p-6 bg-blue-50 rounded-lg">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                                <span className="text-blue-700 font-medium">Analyzing image with AI...</span>
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2 text-sm">Tips for best results:</h3>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Take clear, well-lit photos</li>
                            <li>• Focus on affected plant parts</li>
                            <li>• Include close-up of symptoms</li>
                            <li>• Avoid blurry or dark images</li>
                        </ul>
                    </div>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    {result && result.success && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-800">Analysis Results</h2>
                                <div className="flex items-center text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                    Analyzed
                                </div>
                            </div>

                            {/* Crop Type */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Crop Identified</div>
                                <div className="text-xl font-bold text-gray-800">{result.cropType}</div>
                            </div>

                            {/* Health Status */}
                            <div className={`p-4 rounded-lg border ${getHealthStatusColor(result.healthStatus)}`}>
                                <div className="text-sm font-medium mb-1">Health Status</div>
                                <div className="text-lg font-bold">{result.healthStatus}</div>
                            </div>

                            {/* Disease/Pest Detected */}
                            {result.diseaseOrPest && result.diseaseOrPest !== 'None detected' && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="text-sm text-red-600 font-medium mb-1">Detected Issue</div>
                                    <div className="text-lg font-bold text-red-700">{result.diseaseOrPest}</div>
                                </div>
                            )}

                            {/* Confidence & Severity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-sm text-blue-600 mb-1">Confidence</div>
                                    <div className="text-2xl font-bold text-blue-700">{result.confidence}%</div>
                                </div>
                                <div className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}>
                                    <div className="text-sm font-medium mb-1">Severity</div>
                                    <div className="text-2xl font-bold">{result.severity}</div>
                                </div>
                            </div>

                            {/* Symptoms */}
                            {result.symptoms && result.symptoms.length > 0 && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="text-sm font-semibold text-yellow-800 mb-2">Symptoms Observed</div>
                                    <ul className="space-y-1">
                                        {result.symptoms.map((symptom, idx) => (
                                            <li key={idx} className="text-sm text-yellow-700">• {symptom}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Treatment */}
                            {result.treatment && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="text-sm font-semibold text-green-800 mb-2">Recommended Treatment</div>
                                    <p className="text-sm text-green-700 whitespace-pre-line">{result.treatment}</p>
                                </div>
                            )}

                            {/* Organic Solutions */}
                            {result.organicSolutions && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div className="text-sm font-semibold text-emerald-800 mb-2">Organic Solutions</div>
                                    <p className="text-sm text-emerald-700 whitespace-pre-line">{result.organicSolutions}</p>
                                </div>
                            )}

                            {/* Full Report */}
                            <details className="p-4 bg-gray-50 rounded-lg">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                                    View Full AI Report
                                </summary>
                                <div className="mt-3 text-sm text-gray-600 whitespace-pre-line">
                                    {result.fullReport}
                                </div>
                            </details>
                        </motion.div>
                    )}

                    {result && !result.success && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                            <div className="flex items-start">
                                <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-red-800 mb-1">Analysis Failed</h3>
                                    <p className="text-sm text-red-600">{result.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!result && !analyzing && (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                            <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Upload an image to start analysis</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detection History */}
            {showHistory && history.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Detection History</h2>
                    <div className="space-y-3">
                        {history.map((record) => (
                            <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-gray-800">
                                        {record.analysis.cropType} - {record.analysis.diseaseOrPest}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(record.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full ${getHealthStatusColor(record.analysis.healthStatus)}`}>
                                        {record.analysis.healthStatus}
                                    </span>
                                    <span className="text-gray-600">
                                        Confidence: {record.analysis.confidence}%
                                    </span>
                                    <span className={`px-2 py-1 rounded-full ${getSeverityColor(record.analysis.severity)}`}>
                                        {record.analysis.severity}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
