// Enhanced Weather and Market API integration

// Get current weather data
export const getWeatherData = async (city = 'Delhi') => {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );

        if (!response.ok) {
            return getMockWeatherData();
        }

        const data = await response.json();
        return {
            temp: Math.round(data.main.temp),
            description: data.weather[0].main,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            pressure: data.main.pressure,
            alert: generateWeatherAlert(data)
        };
    } catch (error) {
        console.error('Weather API error:', error);
        return getMockWeatherData();
    }
};

// Get 7-day weather forecast
export const getWeatherForecast = async (city = 'Delhi') => {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&cnt=56`
        );

        if (!response.ok) {
            return getMockForecast();
        }

        const data = await response.json();

        // Group by day and get daily summary
        const dailyForecasts = [];
        const grouped = {};

        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });

        Object.keys(grouped).slice(0, 7).forEach(date => {
            const dayData = grouped[date];
            const temps = dayData.map(d => d.main.temp);
            const conditions = dayData.map(d => d.weather[0].main);
            const rainProb = dayData.reduce((sum, d) => sum + (d.pop || 0), 0) / dayData.length;

            dailyForecasts.push({
                date,
                tempMax: Math.round(Math.max(...temps)),
                tempMin: Math.round(Math.min(...temps)),
                condition: getMostFrequent(conditions),
                rainProbability: Math.round(rainProb * 100),
                humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
                windSpeed: Math.round(dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length)
            });
        });

        return dailyForecasts;
    } catch (error) {
        console.error('Forecast API error:', error);
        return getMockForecast();
    }
};

// Generate weather-based farming alert
function generateWeatherAlert(data) {
    const alerts = [];

    if (data.main.humidity > 70) {
        alerts.push('High humidity detected. Monitor crops for fungal diseases.');
    }

    if (data.main.temp > 35) {
        alerts.push('Extreme heat. Increase irrigation frequency.');
    }

    if (data.wind.speed > 10) {
        alerts.push('High wind speed. Secure crop supports and covers.');
    }

    if (data.main.temp < 10) {
        alerts.push('Low temperature. Protect sensitive crops from cold stress.');
    }

    return alerts.length > 0 ? alerts.join(' ') : 'Weather conditions are favorable for farming.';
}

// Get rain prediction and irrigation adjustment
export const getRainPrediction = async (city = 'Delhi') => {
    try {
        const forecast = await getWeatherForecast(city);
        const next3Days = forecast.slice(0, 3);

        const totalRainProb = next3Days.reduce((sum, day) => sum + day.rainProbability, 0) / 3;
        const highRainDays = next3Days.filter(day => day.rainProbability > 60);

        return {
            averageRainProbability: Math.round(totalRainProb),
            highRainDays: highRainDays.length,
            irrigationAdjustment: getIrrigationAdjustment(totalRainProb, highRainDays.length),
            forecast: next3Days
        };
    } catch (error) {
        console.error('Rain prediction error:', error);
        return {
            averageRainProbability: 30,
            highRainDays: 0,
            irrigationAdjustment: 'Continue normal irrigation schedule',
            forecast: getMockForecast().slice(0, 3)
        };
    }
};

function getIrrigationAdjustment(rainProb, highRainDays) {
    if (highRainDays >= 2) {
        return '🌧️ Skip irrigation for next 2-3 days. Heavy rain expected.';
    } else if (rainProb > 50) {
        return '☁️ Reduce irrigation by 50%. Moderate rain likely.';
    } else if (rainProb > 30) {
        return '🌤️ Monitor weather. Light rain possible.';
    } else {
        return '☀️ Continue normal irrigation schedule. No significant rain expected.';
    }
}

// Check for extreme weather events
export const getExtremeWeatherAlerts = async (city = 'Delhi') => {
    try {
        const forecast = await getWeatherForecast(city);
        const alerts = [];

        forecast.forEach(day => {
            if (day.tempMax > 40) {
                alerts.push({
                    severity: 'high',
                    type: 'heat_wave',
                    date: day.date,
                    message: `Heat wave warning: ${day.tempMax}°C expected`,
                    action: 'Increase irrigation, provide shade for sensitive crops'
                });
            }

            if (day.tempMin < 5) {
                alerts.push({
                    severity: 'high',
                    type: 'cold_wave',
                    date: day.date,
                    message: `Cold wave warning: ${day.tempMin}°C expected`,
                    action: 'Protect crops with covers, avoid irrigation in evening'
                });
            }

            if (day.rainProbability > 80) {
                alerts.push({
                    severity: 'medium',
                    type: 'heavy_rain',
                    date: day.date,
                    message: `Heavy rain expected: ${day.rainProbability}% probability`,
                    action: 'Ensure proper drainage, postpone fertilizer application'
                });
            }

            if (day.windSpeed > 15) {
                alerts.push({
                    severity: 'medium',
                    type: 'high_wind',
                    date: day.date,
                    message: `High wind speed: ${day.windSpeed} m/s`,
                    action: 'Secure tall crops, check for lodging risk'
                });
            }
        });

        return alerts;
    } catch (error) {
        console.error('Extreme weather alerts error:', error);
        return [];
    }
}

// Market data from AgMarkNet
export const getMarketPrices = async () => {
    try {
        // Real Agmarknet API integration
        // Note: Agmarknet API requires authentication and specific format
        // Using mock data for demo, but structure is ready for real API

        const apiKey = import.meta.env.VITE_DATA_GOV_API_KEY;

        // For real implementation:
        // const response = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=10`);

        // Mock data with realistic prices
        return [
            { crop: 'Wheat', price: 2125, change: 2.3, unit: 'q', market: 'Delhi', trend: 'up' },
            { crop: 'Rice', price: 1950, change: -1.2, unit: 'q', market: 'Delhi', trend: 'down' },
            { crop: 'Maize', price: 1800, change: 5.1, unit: 'q', market: 'Delhi', trend: 'up' },
            { crop: 'Cotton', price: 6500, change: 3.4, unit: 'q', market: 'Delhi', trend: 'up' },
            { crop: 'Sugarcane', price: 315, change: 0.5, unit: 'q', market: 'Delhi', trend: 'stable' },
            { crop: 'Soybean', price: 4200, change: 1.8, unit: 'q', market: 'Delhi', trend: 'up' },
            { crop: 'Chickpea', price: 5100, change: -0.8, unit: 'q', market: 'Delhi', trend: 'down' },
            { crop: 'Tomato', price: 1200, change: 15.2, unit: 'q', market: 'Delhi', trend: 'up' }
        ];
    } catch (error) {
        console.error('Market API error:', error);
        return [];
    }
};

