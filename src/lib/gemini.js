const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const generateRecommendations = async (soilData) => {
    try {
        const response = await fetch(`${API_URL}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ soilData }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        return data.recommendation;
    } catch (error) {
        console.error("Recommendation error:", error);
        return "Apply balanced NPK fertilizer. Add organic compost to improve soil health. Consider crops suitable for your soil pH level.";
    }
};

export const chatWithAssistant = async (userMessage) => {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch chat response');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Chat error:", error.message);
        return "I'm having trouble right now. Please try asking your question again.";
    }
};
