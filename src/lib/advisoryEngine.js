// Enhanced Advisory Engine
// Fertilizer, biofertilizer, irrigation, and sowing recommendations

class AdvisoryEngine {
    constructor() {
        this.cache = new Map();
    }

    // Calculate fertilizer requirements
    calculateFertilizerRequirement(soilData, cropType, farmSize = 2.5) {
        const npkParts = soilData.npk.split(':').map(v => parseInt(v));
        const [currentN, currentP, currentK] = npkParts;

        // Optimal NPK levels for common crops (kg/ha)
        const cropRequirements = {
            rice: { N: 120, P: 60, K: 40 },
            wheat: { N: 150, P: 60, K: 40 },
            maize: { N: 120, P: 60, K: 40 },
            cotton: { N: 120, P: 60, K: 60 },
            sugarcane: { N: 250, P: 115, K: 115 },
            soybean: { N: 30, P: 60, K: 40 },
            chickpea: { N: 20, P: 60, K: 40 },
            tomato: { N: 150, P: 100, K: 100 },
            potato: { N: 150, P: 100, K: 150 },
            default: { N: 100, P: 50, K: 50 }
        };

        const requirements = cropRequirements[cropType?.toLowerCase()] || cropRequirements.default;

        // Calculate deficit (convert soil mg/kg to kg/ha equivalent)
        const soilToHaFactor = 2.24; // Approximate conversion factor
        const deficit = {
            N: Math.max(0, requirements.N - (currentN / soilToHaFactor)),
            P: Math.max(0, requirements.P - (currentP / soilToHaFactor)),
            K: Math.max(0, requirements.K - (currentK / soilToHaFactor))
        };

        // Calculate fertilizer quantities for farm size
        const fertilizerQuantity = {
            urea: (deficit.N / 0.46) * farmSize, // Urea is 46% N
            dap: (deficit.P / 0.46) * farmSize,  // DAP is 46% P2O5
            mop: (deficit.K / 0.60) * farmSize,  // MOP is 60% K2O
            totalCost: 0
        };

        // Estimate cost (₹/kg)
        const prices = { urea: 6, dap: 27, mop: 17 };
        fertilizerQuantity.totalCost =
            (fertilizerQuantity.urea * prices.urea) +
            (fertilizerQuantity.dap * prices.dap) +
            (fertilizerQuantity.mop * prices.mop);

        return {
            deficit,
            requirements,
            fertilizers: {
                urea: { quantity: Math.round(fertilizerQuantity.urea), unit: 'kg', price: prices.urea },
                dap: { quantity: Math.round(fertilizerQuantity.dap), unit: 'kg', price: prices.dap },
                mop: { quantity: Math.round(fertilizerQuantity.mop), unit: 'kg', price: prices.mop }
            },
            totalCost: Math.round(fertilizerQuantity.totalCost),
            applicationSchedule: this.getFertilizerSchedule(cropType)
        };
    }

    getFertilizerSchedule(cropType) {
        const schedules = {
            rice: [
                { stage: 'Basal', timing: 'At transplanting', percentage: 50 },
                { stage: 'Tillering', timing: '21 days after transplanting', percentage: 25 },
                { stage: 'Panicle initiation', timing: '42 days after transplanting', percentage: 25 }
            ],
            wheat: [
                { stage: 'Basal', timing: 'At sowing', percentage: 50 },
                { stage: 'Crown root initiation', timing: '21 days after sowing', percentage: 25 },
                { stage: 'Flowering', timing: '60 days after sowing', percentage: 25 }
            ],
            default: [
                { stage: 'Basal', timing: 'At sowing/transplanting', percentage: 50 },
                { stage: 'Vegetative', timing: '30 days after sowing', percentage: 30 },
                { stage: 'Reproductive', timing: '60 days after sowing', percentage: 20 }
            ]
        };

        return schedules[cropType?.toLowerCase()] || schedules.default;
    }

