// Simulation Engine - Yield Prediction & Cost Analysis
import { getCropRecommendations } from './cropRecommendation';

export const calculateYieldPrediction = (scenario) => {
    const {
        cropType,
        soilNPK,
        irrigation,
        fertilizer,
        organicCarbon,
        ph,
        weather,
        farmSize = 2.5
    } = scenario;

    // Parse NPK values
    const [n, p, k] = soilNPK.split(':').map(v => parseInt(v));

    // Base yield per acre (in quintals) for common crops
    const baseYields = {
        'rice': 25,
        'wheat': 20,
        'maize': 30,
        'cotton': 15,
        'soybean': 12,
        'sugarcane': 350,
        'potato': 200,
        'tomato': 250,
        'onion': 180
    };

    let baseYield = baseYields[cropType.toLowerCase()] || 20;

    // NPK factor (optimal ranges: N: 120-180, P: 60-100, K: 80-120)
    let npkFactor = 1.0;
    if (n >= 120 && n <= 180) npkFactor += 0.15;
    else if (n < 80) npkFactor -= 0.2;

    if (p >= 60 && p <= 100) npkFactor += 0.1;
    else if (p < 40) npkFactor -= 0.15;

    if (k >= 80 && k <= 120) npkFactor += 0.1;
    else if (k < 60) npkFactor -= 0.15;

    // pH factor (optimal: 6.5-7.5)
    let phFactor = 1.0;
    if (ph >= 6.5 && ph <= 7.5) phFactor = 1.1;
    else if (ph < 5.5 || ph > 8.5) phFactor = 0.8;

    // Organic carbon factor (optimal: >0.75%)
    let ocFactor = 1.0;
    if (organicCarbon >= 0.75) ocFactor = 1.1;
    else if (organicCarbon < 0.5) ocFactor = 0.9;

    // Irrigation factor
    const irrigationFactors = {
        'optimal': 1.2,
        'adequate': 1.0,
        'insufficient': 0.7,
        'excessive': 0.85
    };
    const irrigationFactor = irrigationFactors[irrigation] || 1.0;

    // Fertilizer factor
    const fertilizerFactors = {
        'recommended': 1.15,
        'moderate': 1.0,
        'low': 0.85,
        'high': 1.05
    };
    const fertilizerFactor = fertilizerFactors[fertilizer] || 1.0;

    // Weather factor (simplified)
    let weatherFactor = 1.0;
    if (weather?.temp > 35 || weather?.temp < 10) weatherFactor = 0.9;
    if (weather?.humidity > 80) weatherFactor *= 0.95;

    // Calculate final yield
    const totalFactor = npkFactor * phFactor * ocFactor * irrigationFactor * fertilizerFactor * weatherFactor;
    const predictedYieldPerAcre = baseYield * totalFactor;
    const totalYield = predictedYieldPerAcre * farmSize;

    return {
        yieldPerAcre: Math.round(predictedYieldPerAcre * 10) / 10,
        totalYield: Math.round(totalYield * 10) / 10,
        factors: {
            npk: Math.round(npkFactor * 100),
            ph: Math.round(phFactor * 100),
            organicCarbon: Math.round(ocFactor * 100),
            irrigation: Math.round(irrigationFactor * 100),
            fertilizer: Math.round(fertilizerFactor * 100),
            weather: Math.round(weatherFactor * 100)
        }
    };
};

