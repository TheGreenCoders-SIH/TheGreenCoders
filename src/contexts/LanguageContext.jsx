// Language Context for Multi-language Support
import React, { createContext, useContext, useState, useEffect } from 'react';
import translationService, { SUPPORTED_LANGUAGES } from '../lib/translation';

const LanguageContext = createContext();

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function LanguageProvider({ children }) {
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [isTranslating, setIsTranslating] = useState(false);

    // Load saved language preference
    useEffect(() => {
        const saved = localStorage.getItem('preferred_language');
        if (saved && SUPPORTED_LANGUAGES[saved]) {
            setCurrentLanguage(saved);
        }
    }, []);

    // Save language preference
    const changeLanguage = (langCode) => {
        if (SUPPORTED_LANGUAGES[langCode]) {
            setCurrentLanguage(langCode);
            localStorage.setItem('preferred_language', langCode);
        }
    };

    // Translate text
    const translate = async (text, targetLang = null) => {
        const lang = targetLang || currentLanguage;

        if (lang === 'en' || !text) {
            return text;
        }

        setIsTranslating(true);
        try {
            const translated = await translationService.translate(text, lang, 'en');
            return translated;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        } finally {
            setIsTranslating(false);
        }
    };

    // Translate batch
    const translateBatch = async (texts, targetLang = null) => {
        const lang = targetLang || currentLanguage;

        if (lang === 'en' || !texts || texts.length === 0) {
            return texts;
        }

        setIsTranslating(true);
        try {
            const translated = await translationService.translateBatch(texts, lang, 'en');
            return translated;
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts;
        } finally {
            setIsTranslating(false);
        }
    };

    const value = {
        currentLanguage,
        changeLanguage,
        translate,
        translateBatch,
        isTranslating,
        supportedLanguages: SUPPORTED_LANGUAGES,
        isRTL: ['ar', 'ur'].includes(currentLanguage) // For future RTL support
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
