// Gemini Vision API for Pest & Disease Detection
// Image analysis using Google Gemini Vision

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

class GeminiVisionService {
    constructor() {
        this.detectionHistory = [];
    }

    // Analyze crop image for pests and diseases
    async analyzeCropImage(imageData, language = 'en') {
        try {
            // Convert base64 to blob if needed, but backend expects multipart form data
            // If imageData is base64 string, we need to convert it to a file object

            const formData = new FormData();
            formData.append('language', language);

            if (imageData.startsWith('data:image')) {
                // Convert base64 to blob
                const response = await fetch(imageData);
                const blob = await response.blob();
                formData.append('image', blob, 'image.jpg');
            } else {
                // Assume it's a URL or handle accordingly, but for now we expect base64 from camera/upload
                throw new Error('Invalid image format');
            }

            const response = await fetch(`${API_URL}/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to analyze image');
            }

            const data = await response.json();
            const analysisText = data.analysis;

            // Parse the response
            const analysis = this.parseAnalysisResponse(analysisText);

            // Save to history
            const record = {
                id: `detection_${Date.now()}`,
                timestamp: new Date(),
                analysis,
                language,
                imagePreview: imageData.substring(0, 100) + '...'
            };

            this.detectionHistory.push(record);
            this.saveHistory();

            return {
                success: true,
                ...analysis,
                detectionId: record.id
            };
        } catch (error) {
            console.error('Gemini Vision error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get analysis prompt based on language
    getAnalysisPrompt(language) {
        const prompts = {
            en: `Analyze this crop/plant image and provide:
1. **Crop Type**: Identify the crop or plant
2. **Health Status**: Overall health (Healthy/Diseased/Pest-affected)
3. **Disease/Pest Detected**: Name of disease or pest (if any)
4. **Confidence**: Your confidence level (0-100%)
5. **Symptoms**: Visible symptoms or signs
6. **Treatment**: Recommended treatment or preventive measures
7. **Severity**: Low/Medium/High
8. **Organic Solutions**: Natural/organic treatment options

Format your response clearly with these headings. Be specific and practical.`,

            hi: `इस फसल/पौधे की छवि का विश्लेषण करें और प्रदान करें:
1. **फसल का प्रकार**: फसल या पौधे की पहचान करें
2. **स्वास्थ्य स्थिति**: समग्र स्वास्थ्य (स्वस्थ/रोगग्रस्त/कीट-प्रभावित)
3. **रोग/कीट का पता लगाया**: रोग या कीट का नाम (यदि कोई हो)
4. **विश्वास**: आपका विश्वास स्तर (0-100%)
5. **लक्षण**: दिखाई देने वाले लक्षण या संकेत
6. **उपचार**: अनुशंसित उपचार या निवारक उपाय
7. **गंभीरता**: कम/मध्यम/उच्च
8. **जैविक समाधान**: प्राकृतिक/जैविक उपचार विकल्प

इन शीर्षकों के साथ अपनी प्रतिक्रिया स्पष्ट रूप से प्रारूपित करें।`
        };

        return prompts[language] || prompts.en;
    }

    // Parse Gemini response
    parseAnalysisResponse(text) {
        const analysis = {
            cropType: 'Unknown',
            healthStatus: 'Unknown',
            diseaseOrPest: 'None detected',
            confidence: 0,
            symptoms: [],
            treatment: '',
            severity: 'Unknown',
            organicSolutions: '',
            fullReport: text
        };

        try {
            // Extract crop type
            const cropMatch = text.match(/(?:Crop Type|फसल का प्रकार)[:\s]*([^\n]+)/i);
            if (cropMatch) analysis.cropType = cropMatch[1].trim();

            // Extract health status
            const healthMatch = text.match(/(?:Health Status|स्वास्थ्य स्थिति)[:\s]*([^\n]+)/i);
            if (healthMatch) analysis.healthStatus = healthMatch[1].trim();

            // Extract disease/pest
            const diseaseMatch = text.match(/(?:Disease\/Pest Detected|रोग\/कीट का पता लगाया)[:\s]*([^\n]+)/i);
            if (diseaseMatch) analysis.diseaseOrPest = diseaseMatch[1].trim();

            // Extract confidence
            const confidenceMatch = text.match(/(?:Confidence|विश्वास)[:\s]*(\d+)/i);
            if (confidenceMatch) analysis.confidence = parseInt(confidenceMatch[1]);

            // Extract severity
            const severityMatch = text.match(/(?:Severity|गंभीरता)[:\s]*([^\n]+)/i);
            if (severityMatch) analysis.severity = severityMatch[1].trim();

            // Extract symptoms
            const symptomsMatch = text.match(/(?:Symptoms|लक्षण)[:\s]*([^\n]+(?:\n(?!##)[^\n]+)*)/i);
            if (symptomsMatch) {
                analysis.symptoms = symptomsMatch[1]
                    .split(/[,\n]/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
            }

            // Extract treatment
            const treatmentMatch = text.match(/(?:Treatment|उपचार)[:\s]*([^\n]+(?:\n(?!##)[^\n]+)*)/i);
            if (treatmentMatch) analysis.treatment = treatmentMatch[1].trim();

            // Extract organic solutions
            const organicMatch = text.match(/(?:Organic Solutions|जैविक समाधान)[:\s]*([^\n]+(?:\n(?!##)[^\n]+)*)/i);
            if (organicMatch) analysis.organicSolutions = organicMatch[1].trim();

        } catch (error) {
            console.error('Error parsing analysis:', error);
        }

        return analysis;
    }

    // Prepare image for API
    async prepareImage(imageData) {
        // If already base64, extract data
        if (imageData.startsWith('data:image')) {
            return imageData.split(',')[1];
        }
        return imageData;
    }

    // Get detection history
    getHistory(limit = 20) {
        return this.detectionHistory
            .slice(-limit)
            .reverse();
    }

    // Save history to localStorage
    saveHistory() {
        try {
            const historyToSave = this.detectionHistory.map(record => ({
                ...record,
                imagePreview: record.imagePreview // Keep only preview
            }));
            localStorage.setItem('pest_detection_history', JSON.stringify(historyToSave));
        } catch (error) {
            console.error('Failed to save detection history:', error);
        }
    }

    // Load history from localStorage
    loadHistory() {
        try {
            const stored = localStorage.getItem('pest_detection_history');
            if (stored) {
                this.detectionHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load detection history:', error);
        }
    }

    // Clear history
    clearHistory() {
        this.detectionHistory = [];
        localStorage.removeItem('pest_detection_history');
    }

    // Get pest alert based on weather and crop
    getPestAlert(weather, cropType, location) {
        const alerts = [];

        // High humidity pest risks
        if (weather.humidity > 70) {
            alerts.push({
                severity: 'medium',
                pest: 'Fungal diseases',
                message: `High humidity (${weather.humidity}%) increases risk of fungal diseases in ${cropType}`,
                prevention: 'Ensure good air circulation, avoid overhead irrigation'
            });
        }

        // Temperature-based alerts
        if (weather.temp > 30 && weather.temp < 35) {
            alerts.push({
                severity: 'medium',
                pest: 'Aphids and whiteflies',
                message: `Temperature (${weather.temp}°C) is optimal for aphid and whitefly activity`,
                prevention: 'Monitor plants regularly, use neem oil spray if needed'
            });
        }

        // Monsoon season alerts
        const month = new Date().getMonth();
        if (month >= 5 && month <= 9) {
            alerts.push({
                severity: 'high',
                pest: 'Stem borers and leaf folders',
                message: 'Monsoon season: High risk of stem borers in rice and other crops',
                prevention: 'Use pheromone traps, maintain field hygiene'
            });
        }

        return alerts;
    }
}

// Create singleton instance
const geminiVisionService = new GeminiVisionService();
geminiVisionService.loadHistory();

export default geminiVisionService;
export { GeminiVisionService };
