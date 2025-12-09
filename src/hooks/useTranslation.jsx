import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translationService } from '../lib/translation';

// Hook for dynamic text
export function useTranslation(text) {
    const { currentLanguage } = useLanguage();
    const [translatedText, setTranslatedText] = useState(text);

    useEffect(() => {
        let isMounted = true;

        if (currentLanguage === 'en') {
            setTranslatedText(text);
            return;
        }

        const fetchTrans = async () => {
            // Show placeholder or keep previous while loading? 
            // Better to keep previous English text until loaded to prevent flickering blank space
            const result = await translationService.translate(text, currentLanguage);
            if (isMounted) {
                setTranslatedText(result);
            }
        };

        fetchTrans();

        return () => { isMounted = false; };
    }, [text, currentLanguage]);

    return translatedText;
}

// Hook for array of texts (batch)
export function useTranslations(texts) {
    const { currentLanguage } = useLanguage();
    const [results, setResults] = useState(texts.reduce((acc, t) => ({ ...acc, [t]: t }), {}));

    useEffect(() => {
        if (currentLanguage === 'en') {
            setResults(texts.reduce((acc, t) => ({ ...acc, [t]: t }), {}));
            return;
        }

        const fetchAll = async () => {
            const newResults = {};
            await Promise.all(texts.map(async (text) => {
                newResults[text] = await translationService.translate(text, currentLanguage);
            }));
            setResults(newResults);
        };

        fetchAll();
    }, [JSON.stringify(texts), currentLanguage]);

    return results;
}

// <T> Component for Inline Translation
// Usage: <T>Hello World</T>
export const T = ({ children }) => {
    const { currentLanguage } = useLanguage();
    const [content, setContent] = useState(children);

    useEffect(() => {
        const translate = async () => {
            if (typeof children !== 'string') return;
            if (currentLanguage === 'en') {
                setContent(children);
                return;
            }
            const res = await translationService.translate(children, currentLanguage);
            setContent(res);
        };
        translate();
    }, [children, currentLanguage]);

    return <>{content}</>;
};
