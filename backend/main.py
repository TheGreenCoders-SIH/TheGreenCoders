from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from root .env
env_path = Path(__file__).parent.parent / '.env'
try:
    load_dotenv(env_path)
except Exception as e:
    print(f"⚠️ WARNING: Could not load .env file: {e}")
    print("Please ensure your .env file is UTF-8 encoded and does not contain null characters.")

# Configure Gemini
GOOGLE_API_KEY = os.getenv('VITE_GEMINI_API_KEY')
if not GOOGLE_API_KEY:
    print("⚠️ WARNING: VITE_GEMINI_API_KEY not found in .env file")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# Initialize FastAPI app
app = FastAPI(title="GreenCoders Crop Recommendation API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ML model
MODEL_PATH = Path(__file__).parent.parent / "models" / "crop_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# --- Data Models ---

class SoilData(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class CropRecommendation(BaseModel):
    crop: str
    confidence: float
    all_predictions: dict

class ChatRequest(BaseModel):
    message: str

class ScheduleRequest(BaseModel):
    soilData: dict
    location: str
    weatherData: dict

class RecommendationRequest(BaseModel):
    soilData: dict

# --- Endpoints ---

@app.get("/")
async def root():
    return {
        "message": "GreenCoders Crop Recommendation API",
        "status": "running",
        "model_loaded": model is not None,
        "gemini_configured": GOOGLE_API_KEY is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_status": "loaded" if model is not None else "not loaded"
    }

@app.post("/predict", response_model=CropRecommendation)
async def predict_crop(soil_data: SoilData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        input_data = np.array([[
            soil_data.N, soil_data.P, soil_data.K,
            soil_data.temperature, soil_data.humidity,
            soil_data.ph, soil_data.rainfall
        ]])
        
        prediction = model.predict(input_data)[0]
        
        confidence = 0.85
        all_predictions = {}
        
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(input_data)[0]
            classes = model.classes_
            pred_idx = np.where(classes == prediction)[0][0]
            confidence = float(probabilities[pred_idx])
            top_indices = np.argsort(probabilities)[-5:][::-1]
            all_predictions = {str(classes[i]): float(probabilities[i]) for i in top_indices}
        
        return CropRecommendation(
            crop=str(prediction),
            confidence=confidence,
            all_predictions=all_predictions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# --- Gemini Endpoints ---

@app.post("/chat")
async def chat_with_assistant(request: ChatRequest):
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""You are Kisan Sahayak, a helpful farming assistant for Indian farmers. Answer briefly in 2-3 sentences.
        
        Question: {request.message}
        
        Answer:"""
        
        response = model.generate_content(prompt)
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/farming-schedule")
async def generate_farming_schedule(request: ScheduleRequest):
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        soil = request.soilData
        weather = request.weatherData
        
        prompt = f"""You are an expert agricultural advisor. Based on the following soil analysis and crop recommendations, provide detailed farming advice:

        SOIL DATA:
        - pH Level: {soil.get('ph')}
        - NPK Values: {soil.get('npk')}
        - Organic Carbon: {soil.get('organicCarbon')}%
        - Location: {request.location}

        WEATHER DATA:
        - Temperature: {weather.get('temp', 'N/A')}°C
        - Humidity: {weather.get('humidity', 'N/A')}%
        - Conditions: {weather.get('description', 'N/A')}

        Please provide:
        1. **Planting Schedule**: Best times to plant suitable crops
        2. **Watering Schedule**: Irrigation frequency and amount
        3. **Fertilizer Application**: Specific fertilizer recommendations
        4. **Pest Management**: Common pests and organic control
        5. **Harvest Timeline**: Expected harvest periods

        Keep the advice practical, specific to the location, and easy to understand for farmers."""
        
        response = model.generate_content(prompt)
        return {"schedule": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schedule generation error: {str(e)}")

@app.post("/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        model = genai.GenerativeModel('gemini-pro')
        soil = request.soilData
        
        prompt = f"""As an agricultural expert, analyze this soil data and provide brief recommendations for Indian farmers:

        pH: {soil.get('ph')}
        Organic Carbon: {soil.get('organicCarbon')}%
        NPK: {soil.get('npk')}
        Location: {soil.get('village')}

        Provide 2-3 sentences covering suitable crops, fertilizer needs, and soil improvements."""
        
        response = model.generate_content(prompt)
        return {"recommendation": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    language: str = Form("en")
):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Read image content
        content = await image.read()
        
        prompts = {
            "en": """Analyze this crop/plant image and provide:
                1. **Crop Type**: Identify the crop or plant
                2. **Health Status**: Overall health (Healthy/Diseased/Pest-affected)
                3. **Disease/Pest Detected**: Name of disease or pest (if any)
                4. **Confidence**: Your confidence level (0-100%)
                5. **Symptoms**: Visible symptoms or signs
                6. **Treatment**: Recommended treatment or preventive measures
                7. **Severity**: Low/Medium/High
                8. **Organic Solutions**: Natural/organic treatment options
                
                Format your response clearly with these headings.""",
            "hi": """इस फसल/पौधे की छवि का विश्लेषण करें और प्रदान करें:
                1. **फसल का प्रकार**: फसल या पौधे की पहचान करें
                2. **स्वास्थ्य स्थिति**: समग्र स्वास्थ्य (स्वस्थ/रोगग्रस्त/कीट-प्रभावित)
                3. **रोग/कीट का पता लगाया**: रोग या कीट का नाम (यदि कोई हो)
                4. **विश्वास**: आपका विश्वास स्तर (0-100%)
                5. **लक्षण**: दिखाई देने वाले लक्षण या संकेत
                6. **उपचार**: अनुशंसित उपचार या निवारक उपाय
                7. **गंभीरता**: कम/मध्यम/उच्च
                8. **जैविक समाधान**: प्राकृतिक/जैविक उपचार विकल्प"""
        }
        
        prompt = prompts.get(language, prompts["en"])
        
        response = model.generate_content([
            prompt,
            {"mime_type": image.content_type, "data": content}
        ])
        
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
