import React, { createContext, useContext, useState, useEffect } from 'react';
import { translationService } from '../lib/translation';
import { LANGUAGES } from '../lib/staticTranslations';

const LanguageContext = createContext();

export function useLanguage() {
    return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
    // 1. Initialize from localStorage or default to 'en'
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'en';
    });

    // 2. Persist change
    const changeLanguage = (langCode) => {
        if (LANGUAGES[langCode]) {
            setCurrentLanguage(langCode);
            localStorage.setItem('app_language', langCode);
            // Optional: Reload page if needed to flush state, but context should handle it reactively
        }
    };

    // 3. Helper to translate single text (async)
    // Note: This is for imperative usage. For UI, use the useTranslation hook.
    const translateText = async (text) => {
        return await translationService.translate(text, currentLanguage);
    };

    const value = {
        currentLanguage,
        changeLanguage,
        translateText,
        languages: LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
