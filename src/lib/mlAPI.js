// ML Model API Integration - Crop Recommendation Service
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

/**
 * Get crop recommendation from ML model
 * @param {Object} soilData - Soil parameters
 * @param {number} soilData.N - Nitrogen (kg/ha)
 * @param {number} soilData.P - Phosphorus (kg/ha)
 * @param {number} soilData.K - Potassium (kg/ha)
 * @param {number} soilData.temperature - Temperature (°C)
 * @param {number} soilData.humidity - Humidity (%)
 * @param {number} soilData.ph - pH level
 * @param {number} soilData.rainfall - Rainfall (mm)
 * @returns {Promise<Object>} Crop recommendation with confidence
 */
export const getCropRecommendationFromML = async (soilData) => {
    try {
        const response = await fetch(`${ML_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(soilData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get crop recommendation');
        }

        const data = await response.json();
        return {
            crop: data.crop,
            confidence: data.confidence,
            allPredictions: data.all_predictions
        };
    } catch (error) {
        console.error('ML API Error:', error);
        throw error;
    }
};

/**
 * Get batch crop recommendations
 * @param {Array<Object>} soilDataList - Array of soil parameter objects
 * @returns {Promise<Array>} Array of crop recommendations
 */
export const getBatchCropRecommendations = async (soilDataList) => {
    try {
        const response = await fetch(`${ML_API_URL}/batch-predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(soilDataList)
        });

        if (!response.ok) {
            throw new Error('Failed to get batch predictions');
        }

        const data = await response.json();
        return data.predictions;
    } catch (error) {
        console.error('ML Batch API Error:', error);
        throw error;
    }
};

/**
 * Check ML API health
 * @returns {Promise<Object>} API health status
 */
export const checkMLAPIHealth = async () => {
    try {
        const response = await fetch(`${ML_API_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error('ML API Health Check Failed:', error);
        return { status: 'offline', model_status: 'unknown' };
    }
};

/**
 * Convert card data to ML model input format
 * @param {Object} cardData - Soil health card data
 * @param {Object} weather - Weather data
 * @returns {Object} ML model input
 */
export const convertCardDataToMLInput = (cardData, weather) => {
    // Parse NPK values
    const npkParts = cardData.npk.split(':');
    const N = parseFloat(npkParts[0]) || 120;
    const P = parseFloat(npkParts[1]) || 60;
    const K = parseFloat(npkParts[2]) || 80;

    return {
        N: N,
        P: P,
        K: K,
        temperature: weather?.temp || 28,
        humidity: weather?.humidity || 70,
        ph: parseFloat(cardData.ph) || 7.0,
        rainfall: weather?.rainfall || 1000  // Annual rainfall estimate
    };
};

/**
 * Get enhanced crop recommendations using ML model
 * @param {Object} cardData - Soil health card
 * @param {Object} weather - Weather data
 * @param {number} topN - Number of top recommendations
 * @returns {Promise<Array>} Enhanced crop recommendations
 */
export const getEnhancedCropRecommendations = async (cardData, weather, topN = 5) => {
    try {
        // First, try ML model
        const mlInput = convertCardDataToMLInput(cardData, weather);
        const mlResult = await getCropRecommendationFromML(mlInput);

        // Format ML predictions
        const recommendations = [];

        // Add top prediction with highest confidence
        recommendations.push({
            crop: mlResult.crop,
            suitability: Math.round(mlResult.confidence * 100),
            reason: `ML Model Prediction (${(mlResult.confidence * 100).toFixed(1)}% confidence)`,
            source: 'ML',
            requirements: {
                N: mlInput.N,
                P: mlInput.P,
                K: mlInput.K,
                ph: mlInput.ph
            }
        });

        // Add other top predictions
        if (mlResult.allPredictions) {
            Object.entries(mlResult.allPredictions)
                .slice(1, topN)  // Skip first one (already added)
                .forEach(([crop, confidence]) => {
                    recommendations.push({
                        crop: crop,
                        suitability: Math.round(confidence * 100),
                        reason: `Alternative recommendation (${(confidence * 100).toFixed(1)}% confidence)`,
                        source: 'ML',
                        requirements: {
                            N: mlInput.N,
                            P: mlInput.P,
                            K: mlInput.K,
                            ph: mlInput.ph
                        }
                    });
                });
        }

        return recommendations;
    } catch (error) {
        console.error('ML recommendation failed:', error);
        throw new Error('ML Model Service Unavailable. Please ensure the backend is running.');
    }
};
