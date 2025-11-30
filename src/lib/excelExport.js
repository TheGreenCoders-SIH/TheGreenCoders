// Excel Export Utility using SheetJS (xlsx)
import * as XLSX from 'xlsx';

export const exportSoilDataToExcel = (cardData, farmerId, farmerName) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Farmer Information Sheet
    const farmerInfo = [
        ['Farmer Information'],
        ['Farmer ID', farmerId],
        ['Name', farmerName],
        ['Village', cardData.village || 'N/A'],
        ['District', cardData.district || 'N/A'],
        ['State', cardData.state || 'N/A'],
        ['Farm Size', `${cardData.farmSize || '2.5'} acres`],
        [''],
        ['Soil Parameters'],
        ['pH Level', cardData.ph],
        ['NPK Ratio', cardData.npk],
        ['Organic Carbon (%)', cardData.organicCarbon],
        ['EC (dS/m)', cardData.ec],
        ['Soil Texture', cardData.texture],
        ['Soil Grade', cardData.soilGrade]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(farmerInfo);
    XLSX.utils.book_append_sheet(wb, ws1, 'Soil Health');

    // Download
    XLSX.writeFile(wb, `soil-health-${farmerId}.xlsx`);
};

export const exportCropRecommendationsToExcel = (cropRecommendations, farmerId) => {
    const wb = XLSX.utils.book_new();

    const data = [
        ['Crop Name', 'Suitability Score', 'Nitrogen (kg/ha)', 'Phosphorus (kg/ha)', 'Potassium (kg/ha)', 'pH Requirement']
    ];

    cropRecommendations.forEach(crop => {
        data.push([
            crop.crop,
            `${crop.suitability}%`,
            Math.round(crop.requirements.N),
            Math.round(crop.requirements.P),
            Math.round(crop.requirements.K),
            crop.requirements.ph.toFixed(1)
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Crop Recommendations');
    XLSX.writeFile(wb, `crop-recommendations-${farmerId}.xlsx`);
};

export const exportIoTHistoryToExcel = (sensorData, farmerId) => {
    const wb = XLSX.utils.book_new();

    const data = [
        ['Timestamp', 'Soil Moisture (%)', 'Temperature (°C)', 'Humidity (%)', 'Soil Temp (°C)', 'Status']
    ];

    sensorData.forEach(reading => {
        data.push([
            new Date(reading.timestamp).toLocaleString(),
            reading.soilMoisture,
            reading.temperature,
            reading.humidity,
            reading.soilTemp,
            reading.status
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'IoT Sensor Data');
    XLSX.writeFile(wb, `iot-history-${farmerId}.xlsx`);
};

export const exportWeatherForecastToExcel = (weatherData, location) => {
    const wb = XLSX.utils.book_new();

    const data = [
        ['Date', 'Temperature (°C)', 'Condition', 'Humidity (%)', 'Wind Speed (km/h)', 'Rain Probability (%)']
    ];

    weatherData.forEach(day => {
        data.push([
            new Date(day.date).toLocaleDateString(),
            day.temp,
            day.condition,
            day.humidity,
            day.windSpeed,
            day.rainProbability
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '7-Day Forecast');
    XLSX.writeFile(wb, `weather-forecast-${location}.xlsx`);
};

export const exportMarketPricesToExcel = (marketData, crop) => {
    const wb = XLSX.utils.book_new();

    const data = [
        ['Market Name', 'Location', 'Price (₹/quintal)', 'Date', 'Trend']
    ];

    marketData.forEach(market => {
        data.push([
            market.market,
            market.location,
            market.price,
            new Date(market.date).toLocaleDateString(),
            market.trend
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Market Prices');
    XLSX.writeFile(wb, `market-prices-${crop}.xlsx`);
};

export const exportComprehensiveReport = (allData) => {
    const { farmer, soil, crops, iot, weather, farmerId } = allData;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Farmer & Soil Info
    const farmerSheet = [
        ['GreenCoders E-Soil Smart System'],
        ['Comprehensive Farming Report'],
        [''],
        ['Farmer Information'],
        ['Farmer ID', farmerId],
        ['Name', farmer.name],
        ['Village', farmer.village],
        ['District', farmer.district],
        ['State', farmer.state],
        [''],
        ['Soil Health Parameters'],
        ['pH Level', soil.ph],
        ['NPK Ratio', soil.npk],
        ['Organic Carbon', soil.organicCarbon],
        ['EC', soil.ec],
        ['Texture', soil.texture],
        ['Grade', soil.soilGrade]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(farmerSheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Farmer Info');

    // Sheet 2: Crop Recommendations
    if (crops && crops.length > 0) {
        const cropData = [['Crop', 'Suitability', 'N (kg/ha)', 'P (kg/ha)', 'K (kg/ha)', 'pH']];
        crops.forEach(c => {
            cropData.push([
                c.crop,
                `${c.suitability}%`,
                Math.round(c.requirements.N),
                Math.round(c.requirements.P),
                Math.round(c.requirements.K),
                c.requirements.ph.toFixed(1)
            ]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(cropData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Crop Recommendations');
    }

    // Sheet 3: Recent IoT Readings
    if (iot && iot.length > 0) {
        const iotData = [['Timestamp', 'Soil Moisture', 'Temperature', 'Humidity']];
        iot.slice(0, 50).forEach(reading => {
            iotData.push([
                new Date(reading.timestamp).toLocaleString(),
                reading.soilMoisture,
                reading.temperature,
                reading.humidity
            ]);
        });
        const ws3 = XLSX.utils.aoa_to_sheet(iotData);
        XLSX.utils.book_append_sheet(wb, ws3, 'IoT Data');
    }

    // Sheet 4: Weather Forecast
    if (weather && weather.length > 0) {
        const weatherData = [['Date', 'Temperature', 'Condition', 'Humidity', 'Rain %']];
        weather.forEach(day => {
            weatherData.push([
                new Date(day.date).toLocaleDateString(),
                day.temp,
                day.condition,
                day.humidity,
                day.rainProbability
            ]);
        });
        const ws4 = XLSX.utils.aoa_to_sheet(weatherData);
        XLSX.utils.book_append_sheet(wb, ws4, 'Weather Forecast');
    }

    XLSX.writeFile(wb, `comprehensive-report-${farmerId}.xlsx`);
};
