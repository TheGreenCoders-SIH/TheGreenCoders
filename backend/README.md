# FastAPI Backend Setup

## Installation

1. **Create Python Virtual Environment**:
```bash
cd backend
python -m venv venv
```

2. **Activate Virtual Environment**:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

3. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

## Running the Backend

```bash
# From backend directory
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once running, view interactive docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### `GET /`
Health check endpoint

### `GET /health`
Check API and model status

### `POST /predict`
Get crop recommendation for single soil sample

**Request Body**:
```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 20.8,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 202.9
}
```

**Response**:
```json
{
  "crop": "rice",
  "confidence": 0.95,
  "all_predictions": {
    "rice": 0.95,
    "wheat": 0.03,
    "maize": 0.01
  }
}
```

### `POST /batch-predict`
Get recommendations for multiple samples

## Environment Variables

Add to your `.env` file:
```
VITE_ML_API_URL=http://localhost:8000
```

## Testing the API

```bash
# Test with curl
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.8,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9
  }'
```

## Integration with Frontend

The frontend will automatically use ML predictions when the backend is running. If the backend is offline, it falls back to CSV-based recommendations.

## Model Requirements

Place your trained model at: `models/crop_model.pkl`

The model should accept 7 features:
1. N (Nitrogen)
2. P (Phosphorus)
3. K (Potassium)
4. Temperature
5. Humidity
6. pH
7. Rainfall

And should have `predict()` and optionally `predict_proba()` methods (sklearn compatible).
