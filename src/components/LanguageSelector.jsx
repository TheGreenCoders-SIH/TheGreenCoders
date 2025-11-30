// Language Selector Component
import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
    const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();

    return (
        <div className="relative group">
            <button className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Globe className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">
                    {supportedLanguages[currentLanguage]?.flag} {supportedLanguages[currentLanguage]?.nativeName}
                </span>
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2">Select Language</div>
                    {Object.entries(supportedLanguages).map(([code, lang]) => (
                        <button
                            key={code}
                            onClick={() => changeLanguage(code)}
                            className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center ${currentLanguage === code ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                }`}
                        >
                            <span className="text-xl mr-3">{lang.flag}</span>
                            <div className="flex-1">
                                <div className="font-medium">{lang.nativeName}</div>
                                <div className="text-xs text-gray-500">{lang.name}</div>
                            </div>
                            {currentLanguage === code && (
                                <span className="text-green-600">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
