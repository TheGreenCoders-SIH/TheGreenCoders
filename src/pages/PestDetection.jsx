// Disease Detection Page with AI Treatment Recommendations
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, History, Camera, Upload as UploadIcon, Activity, Trash2, FileText } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import LiveCameraDetection from '../components/LiveCameraDetection';
import diseaseDetectionService from '../lib/pestDetectionService';
import { motion } from 'framer-motion';

export default function DiseaseDetection() {
    const [mode, setMode] = useState('upload'); // 'upload' or 'live'
    const [image, setImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [treatment, setTreatment] = useState(null);
    const [loadingTreatment, setLoadingTreatment] = useState(false);

    // Load history on mount
    useEffect(() => {
        const loadedHistory = diseaseDetectionService.getHistory();
        setHistory(loadedHistory);
    }, []);

    const handleImageCapture = (imageData) => {
        setImage(imageData);
        setResult(null);
        setTreatment(null);
    };

    const analyzeImage = async (imageData = null) => {
        const imageToAnalyze = imageData || image;
        if (!imageToAnalyze) return;

        setAnalyzing(true);
        setResult(null);
        setTreatment(null);

        try {
            const analysis = await diseaseDetectionService.detectDisease(imageToAnalyze);

            if (analysis.success) {
                setResult(analysis);

                // Save to history with image
                diseaseDetectionService.saveToHistory({
                    ...analysis,
                    image: imageToAnalyze
                });

                // Reload history
                setHistory(diseaseDetectionService.getHistory());
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

    const handleLiveDetection = async (imageData) => {
        return analyzeImage(imageData);
    };

    const getTreatmentRecommendations = async () => {
        if (!result || !result.prediction) {
            console.error('No result or prediction available');
            return;
        }

        console.log('Getting treatment for disease:', result.prediction);
        setLoadingTreatment(true);
        try {
            const treatmentData = await diseaseDetectionService.getTreatmentRecommendations(result.prediction);
            console.log('Treatment response:', treatmentData);

            if (treatmentData.success) {
                setTreatment(treatmentData.treatment);
            } else {
                const errorMsg = treatmentData.error || 'Failed to load treatment recommendations. Please try again.';
                console.error('Treatment API error:', errorMsg);
                setTreatment(`Error: ${errorMsg}`);
            }
        } catch (error) {
            console.error('Treatment error:', error);
            setTreatment(`Error: ${error.message || 'Failed to load treatment recommendations. Please try again.'}`);
        } finally {
            setLoadingTreatment(false);
        }
    };

    const clearHistory = () => {
        diseaseDetectionService.clearHistory();
        setHistory([]);
        setShowHistory(false);
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50';
        if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const renderResult = () => {
        if (!result) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                {result.success ? (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Detection Result</h3>
                                <div className="flex items-center text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Analysis Complete
                                </div>
                            </div>

                            {/* Selected Model Badge */}
                            {result.selected_model && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Model:</span>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">
                                        {result.selected_model}
                                    </span>
                                </div>
                            )}

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1 font-medium">Detected Disease</div>
                                <div className="text-xl font-bold text-gray-900">{result.prediction}</div>
                            </div>

                            <div className={`p-4 rounded-lg border ${getConfidenceColor(result.confidence)}`}>
                                <div className="text-sm font-semibold mb-1">Confidence Level</div>
                                <div className="text-2xl font-bold">{(result.confidence * 100).toFixed(1)}%</div>
                            </div>

                            {/* All Model Results */}
                            {result.all_model_results && Object.keys(result.all_model_results).length > 1 && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="text-sm font-semibold text-blue-900 mb-3">All Model Predictions</div>
                                    <div className="space-y-2">
                                        {Object.entries(result.all_model_results).map(([modelName, modelResult]) => (
                                            <div key={modelName} className="flex justify-between items-center p-2 bg-white rounded border border-blue-100">
                                                <span className="text-sm text-blue-800 font-medium">{modelName}</span>
                                                <div className="text-right">
                                                    <div className="text-xs text-blue-600">{modelResult.prediction}</div>
                                                    <div className="text-sm font-semibold text-blue-900">
                                                        {(modelResult.confidence * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Predictions */}
                            {result.all_predictions && Object.keys(result.all_predictions).length > 0 && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="text-sm font-semibold text-gray-800 mb-3">Alternative Predictions</div>
                                    <div className="space-y-2">
                                        {Object.entries(result.all_predictions).map(([label, prob]) => (
                                            <div key={label} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-700">{label}</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {(prob * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Treatment Recommendation Button */}
                            <button
                                onClick={getTreatmentRecommendations}
                                disabled={loadingTreatment}
                                className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loadingTreatment ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Generating Recommendations...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5 mr-2" />
                                        Get Treatment Recommendations
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Treatment Recommendations */}
                        {treatment && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-xl shadow-sm border border-green-200"
                            >
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                                    Treatment Recommendations
                                </h3>
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                    {treatment}
                                </div>
                            </motion.div>
                        )}
                    </>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                        <div className="flex items-center text-red-600 mb-2">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span className="font-semibold">Analysis Failed</span>
                        </div>
                        <p className="text-sm text-red-700">{result.error || 'Detection failed'}</p>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Disease Detection</h1>
                        <p className="text-green-50">AI-powered crop disease analysis and treatment recommendations</p>
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                    >
                        <History className="w-4 h-4 mr-2" />
                        History
                    </button>
                </div>
            </div>

            {/* Mode Selection */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Input Mode
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setMode('upload')}
                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all font-medium ${mode === 'upload'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Upload Image
                    </button>
                    <button
                        onClick={() => setMode('live')}
                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-all font-medium ${mode === 'live'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Live Camera
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Input */}
                <div className="space-y-6">
                    {mode === 'upload' ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Crop Image</h2>
                            <ImageUpload onImageCapture={handleImageCapture} maxSize={5} />

                            {image && !analyzing && !result && (
                                <button
                                    onClick={() => analyzeImage()}
                                    className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                                >
                                    <Activity className="w-5 h-5 mr-2" />
                                    Analyze Image
                                </button>
                            )}

                            {analyzing && (
                                <div className="mt-4 flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                                    <span className="text-blue-700 font-medium">Analyzing with AI models...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <LiveCameraDetection
                            onDetection={handleLiveDetection}
                            detectionMode="disease"
                            detectionInterval={3000}
                        />
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2 text-sm">Best Practices</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Capture clear, well-lit images of affected plant parts</li>
                            <li>• Focus on visible disease symptoms</li>
                            <li>• Avoid blurry or dark images</li>
                            <li>• Include close-up details when possible</li>
                            {mode === 'live' && <li>• Hold camera steady for 2-3 seconds</li>}
                        </ul>
                    </div>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    {result ? (
                        renderResult()
                    ) : !analyzing ? (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {mode === 'upload' ? 'Upload an image to start analysis' : 'Start live camera to begin detection'}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Detection History */}
            {showHistory && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Detection History</h2>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Clear All
                            </button>
                        )}
                    </div>

                    {history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map((record) => (
                                <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                                    {record.image && (
                                        <img
                                            src={record.image}
                                            alt="Detection"
                                            className="w-full h-32 object-cover rounded-lg mb-3"
                                        />
                                    )}
                                    <div className="space-y-2">
                                        <div className="font-semibold text-gray-900 text-sm">{record.disease}</div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">
                                                {new Date(record.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className={`px-2 py-1 rounded ${getConfidenceColor(record.confidence)}`}>
                                                {(record.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        {record.selectedModel && (
                                            <div className="text-xs text-gray-500">
                                                Model: {record.selectedModel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p>No detection history yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
