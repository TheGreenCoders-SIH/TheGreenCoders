import sys
from pathlib import Path

# Add backend directory to Python path for model_loader import
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os
import google.generativeai as genai
from twilio.rest import Client
from dotenv import load_dotenv
from model_loader import (
    PlantDocModelLoader, MaizeModelLoader, RiceModelLoader,
    MultiModelDetector, PestModelLoader,
    load_image_from_base64, load_image_from_bytes
)

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

# Configure Twilio
TWILIO_ACCOUNT_SID = os.getenv('VITE_TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('VITE_TWILIO_AUTH_TOKEN')
TWILIO_MESSAGING_SERVICE_SID = os.getenv('VITE_TWILIO_MESSAGING_SERVICE_SID')

# Initialize FastAPI app
app = FastAPI(title="GreenCoders Crop Recommendation API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://thegreencoders.web.app",
        "https://thegreencoders.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ML model (crop recommendation - keep eager loading for this small model)
MODEL_PATH = Path(__file__).parent.parent / "models" / "crop_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Model paths for lazy loading
PLANTDOC_MODEL_PATH = Path(__file__).parent.parent / "models" / "plantdoc_resnet50_finetuned.pth"
MAIZE_MODEL_PATH = Path(__file__).parent.parent / "models" / "maize_resnet50.pth"
RICE_MODEL_PATH = Path(__file__).parent.parent / "models" / "rice_resnet50.pth"
LEGACY_PEST_MODEL_PATH = Path(__file__).parent.parent / "models" / "resnet50_0.497.pkl"

# Global variables for lazy-loaded models (initialized to None)
_plantdoc_model = None
_maize_model = None
_rice_model = None
_multi_model_detector = None
_pest_model = None

# Lazy loading getter functions
def get_plantdoc_model():
    """Lazy load PlantDoc model on first request"""
    global _plantdoc_model
    if _plantdoc_model is None:
        try:
            _plantdoc_model = PlantDocModelLoader(str(PLANTDOC_MODEL_PATH))
        except Exception as e:
            print(f"❌ Error loading PlantDoc model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load PlantDoc model: {str(e)}")
    return _plantdoc_model

def get_maize_model():
    """Lazy load Maize model on first request"""
    global _maize_model
    if _maize_model is None:
        try:
            _maize_model = MaizeModelLoader(str(MAIZE_MODEL_PATH))
        except Exception as e:
            print(f"❌ Error loading Maize model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load Maize model: {str(e)}")
    return _maize_model

def get_rice_model():
    """Lazy load Rice model on first request"""
    global _rice_model
    if _rice_model is None:
        try:
            _rice_model = RiceModelLoader(str(RICE_MODEL_PATH))
        except Exception as e:
            print(f"❌ Error loading Rice model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load Rice model: {str(e)}")
    return _rice_model

def get_multi_model_detector():
    """Lazy load multi-model detector on first request"""
    global _multi_model_detector
    if _multi_model_detector is None:
        try:
            # Load individual models
            plantdoc = get_plantdoc_model()
            maize = get_maize_model()
            rice = get_rice_model()
            _multi_model_detector = MultiModelDetector(plantdoc, maize, rice)
            print(f"✅ Multi-model detector initialized")
        except Exception as e:
            print(f"❌ Error initializing multi-model detector: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize multi-model detector: {str(e)}")
    return _multi_model_detector

def get_pest_model():
    """Lazy load legacy pest model on first request"""
    global _pest_model
    if _pest_model is None:
        try:
            _pest_model = PestModelLoader(str(LEGACY_PEST_MODEL_PATH))
        except Exception as e:
            print(f"❌ Error loading legacy pest model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load pest model: {str(e)}")
    return _pest_model

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

class SMSRequest(BaseModel):
    to: str
    message: str

class DetectionRequest(BaseModel):
    image: str  # base64 encoded image

class DetectionResponse(BaseModel):
    success: bool
    prediction: str = None
    confidence: float = None
    all_predictions: dict = None
    classes: list = None
    error: str = None

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
    return {"status": "ok"}

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

# --- Disease & Pest Detection Endpoints ---

@app.post("/detect-disease")
async def detect_disease(
    image: UploadFile = File(None),
    image_base64: str = Form(None)
):
    """Detect plant diseases using multi-model system with automatic best-model selection"""
    try:
        # Load image from either upload or base64
        if image:
            content = await image.read()
            img = load_image_from_bytes(content)
        elif image_base64:
            img = load_image_from_base64(image_base64)
        else:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Get multi-model detector (lazy load on first call)
        detector = get_multi_model_detector()
        
        # Run multi-model prediction
        result = detector.predict(img)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Disease detection error: {str(e)}")

@app.post("/detect-pest")
async def detect_pest(
    image: UploadFile = File(None),
    image_base64: str = Form(None)
):
    """Detect pests using the ResNet50-based model"""
    try:
        # Load image from either upload or base64
        if image:
            content = await image.read()
            img = load_image_from_bytes(content)
        elif image_base64:
            img = load_image_from_base64(image_base64)
        else:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Get pest model (lazy load on first call)
        pest_detector = get_pest_model()
        
        # Predict
        result = pest_detector.predict(img)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pest detection error: {str(e)}")

@app.post("/detect-combined")
async def detect_combined(
    image: UploadFile = File(None),
    image_base64: str = Form(None)
):
    """Run both multi-model disease detection and legacy pest detection on the same image"""
    try:
        # Load image from either upload or base64
        if image:
            content = await image.read()
            img = load_image_from_bytes(content)
        elif image_base64:
            img = load_image_from_base64(image_base64)
        else:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Get models (lazy load on first call)
        detector = get_multi_model_detector()
        pest_detector = get_pest_model()
        
        # Run both predictions
        disease_result = detector.predict(img)
        pest_result = pest_detector.predict(img)
        
        return {
            "disease": disease_result,
            "pest": pest_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Combined detection error: {str(e)}")

@app.post("/disease-treatment")
async def get_disease_treatment(disease_name: str = Form(...)):
    """Generate treatment recommendations for a detected disease using Gemini AI"""
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.")
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""As an agricultural expert, provide comprehensive treatment recommendations for the following plant disease: {disease_name}

Please provide detailed information in the following format:

**Disease Overview:**
Brief description of the disease and its impact on crops.

**Organic Solutions:**
- List 3-4 organic/natural treatment methods
- Include specific products or home remedies
- Mention application methods and frequency

**Chemical Treatments:**
- List recommended fungicides/pesticides (if necessary)
- Include dosage and safety precautions
- Mention when chemical treatment is absolutely necessary

**Preventive Measures:**
- List 4-5 preventive practices to avoid future infections
- Include crop rotation, spacing, and hygiene practices

**Treatment Timeline:**
- Expected time to see improvement
- When to reapply treatments
- Signs of recovery to look for

**Additional Tips:**
- Any other important information for farmers
- Environmental conditions to monitor

Keep the advice practical, specific, and easy to understand for farmers."""
        
        response = model.generate_content(prompt)
        return {"success": True, "treatment": response.text, "disease": disease_name}
    except Exception as e:
        print(f"Treatment recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Treatment recommendation error: {str(e)}")

@app.post("/send-sms")
async def send_sms(request: SMSRequest):
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="Twilio credentials not configured")
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message_args = {
            "to": request.to,
            "body": request.message
        }
        
        if TWILIO_MESSAGING_SERVICE_SID:
            message_args["messaging_service_sid"] = TWILIO_MESSAGING_SERVICE_SID
            
        message = client.messages.create(**message_args)
        
        return {"status": "success", "sid": message.sid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
