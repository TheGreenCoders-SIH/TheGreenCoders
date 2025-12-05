# Model Files Setup

The machine learning model files are not included in this repository due to their large size (90+ MB each). 

## Required Model Files

Place the following files in the `models/` directory:

1. **crop_model.pkl** - Crop recommendation model
2. **maize_resnet50.pth** - Maize disease detection model
3. **plantdoc_resnet50_finetuned.pth** - PlantDoc disease detection model  
4. **rice_resnet50.pth** - Rice disease detection model

## Model File Locations

These files should be obtained from:
- Your training pipeline
- Team shared drive
- Model training outputs

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

2. Install Python dependencies:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

3. Install Node dependencies:
```bash
npm install
```

## Running the Application

Use the provided startup script:
```bash
.\start.bat  # On Windows
./start.sh   # On Linux/Mac
```

This will start both the backend (port 8000) and frontend (port 5173) servers.
