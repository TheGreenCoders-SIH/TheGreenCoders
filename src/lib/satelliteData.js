// Satellite Data Integration
// NASA POWER API + Mock NDVI visualization

class SatelliteDataService {
    constructor() {
        this.nasaPowerURL = import.meta.env.VITE_NASA_POWER_API_URL;
        this.mockMode = import.meta.env.VITE_SENTINEL_MOCK_MODE === 'true';
        this.cache = new Map();
    }

    // Get NASA POWER data for location
    async getNASAPowerData(latitude, longitude, startDate, endDate) {
        const cacheKey = `nasa_${latitude}_${longitude}_${startDate}_${endDate}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // NASA POWER API parameters
            const parameters = [
                'T2M',          // Temperature at 2 Meters
                'T2M_MAX',      // Maximum Temperature
                'T2M_MIN',      // Minimum Temperature
                'PRECTOTCORR',  // Precipitation
                'RH2M',         // Relative Humidity
                'ALLSKY_SFC_SW_DWN', // Solar Radiation
                'WS2M'          // Wind Speed
            ].join(',');

            const url = `${this.nasaPowerURL}?parameters=${parameters}&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDate}&end=${endDate}&format=JSON`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('NASA POWER API error');
            }

            const data = await response.json();

            const processedData = {
                location: { latitude, longitude },
                dateRange: { start: startDate, end: endDate },
                parameters: data.parameters,
                properties: data.properties,
                data: this.processNASAData(data.properties.parameter)
            };

            this.cache.set(cacheKey, processedData);
            return processedData;
        } catch (error) {
            console.error('NASA POWER API error:', error);
            return this.getMockNASAData(latitude, longitude, startDate, endDate);
        }
    }

    // Process NASA data into usable format
    processNASAData(parameters) {
        const processed = {};

        Object.keys(parameters).forEach(param => {
            const values = parameters[param];
            const dataPoints = Object.entries(values).map(([date, value]) => ({
                date,
                value: typeof value === 'number' ? parseFloat(value.toFixed(2)) : null
            }));

            processed[param] = {
                values: dataPoints,
                average: this.calculateAverage(dataPoints.map(d => d.value)),
                min: Math.min(...dataPoints.map(d => d.value).filter(v => v !== null)),
                max: Math.max(...dataPoints.map(d => d.value).filter(v => v !== null))
            };
        });

        return processed;
    }

    calculateAverage(values) {
        const validValues = values.filter(v => v !== null && !isNaN(v));
        if (validValues.length === 0) return 0;
        return parseFloat((validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2));
    }

    // Get mock NASA data
    getMockNASAData(latitude, longitude, startDate, endDate) {
        const days = this.getDaysBetween(startDate, endDate);
        const data = {
            T2M: { values: [], average: 28.5, min: 22, max: 35 },
            T2M_MAX: { values: [], average: 33.2, min: 28, max: 38 },
            T2M_MIN: { values: [], average: 23.8, min: 18, max: 28 },
            PRECTOTCORR: { values: [], average: 2.5, min: 0, max: 15 },
            RH2M: { values: [], average: 65, min: 45, max: 85 },
            ALLSKY_SFC_SW_DWN: { values: [], average: 5.8, min: 3.5, max: 7.2 },
            WS2M: { values: [], average: 3.2, min: 1.5, max: 6.5 }
        };

        // Generate mock daily data
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

            Object.keys(data).forEach(param => {
                const { min, max } = data[param];
                const value = min + Math.random() * (max - min);
                data[param].values.push({
                    date: dateStr,
                    value: parseFloat(value.toFixed(2))
                });
            });
        }

        return data;
    }

    getDaysBetween(start, end) {
        const startDate = new Date(start.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
        const endDate = new Date(end.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Generate mock NDVI data (since we don't have Sentinel Hub)
    generateMockNDVI(latitude, longitude, farmSize = 2.5) {
        // NDVI ranges from -1 to 1, healthy vegetation is 0.6-0.9
        const gridSize = 10; // 10x10 grid
        const ndviGrid = [];

        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                // Generate realistic NDVI values with some variation
                const baseNDVI = 0.65 + Math.random() * 0.25; // 0.65 to 0.9
                const noise = (Math.random() - 0.5) * 0.1;
                const ndvi = Math.max(0.3, Math.min(0.95, baseNDVI + noise));

                row.push({
                    x: i,
                    y: j,
                    ndvi: parseFloat(ndvi.toFixed(3)),
                    health: this.getNDVIHealthStatus(ndvi),
                    lat: latitude + (i - gridSize / 2) * 0.0001,
                    lon: longitude + (j - gridSize / 2) * 0.0001
                });
            }
            ndviGrid.push(row);
        }

        return {
            location: { latitude, longitude },
            farmSize,
            gridSize,
            grid: ndviGrid,
            statistics: this.calculateNDVIStatistics(ndviGrid),
            timestamp: new Date().toISOString()
        };
    }

    getNDVIHealthStatus(ndvi) {
        if (ndvi >= 0.8) return { status: 'excellent', color: '#006400' };
        if (ndvi >= 0.6) return { status: 'good', color: '#228B22' };
        if (ndvi >= 0.4) return { status: 'moderate', color: '#FFD700' };
        if (ndvi >= 0.2) return { status: 'poor', color: '#FFA500' };
        return { status: 'critical', color: '#FF4500' };
    }

    calculateNDVIStatistics(grid) {
        const allValues = grid.flat().map(cell => cell.ndvi);
        const healthCounts = { excellent: 0, good: 0, moderate: 0, poor: 0, critical: 0 };

        grid.flat().forEach(cell => {
            healthCounts[cell.health.status]++;
        });

        return {
            average: this.calculateAverage(allValues),
            min: Math.min(...allValues),
            max: Math.max(...allValues),
            healthDistribution: healthCounts,
            totalCells: allValues.length
        };
    }

    // Get historical NDVI trend (mock)
    getHistoricalNDVI(latitude, longitude, months = 6) {
        const trend = [];
        const now = new Date();

        for (let i = months; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);

            // Simulate seasonal variation
            const month = date.getMonth();
            let baseNDVI = 0.65;

            // Higher NDVI in monsoon/post-monsoon (June-Oct)
            if (month >= 5 && month <= 9) {
                baseNDVI = 0.75;
            }
            // Lower in summer (March-May)
            else if (month >= 2 && month <= 4) {
                baseNDVI = 0.55;
            }

            const ndvi = baseNDVI + (Math.random() - 0.5) * 0.1;

            trend.push({
                date: date.toISOString().split('T')[0],
                ndvi: parseFloat(ndvi.toFixed(3)),
                health: this.getNDVIHealthStatus(ndvi).status
            });
        }

        return trend;
    }

    // Get crop health insights from NDVI
    getCropHealthInsights(ndviData) {
        const { statistics } = ndviData;
        const insights = [];

        if (statistics.average >= 0.7) {
            insights.push({
                type: 'positive',
                message: 'Excellent crop health detected. Vegetation is thriving.',
                recommendation: 'Maintain current irrigation and fertilization schedule.'
            });
        } else if (statistics.average >= 0.5) {
            insights.push({
                type: 'neutral',
                message: 'Moderate crop health. Some areas need attention.',
                recommendation: 'Check soil moisture and consider targeted fertilization.'
            });
        } else {
            insights.push({
                type: 'warning',
                message: 'Low vegetation health detected.',
                recommendation: 'Immediate action needed: Check for pests, diseases, or water stress.'
            });
        }

        // Check for variation
        const variation = statistics.max - statistics.min;
        if (variation > 0.3) {
            insights.push({
                type: 'warning',
                message: 'High variation in crop health across the field.',
                recommendation: 'Inspect areas with low NDVI for specific issues.'
            });
        }

        return insights;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const satelliteDataService = new SatelliteDataService();

export default satelliteDataService;
export { SatelliteDataService };
