// SMS Notification System (Mock Mode)
// Simulates Twilio SMS for demo purposes

class SMSService {
    constructor() {
        this.mockMode = import.meta.env.VITE_SMS_MOCK_MODE === 'true';
        this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
        this.authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
        this.fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
        this.sentMessages = [];
    }

    // Send SMS (mock or real)
    async sendSMS(to, message) {
        if (this.mockMode) {
            return this.sendMockSMS(to, message);
        }

        // Real Twilio implementation (requires backend)
        // For security, Twilio should be called from backend, not frontend
        console.warn('Real SMS sending requires backend implementation');
        return this.sendMockSMS(to, message);
    }

    // Mock SMS sending
    sendMockSMS(to, message) {
        const smsRecord = {
            id: `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            to,
            from: this.fromNumber,
            message,
            status: 'delivered',
            timestamp: new Date(),
            mock: true
        };

        this.sentMessages.push(smsRecord);

        // Limit stored messages
        if (this.sentMessages.length > 100) {
            this.sentMessages.shift();
        }

        // Store in localStorage for persistence
        this.saveTolocalStorage();

        console.log('📱 Mock SMS Sent:', smsRecord);

        return {
            success: true,
            messageId: smsRecord.id,
            status: 'delivered',
            mock: true
        };
    }

    // Get SMS templates
    getTemplate(type, data = {}) {
        const templates = {
            weather_alert: `🌦️ Weather Alert: ${data.message}. Take necessary precautions for your crops. - GreenCoders`,

            pest_alert: `🐛 Pest Alert: ${data.pestType} detected in ${data.location}. ${data.action}. - GreenCoders`,

            irrigation_reminder: `💧 Irrigation Reminder: Water your ${data.crop} today. Optimal time: ${data.time}. - GreenCoders`,

            fertilizer_reminder: `🌱 Fertilizer Alert: Apply ${data.fertilizerType} to your ${data.crop}. Quantity: ${data.quantity}. - GreenCoders`,

            market_price: `💰 Market Update: ${data.crop} price is ₹${data.price}/${data.unit} (${data.change}%). Best time to sell: ${data.recommendation}. - GreenCoders`,

            sowing_reminder: `🌾 Sowing Reminder: Optimal time to sow ${data.crop} is approaching. Prepare your field. - GreenCoders`,

            harvest_reminder: `🎉 Harvest Alert: Your ${data.crop} is ready for harvest. Expected yield: ${data.yield}. - GreenCoders`,

            soil_health: `📊 Soil Health Update: pH: ${data.ph}, NPK: ${data.npk}. ${data.recommendation}. - GreenCoders`,

            general: data.message || 'Update from GreenCoders Smart Farming System'
        };

        return templates[type] || templates.general;
    }

    // Send templated SMS
    async sendTemplatedSMS(to, templateType, data) {
        const message = this.getTemplate(templateType, data);
        return this.sendSMS(to, message);
    }

    // Send bulk SMS
    async sendBulkSMS(recipients, message) {
        const results = [];

        for (const recipient of recipients) {
            const result = await this.sendSMS(recipient, message);
            results.push({ to: recipient, ...result });
        }

        return {
            success: true,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    // Get sent messages history
    getHistory(limit = 50) {
        return this.sentMessages
            .slice(-limit)
            .reverse();
    }

    // Get messages for specific number
    getMessagesFor(phoneNumber) {
        return this.sentMessages
            .filter(msg => msg.to === phoneNumber)
            .reverse();
    }

    // Save to localStorage
    saveTolocalStorage() {
        try {
            localStorage.setItem('sms_history', JSON.stringify(this.sentMessages));
        } catch (error) {
            console.error('Failed to save SMS history:', error);
        }
    }

    // Load from localStorage
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('sms_history');
            if (stored) {
                this.sentMessages = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load SMS history:', error);
        }
    }

    // Clear history
    clearHistory() {
        this.sentMessages = [];
        localStorage.removeItem('sms_history');
    }

    // Validate phone number
    validatePhoneNumber(phone) {
        // Indian phone number format: +91XXXXXXXXXX or 10 digits
        const indianPattern = /^(\+91)?[6-9]\d{9}$/;
        return indianPattern.test(phone.replace(/\s/g, ''));
    }

    // Format phone number
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91${cleaned}`;
        }
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return `+${cleaned}`;
        }
        return phone;
    }
}

// Create singleton instance
const smsService = new SMSService();
smsService.loadFromLocalStorage();

export default smsService;
export { SMSService };
