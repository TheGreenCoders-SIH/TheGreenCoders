import { getStaticTranslation } from './staticTranslations';
import { fetchTranslation } from './freeTranslationAPI';

class TranslationService {
    async translate(text, targetLang) {
        if (!text) return '';
        if (targetLang === 'en') return text;

        // 1. Check Static Dictionary (Fastest)
        const staticTrans = getStaticTranslation(text, targetLang);
        if (staticTrans) {
            return staticTrans;
        }

        // 2. Check API / Cache (Async)
        try {
            return await fetchTranslation(text, targetLang);
        } catch (error) {
            console.error('Translation service error:', error);
            return text; // Fallback to english
        }
    }
}

export const translationService = new TranslationService();
