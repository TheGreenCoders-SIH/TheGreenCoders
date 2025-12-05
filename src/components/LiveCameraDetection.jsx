// Live Camera Detection Component
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, Pause, Play, Loader2 } from 'lucide-react';

export default function LiveCameraDetection({ onDetection, detectionMode = 'both', detectionInterval = 3000 }) {
    const webcamRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const intervalRef = useRef(null);

    // Capture and send frame for detection
    const captureAndDetect = () => {
        if (!webcamRef.current || isPaused || isDetecting) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && onDetection) {
            setIsDetecting(true);
            onDetection(imageSrc).finally(() => {
                setIsDetecting(false);
            });
        }
    };

    // Start continuous detection
    useEffect(() => {
        if (isActive && !isPaused) {
            // Initial detection
            captureAndDetect();

            // Set up interval for continuous detection
            intervalRef.current = setInterval(captureAndDetect, detectionInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, isPaused, detectionInterval]);

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    const stopCamera = () => {
        setIsActive(false);
        setIsPaused(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    if (!isActive) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Live Camera Detection
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Enable camera for real-time disease detection
                    </p>
                    <button
                        onClick={() => setIsActive(true)}
                        className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mx-auto"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        Start Live Detection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Live Camera Feed</h3>
                <button
                    onClick={stopCamera}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full"
                    videoConstraints={{
                        facingMode: 'environment' // Use back camera on mobile
                    }}
                />

                {/* Detection indicator */}
                {isDetecting && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Analyzing...
                    </div>
                )}

                {/* Pause indicator */}
                {isPaused && (
                    <div className="absolute top-4 left-4 bg-yellow-600 text-white px-3 py-2 rounded-lg">
                        Paused
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                        onClick={togglePause}
                        className={`px-6 py-3 rounded-lg transition-colors font-semibold flex items-center ${isPaused
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                    >
                        {isPaused ? (
                            <>
                                <Play className="w-5 h-5 mr-2" />
                                Resume
                            </>
                        ) : (
                            <>
                                <Pause className="w-5 h-5 mr-2" />
                                Pause
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>• Detection runs every {detectionInterval / 1000} seconds</p>
                <p>• Mode: Disease Detection</p>
            </div>
        </div>
    );
}
