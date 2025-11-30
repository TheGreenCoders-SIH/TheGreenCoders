// IoT Dashboard Component - Real-time Sensor Data Display
import React, { useState, useEffect } from 'react';
import { Activity, Droplets, Thermometer, Wind, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import iotSimulator from '../lib/iotSimulation';
import { motion } from 'framer-motion';

export default function IoTDashboard({ farmerId, location }) {
    const [sensors, setSensors] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);

    useEffect(() => {
        if (!farmerId) return;

        // Initialize sensors
        iotSimulator.initializeSensors(farmerId, location);
        iotSimulator.generateHistoricalData(farmerId, 7);

        // Start real-time updates
        iotSimulator.startRealTimeUpdates(5);

        // Update UI every 5 seconds
        const interval = setInterval(() => {
            const currentReadings = iotSimulator.getCurrentReadings(farmerId);
            setSensors(currentReadings);

            const currentAlerts = iotSimulator.getAlerts(farmerId);
            setAlerts(currentAlerts);
        }, 5000);

        // Initial load
        const currentReadings = iotSimulator.getCurrentReadings(farmerId);
        setSensors(currentReadings);
        setAlerts(iotSimulator.getAlerts(farmerId));

        return () => {
            clearInterval(interval);
            iotSimulator.stopRealTimeUpdates();
        };
    }, [farmerId, location]);

    const getSensorIcon = (type) => {
        switch (type) {
            case 'soil_moisture': return <Droplets className="w-5 h-5" />;
            case 'temperature': return <Thermometer className="w-5 h-5" />;
            case 'humidity': return <Wind className="w-5 h-5" />;
            case 'soil_temp': return <Activity className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'optimal': return 'text-green-600 bg-green-50';
            case 'good': return 'text-blue-600 bg-blue-50';
            case 'warning': return 'text-yellow-600 bg-yellow-50';
            case 'critical': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'online') return <CheckCircle className="w-4 h-4 text-green-500" />;
        return <XCircle className="w-4 h-4 text-red-500" />;
    };

    // Prepare chart data for selected sensor
    const getChartData = (sensorId) => {
        const history = iotSimulator.getHistory(sensorId, 24);

        return {
            labels: history.map(h => new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
            datasets: [{
                label: 'Value',
                data: history.map(h => h.value),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">IoT Sensor Dashboard</h3>
                <div className="flex items-center text-sm text-gray-600">
                    <Activity className="w-4 h-4 mr-1 animate-pulse text-green-500" />
                    Live Updates
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-orange-800 mb-2">Active Alerts</h4>
                            <ul className="space-y-1">
                                {alerts.slice(0, 3).map((alert, idx) => (
                                    <li key={idx} className="text-sm text-orange-700">
                                        • {alert.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Sensor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sensors.map((sensor) => (
                    <motion.div
                        key={sensor.id}
                        whileHover={{ y: -5 }}
                        onClick={() => setSelectedSensor(sensor.id)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg ${getStatusColor(sensor.currentReading?.status || 'good')}`}>
                                {getSensorIcon(sensor.type)}
                            </div>
                            {getStatusIcon(sensor.status)}
                        </div>

                        <h4 className="font-semibold text-gray-700 mb-1 capitalize">
                            {sensor.type.replace('_', ' ')}
                        </h4>

                        {sensor.currentReading ? (
                            <>
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {sensor.currentReading.value}{sensor.currentReading.unit}
                                </div>
                                <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${getStatusColor(sensor.currentReading.status)}`}>
                                    {sensor.currentReading.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    Optimal: {sensor.currentReading.optimal}{sensor.currentReading.unit}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-500">No data</div>
                        )}

                        <div className="text-xs text-gray-400 mt-2">
                            Updated: {new Date(sensor.lastUpdate).toLocaleTimeString()}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Historical Chart */}
            {selectedSensor && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">
                            {sensors.find(s => s.id === selectedSensor)?.type.replace('_', ' ')} - Last 24 Hours
                        </h4>
                        <button
                            onClick={() => setSelectedSensor(null)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                    <div className="h-64">
                        <Line
                            data={getChartData(selectedSensor)}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: { beginAtZero: false }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
