import { getCropRecommendations, formatCropRecommendations } from './cropRecommendation';

const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export async function generateFarmingSchedule(soilData, location, weatherData) {
   try {
      console.log('Generating farming schedule with Gemini AI...');

      // Get data-driven crop recommendations
      const cropRecommendations = getCropRecommendations(soilData, weatherData, 5);
      const formattedCropRecs = formatCropRecommendations(cropRecommendations, soilData);

      const response = await fetch(`${API_URL}/farming-schedule`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({
            soilData,
            location,
            weatherData
         }),
      });

      if (!response.ok) {
         throw new Error('Failed to generate schedule');
      }

      const data = await response.json();
      console.log('AI recommendations generated successfully');
      return data.schedule;

   } catch (error) {
      console.error('Error generating farming schedule:', error);
      console.log('Using fallback recommendations...');

      // Enhanced fallback with detailed recommendations
      const cropRecs = getCropRecommendations(soilData, weatherData, 5);
      const formattedRecs = formatCropRecommendations(cropRecs, soilData);

      return `# 🌾 Farming Advisory Report

${formattedRecs}

## 📅 Planting Schedule

**Recommended Seasons:**
- **Kharif (June-July)**: Best for rice, maize, cotton, soybean
- **Rabi (October-November)**: Best for wheat, chickpea, mustard

**Current Soil Grade: ${soilData.soilGrade || 'B'}**

## 💧 Watering Schedule

**Irrigation Frequency:**
- Clay soil: Every 4-5 days
- Loamy soil: Every 3-4 days  
- Sandy soil: Every 2-3 days

**Current Soil Type: ${soilData.texture}**
- Apply ${soilData.texture === 'Sandy' ? '20-25mm' : soilData.texture === 'Clay' ? '30-35mm' : '25-30mm'} water per irrigation

## 🌱 Fertilizer Application

**NPK Current Levels: ${soilData.npk}**

**Recommended:**
1. **Urea (Nitrogen)**: ${soilData.npk.split(':')[0] < 100 ? '100-120 kg/ha' : '50-60 kg/ha'}
2. **DAP (Phosphorus)**: ${soilData.npk.split(':')[1] < 50 ? '60-80 kg/ha' : '30-40 kg/ha'}
3. **MOP (Potassium)**: ${soilData.npk.split(':')[2] < 80 ? '40-50 kg/ha' : '20-30 kg/ha'}

**Organic Options:**
- Farmyard Manure: 10-15 tons/ha
- Vermicompost: 3-4 tons/ha
- Green Manure: Dhaincha, Sunhemp

## 🐛 Pest Management

**Common Pests:**
- Stem Borer, Leaf Folder
- Aphids, Jassids, White Fly
- Root Rot, Wilt

**Organic Control:**
- Neem oil spray (5ml/liter water)
- Pheromone traps
- Crop rotation
- Biological control (Trichogramma)

## 📊 Soil Health Tips

**pH Level: ${soilData.ph}** ${soilData.ph < 6.5 ? '⚠️ Slightly Acidic - Apply lime' : soilData.ph > 7.5 ? '⚠️ Slightly Alkaline - Apply gypsum' : '✅ Optimal'}

**Organic Carbon: ${soilData.organicCarbon}%** ${soilData.organicCarbon < 0.75 ? '⚠️ Low - Add compost/FYM' : '✅ Good'}

**Recommendations:**
- Test soil every 6 months
- Practice crop rotation
- Add organic matter regularly
- Maintain soil moisture

---
*This is a fallback report. For AI-powered recommendations, please check your Gemini API key configuration.*`;
   }
}

export function speakText(text) {
   if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
      return true;
   }
   return false;
}

export function stopSpeaking() {
   if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
   }
};
