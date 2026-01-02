# GreenCoders SMS Backend

SMS-based IoT data retrieval system for farmers to access sensor data offline via simple text messages.

## 🌟 Features

- **SMS-based queries**: Farmers send a code, receive sensor data
- **ThingSpeak integration**: Fetches real-time IoT sensor data
- **Twilio SMS**: Sends automated responses
- **Multiple sensors**: Soil moisture, temperature, humidity, NPK values
- **No internet required**: Farmers only need basic SMS capability
- **Marathi support**: Ready for localization

## 📋 Prerequisites

- Python 3.8 or higher
- Twilio account (free trial works)
- ngrok (for local testing)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd sms_backend
pip install -r requirements.txt
```

### Step 2: Configure Twilio Credentials

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and Phone Number
3. Create a `.env` file (copy from `.env.example`):

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

Or set environment variables:

```bash
# Windows
set TWILIO_ACCOUNT_SID=your_sid
set TWILIO_AUTH_TOKEN=your_token
set TWILIO_PHONE_NUMBER=+1234567890

# Linux/Mac
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Run the Server

```bash
python app.py
```

You should see:

```
==================================================
🌱 GreenCoders SMS Backend Server
==================================================
ThingSpeak Channel: 3197650
Twilio Enabled: True
Available SMS Codes: 1234, 5678, 9012, 3456
==================================================

 * Running on http://0.0.0.0:5000
```

### Step 4: Expose with ngrok

In a new terminal:

```bash
ngrok http 5000
```

You'll get a public URL like:

```
https://e3bd-102-56-112-43.ngrok-free.app
```

### Step 5: Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Phone Numbers → Active Numbers → Your Number**
3. Under **Messaging**, set:
   - **A message comes in**: `https://your-ngrok-url.ngrok-free.app/incoming-sms`
   - Method: `HTTP POST`
4. Click **Save**

## 📱 SMS Codes

Farmers can send these codes to get sensor data:

| Code | Sensor Data | Response Example |
|------|-------------|------------------|
| `1234` | Soil Moisture | `Soil Moisture: 45%` |
| `5678` | Temperature | `Temperature: 28°C` |
| `9012` | Humidity | `Humidity: 65%` |
| `3456` | NPK Values | `NPK Values: 120:80:100` |

## 🧪 Testing

### Test ThingSpeak Connection

```bash
curl http://localhost:5000/test-thingspeak?field=1
```

### Test SMS Sending (requires Twilio setup)

```bash
curl -X POST http://localhost:5000/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+919876543210", "message": "Test from GreenCoders"}'
```

### Test Full Flow

1. Send SMS to your Twilio number: `1234`
2. Check terminal logs
3. Receive SMS response with sensor data

## 📊 ThingSpeak Configuration

Already configured:
- **Channel ID**: 3197650
- **Read API Key**: ZFHYERA4JQZSSJVI

### Field Mapping

- Field 1: Soil Moisture
- Field 2: Temperature
- Field 3: Humidity
- Field 4: NPK Values

## 🔧 API Endpoints

### `GET /`
Health check and service info

### `POST /incoming-sms`
Twilio webhook endpoint (receives SMS)

### `GET /test-thingspeak?field=1`
Test ThingSpeak data retrieval

### `POST /test-sms`
Send test SMS

## 🚀 Deployment Options

### Option 1: Keep ngrok Running (Quick & Easy)
- Free tier works for testing
- Restart ngrok if URL expires
- Update Twilio webhook with new URL

### Option 2: Deploy to Cloud (Production)

**Heroku (Free Tier)**
```bash
heroku create greencoders-sms
git push heroku main
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
heroku config:set TWILIO_PHONE_NUMBER=xxx
```

**Railway.app**
```bash
railway init
railway up
```

**PythonAnywhere**
- Upload files
- Configure WSGI
- Set environment variables

## 🌍 Adding Marathi Support

Modify the response in `app.py`:

```python
# English + Marathi response
message = f"{sensor_name}: {value}{unit}\n{sensor_config['marathi']}: {value}{unit}"
```

## 🐛 Troubleshooting

**SMS not received?**
- Check Twilio webhook URL is correct
- Verify ngrok is running
- Check Flask logs for errors

**ThingSpeak data not fetching?**
- Test endpoint: `/test-thingspeak?field=1`
- Verify channel ID and API key
- Check internet connection

**Twilio errors?**
- Verify credentials in `.env`
- Check phone number format: `+[country code][number]`
- Ensure account has credits

## 📝 Example Logs

```
[2025-12-09 16:00:00] Incoming SMS from +919876543210: 1234
✓ Sent response: Soil Moisture: 45%
Time: 2025-12-09T10:30:00Z
```

## 🎯 Next Steps

1. ✅ Test locally with ngrok
2. ✅ Verify SMS flow works
3. 🔄 Add more sensor codes
4. 🌍 Add Marathi translations
5. 🚀 Deploy to production server
6. 📊 Add usage analytics
7. 🔔 Add alert thresholds

## 📞 Support

For issues or questions, check the main project README or create an issue.

---

**Built with ❤️ for Indian Farmers by GreenCoders**
