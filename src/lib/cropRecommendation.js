// Crop Recommendation System using CSV data
import cropData from '../../data/Crop_recommendation.csv?raw';

/**
 * Parse CSV data into usable format
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            const value = values[index];
            // Convert numeric fields
            if (['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'].includes(header)) {
                obj[header] = parseFloat(value);
            } else {
                obj[header] = value;
            }
        });
        return obj;
    });
}

/**
 * Calculate similarity score between soil data and crop requirements
 */
function calculateSimilarity(soilData, cropRequirement) {
    // Extract NPK values from soil data
    const npkParts = soilData.npk?.split(':') || [0, 0, 0];
    const soilN = parseInt(npkParts[0]);
    const soilP = parseInt(npkParts[1]);
    const soilK = parseInt(npkParts[2]);

    // Calculate normalized differences
    const nDiff = Math.abs(soilN - cropRequirement.N) / cropRequirement.N;
    const pDiff = Math.abs(soilP - cropRequirement.P) / cropRequirement.P;
    const kDiff = Math.abs(soilK - cropRequirement.K) / cropRequirement.K;
    const phDiff = Math.abs(soilData.ph - cropRequirement.ph) / cropRequirement.ph;

    // Calculate similarity score (lower is better, so invert it)
    const avgDiff = (nDiff + pDiff + kDiff + phDiff) / 4;
    const similarity = Math.max(0, 100 - (avgDiff * 100));

    return similarity;
}

/**
 * Get crop recommendations based on soil data
 */
export function getCropRecommendations(soilData, weatherData, topN = 5) {
    try {
        // Parse CSV data
        const crops = parseCSV(cropData);

        // Calculate similarity scores for each crop
        const scoredCrops = crops.map(crop => ({
            ...crop,
            similarity: calculateSimilarity(soilData, crop)
        }));

        // Group by crop label and get average similarity
        const cropGroups = {};
        scoredCrops.filter(c => c.label).forEach(crop => {
            if (!cropGroups[crop.label]) {
                cropGroups[crop.label] = {
                    label: crop.label,
                    similarities: [],
                    avgRequirements: {
                        N: 0,
                        P: 0,
                        K: 0,
                        temperature: 0,
                        humidity: 0,
                        ph: 0,
                        rainfall: 0
                    }
                };
            }
            cropGroups[crop.label].similarities.push(crop.similarity);

            // Accumulate requirements for averaging
            Object.keys(cropGroups[crop.label].avgRequirements).forEach(key => {
                cropGroups[crop.label].avgRequirements[key] += crop[key];
            });
        });

        // Calculate averages and sort by similarity
        const recommendations = Object.values(cropGroups).map(group => {
            const count = group.similarities.length;
            const avgSimilarity = group.similarities.reduce((a, b) => a + b, 0) / count;

            // Average the requirements
            Object.keys(group.avgRequirements).forEach(key => {
                group.avgRequirements[key] /= count;
            });

            return {
                crop: group.label,
                suitability: Math.round(avgSimilarity),
                requirements: group.avgRequirements
            };
        }).sort((a, b) => b.suitability - a.suitability);

        // Return top N recommendations
        return recommendations.slice(0, topN);
    } catch (error) {
        console.error('Error getting crop recommendations:', error);
        return [];
    }
}

/**
 * Get detailed crop information
 */
export function getCropDetails(cropName) {
    try {
        const crops = parseCSV(cropData);
        const cropData = crops.filter(c => c.label === cropName);

        if (cropData.length === 0) return null;

        // Calculate average requirements
        const avgRequirements = {
            N: 0,
            P: 0,
            K: 0,
            temperature: 0,
            humidity: 0,
            ph: 0,
            rainfall: 0
        };

        cropData.forEach(crop => {
            Object.keys(avgRequirements).forEach(key => {
                avgRequirements[key] += crop[key];
            });
        });

        Object.keys(avgRequirements).forEach(key => {
            avgRequirements[key] /= cropData.length;
        });

        return {
            name: cropName,
            requirements: avgRequirements,
            sampleCount: cropData.length
        };
    } catch (error) {
        console.error('Error getting crop details:', error);
        return null;
    }
}

/**
 * Format crop recommendations for display
 */
export function formatCropRecommendations(recommendations, soilData) {
    if (!recommendations || recommendations.length === 0) {
        return "No crop recommendations available based on current soil data.";
    }

    let output = "🌾 **Recommended Crops Based on Your Soil Analysis:**\n\n";

    recommendations.forEach((rec, index) => {
        const suitabilityEmoji = rec.suitability >= 80 ? '🟢' : rec.suitability >= 60 ? '🟡' : '🟠';

        output += `${index + 1}. ${suitabilityEmoji} **${(rec.crop || 'Unknown Crop').toUpperCase()}** (${rec.suitability}% suitable)\n`;
        output += `   - Optimal N: ${Math.round(rec.requirements.N)} mg/kg\n`;
        output += `   - Optimal P: ${Math.round(rec.requirements.P)} mg/kg\n`;
        output += `   - Optimal K: ${Math.round(rec.requirements.K)} mg/kg\n`;
        output += `   - Optimal pH: ${rec.requirements.ph.toFixed(1)}\n`;
        output += `   - Temperature: ${rec.requirements.temperature.toFixed(1)}°C\n`;
        output += `   - Humidity: ${rec.requirements.humidity.toFixed(1)}%\n`;
        output += `   - Rainfall: ${rec.requirements.rainfall.toFixed(1)} mm\n\n`;
    });

    // Add soil adjustment recommendations
    const npkParts = soilData.npk?.split(':') || [0, 0, 0];
    const topCrop = recommendations[0];

    output += "\n📋 **Soil Adjustment Recommendations:**\n\n";

    const nDiff = parseInt(npkParts[0]) - topCrop.requirements.N;
    const pDiff = parseInt(npkParts[1]) - topCrop.requirements.P;
    const kDiff = parseInt(npkParts[2]) - topCrop.requirements.K;

    if (Math.abs(nDiff) > 20) {
        output += nDiff < 0
            ? `- Add ${Math.abs(Math.round(nDiff))} mg/kg Nitrogen (use Urea or Ammonium Sulfate)\n`
            : `- Reduce Nitrogen application by ${Math.round(nDiff)} mg/kg\n`;
    }

    if (Math.abs(pDiff) > 10) {
        output += pDiff < 0
            ? `- Add ${Math.abs(Math.round(pDiff))} mg/kg Phosphorus (use DAP or SSP)\n`
            : `- Reduce Phosphorus application by ${Math.round(pDiff)} mg/kg\n`;
    }

    if (Math.abs(kDiff) > 20) {
        output += kDiff < 0
            ? `- Add ${Math.abs(Math.round(kDiff))} mg/kg Potassium (use Muriate of Potash)\n`
            : `- Reduce Potassium application by ${Math.round(kDiff)} mg/kg\n`;
    }

    const phDiff = soilData.ph - topCrop.requirements.ph;
    if (Math.abs(phDiff) > 0.5) {
        output += phDiff < 0
            ? `- Increase soil pH by ${Math.abs(phDiff.toFixed(1))} (apply lime)\n`
            : `- Decrease soil pH by ${phDiff.toFixed(1)} (apply sulfur or organic matter)\n`;
    }

    return output;
}