// Get price trends for specific crop
export const getCropPriceTrend = async (cropName, days = 30) => {
    // Mock historical price data
    const trend = [];
    const basePrice = {
        wheat: 2100,
        rice: 1950,
        maize: 1750,
        cotton: 6300,
        soybean: 4100
    }[cropName.toLowerCase()] || 2000;

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const variation = (Math.random() - 0.5) * 200;
        const price = basePrice + variation;

        trend.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price),
            volume: Math.round(1000 + Math.random() * 500)
        });
    }

    return trend;
};

// Predict best selling time
export const predictBestSellingTime = (priceTrend) => {
    if (!priceTrend || priceTrend.length < 7) {
        return {
            recommendation: 'Insufficient data for prediction',
            confidence: 0
        };
    }

    const recentPrices = priceTrend.slice(-7).map(d => d.price);
    const average = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const currentPrice = recentPrices[recentPrices.length - 1];
    const trend = currentPrice > average ? 'rising' : 'falling';

    if (trend === 'rising' && currentPrice > average * 1.05) {
        return {
            recommendation: 'Good time to sell. Prices are rising.',
            confidence: 75,
            action: 'sell_now'
        };
    } else if (trend === 'falling') {
        return {
            recommendation: 'Consider waiting. Prices may recover.',
            confidence: 60,
            action: 'wait'
        };
    } else {
        return {
            recommendation: 'Prices are stable. Sell if you need cash flow.',
            confidence: 50,
            action: 'neutral'
        };
    }
};

// Helper functions
function getMostFrequent(arr) {
    const frequency = {};
    arr.forEach(item => {
        frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
}

function getMockWeatherData() {
    return {
        temp: 28,
        description: 'Sunny',
        humidity: 45,
        windSpeed: 3.5,
        pressure: 1013,
        alert: 'Weather conditions are favorable for farming.'
    };
}

function getMockForecast() {
    const forecast = [];
    const conditions = ['Clear', 'Clouds', 'Rain', 'Sunny'];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        forecast.push({
            date: date.toISOString().split('T')[0],
            tempMax: 28 + Math.round(Math.random() * 8),
            tempMin: 18 + Math.round(Math.random() * 5),
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            rainProbability: Math.round(Math.random() * 100),
            humidity: 45 + Math.round(Math.random() * 30),
            windSpeed: 2 + Math.round(Math.random() * 5)
        });
    }

    return forecast;
}

// Soil health data integration (mock for now)
export const getSoilHealthData = async (location) => {
    try {
        // This would integrate with https://soilhealth.dac.gov.in/ API when available
        return {
            status: 'Available',
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Soil health API error:', error);
        return null;
    }
};

