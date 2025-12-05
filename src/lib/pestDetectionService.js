/**
 * Disease Detection Service
 * Handles API calls for disease detection and treatment recommendations
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class DiseaseDetectionService {
    constructor() {
        this.HISTORY_KEY = 'disease_detection_history';
        this.MAX_HISTORY = 20;
    }

    /**
     * Detect disease in an image
     * @param {string} imageBase64 - Base64 encoded image
     * @returns {Promise<Object>} Detection result
     */
    async detectDisease(imageBase64) {
        try {
            const formData = new FormData();
            formData.append('image_base64', imageBase64);

            const response = await fetch(`${API_BASE_URL}/detect-disease`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Disease detection error:', error);
            return {
                success: false,
                error: error.message || 'Failed to detect disease'
            };
        }
    }

    /**
     * Get treatment recommendations for a disease
     * @param {string} diseaseName - Name of the detected disease
     * @returns {Promise<Object>} Treatment recommendations
     */
    async getTreatmentRecommendations(diseaseName) {
        try {
            const formData = new FormData();
            formData.append('disease_name', diseaseName);

            const response = await fetch(`${API_BASE_URL}/disease-treatment`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Treatment recommendation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to get treatment recommendations'
            };
        }
    }

    /**
     * Save detection to history
     * @param {Object} detection - Detection result with image
     */
    saveToHistory(detection) {
        try {
            const history = this.getHistory();
            const record = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                disease: detection.prediction,
                confidence: detection.confidence,
                image: detection.image, // Base64 image
                selectedModel: detection.selected_model,
            };

            history.unshift(record);
            const trimmedHistory = history.slice(0, this.MAX_HISTORY);
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmedHistory));
        } catch (error) {
            console.error('Failed to save to history:', error);
        }
    }

    /**
     * Get detection history
     * @returns {Array} Array of detection records
     */
    getHistory() {
        try {
            const historyJson = localStorage.getItem(this.HISTORY_KEY);
            return historyJson ? JSON.parse(historyJson) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    /**
     * Clear detection history
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.HISTORY_KEY);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }
}

export default new DiseaseDetectionService();
