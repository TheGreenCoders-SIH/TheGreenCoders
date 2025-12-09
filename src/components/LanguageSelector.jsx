import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSelector() {
    const { currentLanguage, changeLanguage, languages } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLangData = languages[currentLanguage];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-full px-3 py-1.5 transition-all text-sm text-gray-800"
            >
                <span className="text-lg">{currentLangData?.flag}</span>
                <span className="hidden md:block font-medium">{currentLangData?.native}</span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto"
                    >
                        {Object.entries(languages).map(([code, lang]) => (
                            <button
                                key={code}
                                onClick={() => {
                                    changeLanguage(code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 transition-colors text-left ${currentLanguage === code ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'
                                    }`}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{lang.native}</span>
                                    <span className="text-xs text-gray-400">{lang.name}</span>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