    // Biofertilizer recommendations
    getBiofertilizerRecommendation(soilData, cropType) {
        const recommendations = [];

        // Nitrogen-fixing biofertilizers
        if (soilData.npk.split(':')[0] < 100) {
            recommendations.push({
                type: 'Rhizobium',
                purpose: 'Nitrogen fixation',
                suitableFor: ['legumes', 'pulses', 'soybean', 'chickpea', 'lentil'],
                application: 'Seed treatment: 200g per 10kg seeds',
                benefits: 'Fixes atmospheric nitrogen, reduces urea requirement by 25%'
            });

            recommendations.push({
                type: 'Azotobacter',
                purpose: 'Nitrogen fixation',
                suitableFor: ['wheat', 'rice', 'maize', 'cotton', 'vegetables'],
                application: 'Soil application: 4-5 kg/hectare mixed with compost',
                benefits: 'Fixes 20-40 kg N/ha, improves soil structure'
            });
        }

        // Phosphorus-solubilizing biofertilizers
        if (soilData.npk.split(':')[1] < 60) {
            recommendations.push({
                type: 'PSB (Phosphate Solubilizing Bacteria)',
                purpose: 'Phosphorus availability',
                suitableFor: ['all crops'],
                application: 'Seed treatment or soil application: 200g/10kg seeds or 4kg/ha',
                benefits: 'Solubilizes fixed phosphorus, reduces DAP requirement by 20%'
            });
        }

        // Potassium-mobilizing biofertilizers
        if (soilData.npk.split(':')[2] < 80) {
            recommendations.push({
                type: 'KMB (Potassium Mobilizing Bacteria)',
                purpose: 'Potassium availability',
                suitableFor: ['all crops'],
                application: 'Soil application: 4-5 kg/hectare',
                benefits: 'Mobilizes fixed potassium, improves nutrient uptake'
            });
        }

        // Organic carbon enhancers
        if (soilData.organicCarbon < 1.0) {
            recommendations.push({
                type: 'Decomposer culture',
                purpose: 'Organic matter decomposition',
                suitableFor: ['all crops'],
                application: 'Mix with farm waste: 1kg culture per ton of waste',
                benefits: 'Rapid composting, improves soil organic carbon'
            });
        }

        return recommendations.filter(rec =>
            rec.suitableFor.includes('all crops') ||
            rec.suitableFor.includes(cropType?.toLowerCase())
        );
    }

    // Biochar recommendations
    getBiocharRecommendation(soilData) {
        const recommendations = {
            suitable: false,
            quantity: 0,
            benefits: [],
            application: ''
        };

        // Biochar is especially beneficial for acidic soils and low organic carbon
        if (soilData.ph < 6.5 || soilData.organicCarbon < 1.0) {
            recommendations.suitable = true;
            recommendations.quantity = 5; // tonnes per hectare
            recommendations.benefits = [
                'Increases soil pH (reduces acidity)',
                'Improves water retention capacity',
                'Enhances nutrient retention',
                'Increases soil organic carbon',
                'Promotes beneficial microbial activity',
                'Reduces greenhouse gas emissions'
            ];
            recommendations.application = 'Apply 5-10 tonnes/hectare, mix with topsoil before sowing';

            if (soilData.ph < 6.0) {
                recommendations.priority = 'High - Soil is too acidic';
            } else if (soilData.organicCarbon < 0.5) {
                recommendations.priority = 'High - Very low organic carbon';
            } else {
                recommendations.priority = 'Medium - Will improve soil health';
            }
        } else {
            recommendations.suitable = false;
            recommendations.reason = 'Soil pH and organic carbon are in acceptable range';
        }

        return recommendations;
    }

    // Irrigation scheduling
    getIrrigationSchedule(cropType, soilData, weather, farmSize = 2.5) {
        const cropWaterRequirements = {
            rice: { daily: 8, critical: ['tillering', 'flowering', 'grain filling'] },
            wheat: { daily: 4, critical: ['crown root', 'flowering', 'grain filling'] },
            maize: { daily: 5, critical: ['knee high', 'tasseling', 'grain filling'] },
            cotton: { daily: 6, critical: ['square formation', 'flowering', 'boll development'] },
            sugarcane: { daily: 7, critical: ['tillering', 'grand growth', 'maturity'] },
            vegetables: { daily: 5, critical: ['flowering', 'fruit development'] },
            default: { daily: 5, critical: ['vegetative', 'flowering', 'fruiting'] }
        };

        const cropReq = cropWaterRequirements[cropType?.toLowerCase()] || cropWaterRequirements.default;

        // Adjust for weather
        let adjustedRequirement = cropReq.daily;
        if (weather?.temp > 35) adjustedRequirement *= 1.3;
        else if (weather?.temp > 30) adjustedRequirement *= 1.15;

        if (weather?.humidity < 40) adjustedRequirement *= 1.2;

        // Calculate irrigation frequency
        const soilMoisture = soilData.soilMoisture || 60; // From IoT or default
        let frequency;

        if (soilMoisture < 40) {
            frequency = 'Daily';
        } else if (soilMoisture < 60) {
            frequency = 'Every 2-3 days';
        } else {
            frequency = 'Every 4-5 days';
        }

        // Total water requirement
        const dailyWater = (adjustedRequirement * farmSize * 10000) / 1000; // liters

        return {
            cropType,
            dailyRequirement: Math.round(adjustedRequirement * 10) / 10,
            frequency,
            totalWaterPerDay: Math.round(dailyWater),
            criticalStages: cropReq.critical,
            currentSoilMoisture: soilMoisture,
            recommendation: this.getIrrigationRecommendation(soilMoisture, weather),
            method: this.recommendIrrigationMethod(cropType, soilData)
        };
    }

