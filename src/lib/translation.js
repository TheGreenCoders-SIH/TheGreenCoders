// Multi-language Translation System
// Google Translate API integration with caching

const SUPPORTED_LANGUAGES = {
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
    pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
};

class TranslationService {
    constructor() {
        this.cache = new Map();
        this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    }

    // Get cache key
    getCacheKey(text, targetLang) {
        return `${targetLang}:${text.substring(0, 100)}`;
    }

    // Translate text using Google Translate API
    async translate(text, targetLang = 'hi', sourceLang = 'en') {
        if (!text || targetLang === sourceLang) {
            return text;
        }

        // Check cache first
        const cacheKey = this.getCacheKey(text, targetLang);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLang,
                    source: sourceLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error('Translation API error');
            }

            const data = await response.json();
            const translatedText = data.data.translations[0].translatedText;

            // Cache the result
            this.cache.set(cacheKey, translatedText);

            // Limit cache size
            if (this.cache.size > 1000) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text on error
        }
    }

    // Translate multiple texts in batch
    async translateBatch(texts, targetLang = 'hi', sourceLang = 'en') {
        if (!Array.isArray(texts) || texts.length === 0) {
            return [];
        }

        try {
            const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: texts,
                    target: targetLang,
                    source: sourceLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error('Translation API error');
            }

            const data = await response.json();
            return data.data.translations.map(t => t.translatedText);
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts; // Return original texts on error
        }
    }

    // Detect language
    async detectLanguage(text) {
        try {
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: text })
            });

            if (!response.ok) {
                throw new Error('Language detection error');
            }

            const data = await response.json();
            return data.data.detections[0][0].language;
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en'; // Default to English
        }
    }

    // Get supported languages
    getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }

    // Check if language is supported
    isLanguageSupported(langCode) {
        return langCode in SUPPORTED_LANGUAGES;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
export { TranslationService, SUPPORTED_LANGUAGES };
