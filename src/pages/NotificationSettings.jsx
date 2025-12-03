// Notification Settings Page
import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Save, CheckCircle } from 'lucide-react';
import smsService from '../lib/twilioSMS';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
    const { userProfile } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [preferences, setPreferences] = useState({
        weather: true,
        pest: true,
        irrigation: true,
        fertilizer: true,
        market: false,
        sowing: true,
        harvest: true
    });
    const [saved, setSaved] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Load saved preferences
        const savedPrefs = localStorage.getItem('notification_preferences');
        if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
        }

        const savedPhone = localStorage.getItem('notification_phone');
        if (savedPhone) {
            setPhoneNumber(savedPhone);
        }

        // Load SMS history
        const smsHistory = smsService.getHistory(20);
        setHistory(smsHistory);
    }, []);

    const handleSave = () => {
        // Validate phone number
        if (phoneNumber && !smsService.validatePhoneNumber(phoneNumber)) {
            alert('Please enter a valid Indian phone number');
            return;
        }

        // Save preferences
        localStorage.setItem('notification_preferences', JSON.stringify(preferences));

        if (phoneNumber) {
            const formatted = smsService.formatPhoneNumber(phoneNumber);
            localStorage.setItem('notification_phone', formatted);
            setPhoneNumber(formatted);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const sendTestSMS = async () => {
        if (!phoneNumber) {
            alert('Please enter a phone number first');
            return;
        }

        const result = await smsService.sendSMS(
            phoneNumber,
            '🌱 Test notification from GreenCoders Smart Farming System. Your alerts are configured successfully!'
        );

        if (result.success) {
            alert(result.mock ? 'Test SMS sent successfully! (Mock mode)' : 'Test SMS sent successfully!');
            // Reload history
            setHistory(smsService.getHistory(20));
        } else {
            alert('Failed to send test SMS');
        }
    };

    const togglePreference = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const notificationTypes = [
        { key: 'weather', label: 'Weather Alerts', description: 'Extreme weather warnings and forecasts', icon: '🌦️' },
        { key: 'pest', label: 'Pest Alerts', description: 'Pest and disease warnings', icon: '🐛' },
        { key: 'irrigation', label: 'Irrigation Reminders', description: 'Watering schedule notifications', icon: '💧' },
        { key: 'fertilizer', label: 'Fertilizer Alerts', description: 'Fertilizer application reminders', icon: '🌱' },
        { key: 'market', label: 'Market Updates', description: 'Price changes and trends', icon: '💰' },
        { key: 'sowing', label: 'Sowing Reminders', description: 'Optimal sowing time alerts', icon: '🌾' },
        { key: 'harvest', label: 'Harvest Alerts', description: 'Harvest readiness notifications', icon: '🎉' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-1">Notification Settings</h1>
                <p className="text-blue-100">Manage your SMS alerts and preferences</p>
            </div>

            {/* Phone Number */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Phone Number</h2>

                <div className="flex gap-3">
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 XXXXXXXXXX"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={sendTestSMS}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        Send Test
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                    Enter your mobile number to receive SMS notifications
                </p>

                {import.meta.env.VITE_SMS_MOCK_MODE === 'true' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        ℹ️ Running in mock mode. SMS will be logged locally instead of being sent.
                    </div>
                )}
            </div>

            {/* Notification Preferences */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Alert Preferences</h2>

                <div className="space-y-3">
                    {notificationTypes.map((type) => (
                        <div
                            key={type.key}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center flex-1">
                                <span className="text-2xl mr-3">{type.icon}</span>
                                <div>
                                    <div className="font-semibold text-gray-800">{type.label}</div>
                                    <div className="text-sm text-gray-600">{type.description}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => togglePreference(type.key)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences[type.key] ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                    {saved ? (
                        <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Preferences
                        </>
                    )}
                </button>
            </div>

            {/* Notification History */}
            {history.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Notifications</h2>

                    <div className="space-y-3">
                        {history.slice(0, 10).map((msg) => (
                            <div key={msg.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MessageSquare className="w-4 h-4 mr-1" />
                                        {msg.to}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(msg.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-700">{msg.message}</div>
                                {msg.mock && (
                                    <div className="mt-2 text-xs text-blue-600">
                                        📱 Mock SMS (not actually sent)
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