    getIrrigationRecommendation(soilMoisture, weather) {
        if (soilMoisture < 40) {
            return '🚨 Urgent: Irrigate immediately. Soil moisture is critically low.';
        } else if (soilMoisture < 60) {
            return '⚠️ Irrigate within 24 hours. Soil moisture is below optimal.';
        } else if (weather?.temp > 35) {
            return '☀️ Monitor closely. High temperature may increase water stress.';
        } else {
            return '✅ Soil moisture is adequate. Continue regular monitoring.';
        }
    }

    recommendIrrigationMethod(cropType, soilData) {
        const methods = {
            rice: 'Flood irrigation or continuous submergence',
            wheat: 'Furrow irrigation or sprinkler',
            maize: 'Drip or furrow irrigation',
            cotton: 'Drip irrigation (most efficient)',
            sugarcane: 'Furrow or drip irrigation',
            vegetables: 'Drip irrigation (recommended)',
            default: 'Drip irrigation for water efficiency'
        };

        return methods[cropType?.toLowerCase()] || methods.default;
    }

    // Sowing date recommendations
    getSowingDateRecommendation(cropType, location, currentDate = new Date()) {
        const month = currentDate.getMonth();

        const sowingWindows = {
            rice: {
                kharif: { start: 5, end: 7, months: 'June-July' },
                rabi: { start: 10, end: 11, months: 'November-December' }
            },
            wheat: {
                rabi: { start: 10, end: 11, months: 'November-December' }
            },
            maize: {
                kharif: { start: 5, end: 6, months: 'June-July' },
                rabi: { start: 9, end: 10, months: 'October-November' }
            },
            cotton: {
                kharif: { start: 4, end: 5, months: 'May-June' }
            },
            soybean: {
                kharif: { start: 5, end: 6, months: 'June-July' }
            },
            chickpea: {
                rabi: { start: 9, end: 10, months: 'October-November' }
            }
        };

        const cropWindows = sowingWindows[cropType?.toLowerCase()];
        if (!cropWindows) {
            return {
                suitable: false,
                message: 'Sowing window information not available for this crop'
            };
        }

        // Check current month against sowing windows
        for (const [season, window] of Object.entries(cropWindows)) {
            if (month >= window.start && month <= window.end) {
                return {
                    suitable: true,
                    season,
                    window: window.months,
                    message: `✅ Optimal sowing time for ${cropType} (${season} season)`,
                    daysRemaining: this.calculateDaysInWindow(month, window.end)
                };
            } else if (month === window.start - 1) {
                return {
                    suitable: true,
                    season,
                    window: window.months,
                    message: `⏰ Sowing window opens next month (${window.months})`,
                    daysUntilWindow: this.calculateDaysUntilWindow(currentDate, window.start)
                };
            }
        }

        return {
            suitable: false,
            message: `Not the optimal sowing time for ${cropType}`,
            nextWindow: this.getNextSowingWindow(cropWindows, month)
        };
    }

    calculateDaysInWindow(currentMonth, endMonth) {
        const now = new Date();
        const endDate = new Date(now.getFullYear(), endMonth + 1, 0);
        return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    }

    calculateDaysUntilWindow(currentDate, startMonth) {
        const windowStart = new Date(currentDate.getFullYear(), startMonth, 1);
        if (windowStart < currentDate) {
            windowStart.setFullYear(windowStart.getFullYear() + 1);
        }
        return Math.ceil((windowStart - currentDate) / (1000 * 60 * 60 * 24));
    }

    getNextSowingWindow(windows, currentMonth) {
        for (const [season, window] of Object.entries(windows)) {
            if (window.start > currentMonth) {
                return `Next window: ${window.months} (${season} season)`;
            }
        }
        // If no window found this year, return first window of next year
        const firstWindow = Object.values(windows)[0];
        return `Next window: ${firstWindow.months} (next year)`;
    }
}

// Create singleton instance
const advisoryEngine = new AdvisoryEngine();

export default advisoryEngine;
export { AdvisoryEngine };
