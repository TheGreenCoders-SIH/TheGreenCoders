import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import './Tutorial.css';

export default function MultiStepTutorial({ steps, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetPosition, setTargetPosition] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const currentStepData = steps[currentStep];

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (currentStepData?.targetId) {
                const element = document.getElementById(currentStepData.targetId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    setTargetPosition({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });
                    setIsVisible(true);
                } else {
                    console.warn(`Tutorial target not found: ${currentStepData.targetId}`);
                    setIsVisible(true); // Show anyway without spotlight
                }
            } else {
                // No target, just show message in center
                setTargetPosition(null);
                setIsVisible(true);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [currentStep, currentStepData]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, 300);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentStep(currentStep - 1);
            }, 300);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!currentStepData) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Dark Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={handleSkip}
                    />

                    {/* Spotlight on target element */}
                    {targetPosition && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="fixed z-[9999] pointer-events-none"
                            style={{
                                top: targetPosition.top - 12,
                                left: targetPosition.left - 12,
                                width: targetPosition.width + 24,
                                height: targetPosition.height + 24,
                            }}
                        >
                            <div className="tutorial-spotlight" />
                        </motion.div>
                    )}

                    {/* Animated Hand Pointer */}
                    {targetPosition && currentStepData.showPointer !== false && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed z-[10000] pointer-events-none"
                            style={{
                                top: targetPosition.top + targetPosition.height / 2 - 40,
                                left: targetPosition.left + targetPosition.width + 20,
                            }}
                        >
                            <div className="hand-pointer">
                                👈
                            </div>
                        </motion.div>
                    )}

                    {/* Tutorial Message Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed z-[10000]"
                        style={{
                            top: targetPosition ? targetPosition.top + targetPosition.height + 30 : '50%',
                            left: targetPosition ? Math.max(20, targetPosition.left - 100) : '50%',
                            transform: !targetPosition ? 'translate(-50%, -50%)' : 'none',
                            maxWidth: 'calc(100vw - 40px)',
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md border-4 border-green-500 relative">
                            {/* Close/Skip button */}
                            <button
                                onClick={handleSkip}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                                title="Skip tutorial"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Step indicator */}
                            <div className="flex gap-1 mb-4">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full flex-1 transition-all ${idx === currentStep ? 'bg-green-500' : idx < currentStep ? 'bg-green-300' : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Message */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                                    <span className="text-2xl mr-2">{currentStepData.icon || '🌱'}</span>
                                    {currentStepData.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {currentStepData.message}
                                </p>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    {currentStep < steps.length - 1 ? (
                                        <>
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    ) : (
                                        'Got it! 👍'
                                    )}
                                </button>
                            </div>

                            {/* Step counter */}
                            <div className="text-center mt-3 text-xs text-gray-500">
                                Step {currentStep + 1} of {steps.length}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
