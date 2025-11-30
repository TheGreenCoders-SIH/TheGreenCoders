
import { getCropRecommendations } from './src/lib/cropRecommendation.js';

const mockSoilData = {
    ph: 7.0,
    organicCarbon: 1.0,
    npk: '120:60:80',
    village: 'Test Village'
};

const mockWeatherData = {
    temp: 28,
    humidity: 70,
    rainfall: 1000
};

console.log("Testing getCropRecommendations...");
const recs = getCropRecommendations(mockSoilData, mockWeatherData, 5);
console.log("Recommendations:", recs);

if (recs.length === 0) {
    console.error("FAIL: No recommendations returned.");
} else {
    console.log("SUCCESS: Recommendations returned.");
}
