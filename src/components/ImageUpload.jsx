// Image Upload Component for Disease Detection
import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Image as ImageIcon } from 'lucide-react';
import Webcam from 'react-webcam';

export default function ImageUpload({ onImageCapture, maxSize = 5 }) {
    const [preview, setPreview] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file) return;

        // Check file size (in MB)
        if (file.size > maxSize * 1024 * 1024) {
            alert(`File size must be less than ${maxSize}MB`);
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Read and preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setPreview(base64String);
            if (onImageCapture) {
                onImageCapture(base64String);
            }
        };
        reader.readAsDataURL(file);
    };

    // Handle drag and drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Handle camera capture
    const capturePhoto = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setPreview(imageSrc);
        setShowCamera(false);
        if (onImageCapture) {
            onImageCapture(imageSrc);
        }
    };

    // Clear image
    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (onImageCapture) {
            onImageCapture(null);
        }
    };

    return (
        <div className="space-y-4">
            {!preview && !showCamera && (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-green-600" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Upload Crop Image
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Drag and drop or click to select
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                            </button>

                            <button
                                onClick={() => setShowCamera(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Take Photo
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            Supported: JPG, PNG, WEBP (Max {maxSize}MB)
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                    />
                </div>
            )}

            {/* Camera View */}
            {showCamera && (
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
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <button
                            onClick={capturePhoto}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                        >
                            Capture Photo
                        </button>
                        <button
                            onClick={() => setShowCamera(false)}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {preview && (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-xl border-2 border-gray-200"
                    />
                    <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
