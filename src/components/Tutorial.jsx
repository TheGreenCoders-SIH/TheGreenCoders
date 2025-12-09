import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './Tutorial.css';

export default function Tutorial({ targetId, onComplete, message, step = 1, totalSteps = 1 }) {
    const [targetPosition, setTargetPosition] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });
                setIsVisible(true);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [targetId]);

    const handleComplete = () => {
        setIsVisible(false);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    if (!targetPosition) return null;

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
                        onClick={handleComplete}
                    />

                    {/* Spotlight on target element */}
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

                    {/* Animated Hand Pointer */}
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

                    {/* Tutorial Message Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed z-[10000]"
                        style={{
                            top: targetPosition.top + targetPosition.height + 30,
                            left: Math.max(20, targetPosition.left - 100),
                            maxWidth: 'calc(100vw - 40px)',
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-4 border-green-500 relative">
                            {/* Close button */}
                            <button
                                onClick={handleComplete}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Step indicator */}
                            {totalSteps > 1 && (
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: totalSteps }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full flex-1 ${idx + 1 === step ? 'bg-green-500' : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Message */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                                    <span className="text-2xl mr-2">🌱</span>
                                    Welcome to GreenCoders!
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Action button */}
                            <button
                                onClick={handleComplete}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Got it! 👍
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
