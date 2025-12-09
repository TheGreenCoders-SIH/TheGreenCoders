
const CACHE_KEY = 'translation_cache_v1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Helper to get cache
const getCache = () => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
        return {};
    }
};

// Helper to set cache
const setCache = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('Translation cache full or disabled', e);
    }
};

// Check cache for specific text and language
export const checkCache = (text, targetLang) => {
    const cache = getCache();
    const key = `${text}_${targetLang}`;
    const entry = cache[key];

    if (entry && (Date.now() - entry.ts < CACHE_DURATION)) {
        return entry.val;
    }
    return null;
};

// Save to cache
const saveToCache = (text, targetLang, translatedText) => {
    const cache = getCache();
    const key = `${text}_${targetLang}`;
    cache[key] = {
        val: translatedText,
        ts: Date.now()
    };
    setCache(cache);
};

// API 1: MyMemory (Free, limit 500/day per IP roughly)
const translateMyMemory = async (text, targetLang) => {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.responseStatus === 200) {
            return data.responseData.translatedText;
        }
        throw new Error('MyMemory API Error');
    } catch (e) {
        throw e;
    }
};

// API 2: LibreTranslate (Public Mirror Fallback)
const translateLibre = async (text, targetLang) => {
    try {
        // Using a common public instance, might need rotation or specific URL
        const res = await fetch("https://libretranslate.de/translate", {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: "en",
                target: targetLang,
                format: "text"
            }),
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        return data.translatedText;
    } catch (e) {
        throw e;
    }
};

export const fetchTranslation = async (text, targetLang) => {
    if (targetLang === 'en') return text;

    // Check Cache First
    const cached = checkCache(text, targetLang);
    if (cached) return cached;

    try {
        // Try MyMemory
        const result = await translateMyMemory(text, targetLang);
        if (result) {
            saveToCache(text, targetLang, result);
            return result;
        }
    } catch (err) {
        console.warn('MyMemory failed, trying fallback...');
        try {
            // Try LibreTranslate
            const result = await translateLibre(text, targetLang);
            if (result) {
                saveToCache(text, targetLang, result);
                return result;
            }
        } catch (err2) {
            console.error('All translation APIs failed', err2);
        }
    }

    // Return original if all fails
    return text;
};