export const calculateCostAnalysis = (scenario) => {
    const {
        cropType,
        soilNPK,
        fertilizer,
        irrigation,
        farmSize = 2.5
    } = scenario;

    const [n, p, k] = soilNPK.split(':').map(v => parseInt(v));

    // Fertilizer costs (per kg)
    const fertilizerPrices = {
        urea: 6, // ₹/kg (Nitrogen)
        dap: 27, // ₹/kg (Phosphorus)
        mop: 17  // ₹/kg (Potassium)
    };

    // Calculate fertilizer requirements (kg/acre)
    let ureaNeeded = Math.max(0, (140 - n) * 2.2); // Convert to urea
    let dapNeeded = Math.max(0, (70 - p) * 2.2);
    let mopNeeded = Math.max(0, (90 - k) * 1.67);

    // Adjust based on fertilizer level
    const fertilizerMultipliers = {
        'recommended': 1.0,
        'moderate': 0.7,
        'low': 0.5,
        'high': 1.3
    };
    const multiplier = fertilizerMultipliers[fertilizer] || 1.0;

    ureaNeeded *= multiplier;
    dapNeeded *= multiplier;
    mopNeeded *= multiplier;

    const fertilizerCost = (
        ureaNeeded * fertilizerPrices.urea +
        dapNeeded * fertilizerPrices.dap +
        mopNeeded * fertilizerPrices.mop
    ) * farmSize;

    // Irrigation costs
    const irrigationCosts = {
        'optimal': 3000,
        'adequate': 2000,
        'insufficient': 1000,
        'excessive': 3500
    };
    const irrigationCost = (irrigationCosts[irrigation] || 2000) * farmSize;

    // Seed costs (approximate per acre)
    const seedCosts = {
        'rice': 1500,
        'wheat': 1200,
        'maize': 2000,
        'cotton': 3000,
        'soybean': 2500,
        'sugarcane': 5000,
        'potato': 8000,
        'tomato': 6000,
        'onion': 4000
    };
    const seedCost = (seedCosts[cropType.toLowerCase()] || 2000) * farmSize;

    // Labor costs (approximate)
    const laborCost = 15000 * farmSize;

    // Other costs (pesticides, machinery, etc.)
    const otherCosts = 10000 * farmSize;

    const totalCost = fertilizerCost + irrigationCost + seedCost + laborCost + otherCosts;

    return {
        fertilizer: Math.round(fertilizerCost),
        irrigation: Math.round(irrigationCost),
        seeds: Math.round(seedCost),
        labor: Math.round(laborCost),
        others: Math.round(otherCosts),
        total: Math.round(totalCost),
        breakdown: {
            urea: { quantity: Math.round(ureaNeeded * farmSize), cost: Math.round(ureaNeeded * farmSize * fertilizerPrices.urea) },
            dap: { quantity: Math.round(dapNeeded * farmSize), cost: Math.round(dapNeeded * farmSize * fertilizerPrices.dap) },
            mop: { quantity: Math.round(mopNeeded * farmSize), cost: Math.round(mopNeeded * farmSize * fertilizerPrices.mop) }
        }
    };
};

export const calculateProfitAnalysis = (scenario, currentMarketPrice) => {
    const yieldData = calculateYieldPrediction(scenario);
    const costData = calculateCostAnalysis(scenario);

    // Market prices (₹ per quintal) - approximate averages
    const marketPrices = {
        'rice': 2000,
        'wheat': 2100,
        'maize': 1800,
        'cotton': 6000,
        'soybean': 4000,
        'sugarcane': 350,
        'potato': 1200,
        'tomato': 1500,
        'onion': 1800
    };

    const price = currentMarketPrice || marketPrices[scenario.cropType.toLowerCase()] || 2000;
    const revenue = yieldData.totalYield * price;
    const profit = revenue - costData.total;
    const profitMargin = (profit / revenue) * 100;

    return {
        revenue: Math.round(revenue),
        cost: costData.total,
        profit: Math.round(profit),
        profitMargin: Math.round(profitMargin * 10) / 10,
        roi: Math.round((profit / costData.total) * 100 * 10) / 10
    };
};

export const generateRecommendations = (currentScenario, simulatedScenario) => {
    const recommendations = [];

    const [currentN, currentP, currentK] = currentScenario.soilNPK.split(':').map(v => parseInt(v));
    const [simN, simP, simK] = simulatedScenario.soilNPK.split(':').map(v => parseInt(v));

    // NPK recommendations
    if (simN > currentN + 20) {
        recommendations.push({
            type: 'fertilizer',
            priority: 'high',
            message: `Increasing Nitrogen from ${currentN} to ${simN} mg/kg could improve yield by ${Math.round((simN - currentN) / currentN * 15)}%`,
            action: `Apply ${Math.round((simN - currentN) * 2.2 * currentScenario.farmSize)} kg Urea`
        });
    }

    if (simP > currentP + 10) {
        recommendations.push({
            type: 'fertilizer',
            priority: 'medium',
            message: `Boosting Phosphorus from ${currentP} to ${simP} mg/kg`,
            action: `Apply ${Math.round((simP - currentP) * 2.2 * currentScenario.farmSize)} kg DAP`
        });
    }

    // Irrigation recommendations
    if (currentScenario.irrigation !== simulatedScenario.irrigation) {
        const impact = simulatedScenario.irrigation === 'optimal' ? 'increase yield by 20%' : 'reduce costs';
        recommendations.push({
            type: 'irrigation',
            priority: 'high',
            message: `Adjusting irrigation from ${currentScenario.irrigation} to ${simulatedScenario.irrigation} could ${impact}`,
            action: `Modify irrigation schedule accordingly`
        });
    }

    // Crop change recommendations
    if (currentScenario.cropType !== simulatedScenario.cropType) {
        const currentYield = calculateYieldPrediction(currentScenario);
        const simYield = calculateYieldPrediction(simulatedScenario);
        const improvement = ((simYield.totalYield - currentYield.totalYield) / currentYield.totalYield * 100);

        if (improvement > 10) {
            recommendations.push({
                type: 'crop',
                priority: 'high',
                message: `Switching from ${currentScenario.cropType} to ${simulatedScenario.cropType} could increase yield by ${Math.round(improvement)}%`,
                action: `Consider planting ${simulatedScenario.cropType} in next season`
            });
        }
    }

    return recommendations;
};
