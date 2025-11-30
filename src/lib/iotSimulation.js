// IoT Sensor Simulation System
// Generates realistic mock sensor data for demonstration purposes

class IoTSimulator {
    constructor() {
        this.sensors = new Map();
        this.updateInterval = null;
    }

    // Initialize sensors for a farmer
    initializeSensors(farmerId, location) {
        const sensorTypes = ['soil_moisture', 'temperature', 'humidity', 'soil_temp'];

        sensorTypes.forEach(type => {
            const sensorId = `${farmerId}_${type}`;
            this.sensors.set(sensorId, {
                id: sensorId,
                farmerId,
                type,
                location,
                status: 'online',
                lastUpdate: new Date(),
                history: []
            });
        });

        return Array.from(this.sensors.values()).filter(s => s.farmerId === farmerId);
    }

    // Generate realistic sensor reading
    generateReading(sensorType, previousValue = null) {
        const baseValues = {
            soil_moisture: { min: 20, max: 80, unit: '%', optimal: 60 },
            temperature: { min: 15, max: 45, unit: '°C', optimal: 28 },
            humidity: { min: 30, max: 90, unit: '%', optimal: 65 },
            soil_temp: { min: 18, max: 35, unit: '°C', optimal: 25 }
        };

        const config = baseValues[sensorType];
        if (!config) return null;

        // Generate value with slight variation from previous
        let value;
        if (previousValue !== null) {
            const variation = (Math.random() - 0.5) * 5; // ±2.5 variation
            value = previousValue + variation;
            value = Math.max(config.min, Math.min(config.max, value));
        } else {
            value = config.min + Math.random() * (config.max - config.min);
        }

        return {
            value: parseFloat(value.toFixed(1)),
            unit: config.unit,
            optimal: config.optimal,
            status: this.getStatus(value, config),
            timestamp: new Date()
        };
    }

    getStatus(value, config) {
        const deviation = Math.abs(value - config.optimal) / config.optimal;
        if (deviation < 0.1) return 'optimal';
        if (deviation < 0.25) return 'good';
        if (deviation < 0.4) return 'warning';
        return 'critical';
    }

    // Update all sensors with new readings
    updateAllSensors() {
        this.sensors.forEach((sensor, sensorId) => {
            const lastReading = sensor.history[sensor.history.length - 1];
            const previousValue = lastReading ? lastReading.value : null;

            const newReading = this.generateReading(sensor.type, previousValue);

            if (newReading) {
                sensor.history.push(newReading);
                sensor.lastUpdate = new Date();

                // Keep only last 100 readings
                if (sensor.history.length > 100) {
                    sensor.history.shift();
                }

                // Randomly set some sensors offline (5% chance)
                if (Math.random() < 0.05) {
                    sensor.status = 'offline';
                } else {
                    sensor.status = 'online';
                }
            }
        });
    }

    // Get current readings for a farmer
    getCurrentReadings(farmerId) {
        const farmerSensors = Array.from(this.sensors.values())
            .filter(s => s.farmerId === farmerId);

        return farmerSensors.map(sensor => ({
            id: sensor.id,
            type: sensor.type,
            location: sensor.location,
            status: sensor.status,
            lastUpdate: sensor.lastUpdate,
            currentReading: sensor.history[sensor.history.length - 1] || null
        }));
    }

    // Get historical data for a sensor
    getHistory(sensorId, hours = 24) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return [];

        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return sensor.history.filter(reading => reading.timestamp >= cutoffTime);
    }

    // Generate historical data for initial display
    generateHistoricalData(farmerId, days = 7) {
        const farmerSensors = Array.from(this.sensors.values())
            .filter(s => s.farmerId === farmerId);

        const now = new Date();
        const pointsPerDay = 24; // One reading per hour

        farmerSensors.forEach(sensor => {
            sensor.history = [];
            let previousValue = null;

            for (let i = days * pointsPerDay; i >= 0; i--) {
                const timestamp = new Date(now - i * 60 * 60 * 1000);
                const reading = this.generateReading(sensor.type, previousValue);

                if (reading) {
                    reading.timestamp = timestamp;
                    sensor.history.push(reading);
                    previousValue = reading.value;
                }
            }
        });
    }

    // Start real-time updates
    startRealTimeUpdates(intervalSeconds = 5) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.updateAllSensors();
        }, intervalSeconds * 1000);
    }

    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Get sensor alerts
    getAlerts(farmerId) {
        const readings = this.getCurrentReadings(farmerId);
        const alerts = [];

        readings.forEach(sensor => {
            if (!sensor.currentReading) return;

            const { status, value, unit, optimal } = sensor.currentReading;

            if (status === 'critical') {
                alerts.push({
                    severity: 'high',
                    sensor: sensor.type,
                    message: `${sensor.type.replace('_', ' ')} is ${status}: ${value}${unit} (optimal: ${optimal}${unit})`,
                    timestamp: sensor.lastUpdate
                });
            } else if (status === 'warning') {
                alerts.push({
                    severity: 'medium',
                    sensor: sensor.type,
                    message: `${sensor.type.replace('_', ' ')} needs attention: ${value}${unit}`,
                    timestamp: sensor.lastUpdate
                });
            }

            if (sensor.status === 'offline') {
                alerts.push({
                    severity: 'high',
                    sensor: sensor.type,
                    message: `Sensor ${sensor.type} is offline`,
                    timestamp: sensor.lastUpdate
                });
            }
        });

        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }
}

// Create singleton instance
const iotSimulator = new IoTSimulator();

export default iotSimulator;
export { IoTSimulator };
