from flask import Flask, request, jsonify
import requests
from twilio.rest import Client
import os
from datetime import datetime

app = Flask(__name__)

# Vercel Middleware to strip /api/sms prefix
class ReverseProxyPrefixFix:
    def __init__(self, app, prefix=''):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            if not environ['PATH_INFO'].startswith('/'):
                 environ['PATH_INFO'] = '/' + environ['PATH_INFO']
        return self.app(environ, start_response)

# Apply middleware
app.wsgi_app = ReverseProxyPrefixFix(app.wsgi_app, prefix='/api/sms')

# ThingSpeak Configuration
THINGSPEAK_CHANNEL = "3197650"
THINGSPEAK_READ_KEY = "ZFHYERA4JQZSSJVI"

# Twilio Configuration (Add your credentials here)
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "YOUR_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "YOUR_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "YOUR_TWILIO_NUMBER")

# Initialize Twilio client
try:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    TWILIO_ENABLED = True
except Exception as e:
    print(f"Twilio not configured: {e}")
    TWILIO_ENABLED = False

# SMS Code Mappings
SMS_CODES = {
    "1234": {
        "field": 1,
        "name": "Soil Moisture",
        "unit": "%",
        "marathi": "माती ओलावा"
    },
    "5678": {
        "field": 2,
        "name": "Temperature",
        "unit": "°C",
        "marathi": "तापमान"
    },
    "9012": {
        "field": 3,
        "name": "Humidity",
        "unit": "%",
        "marathi": "आर्द्रता"
    },
    "3456": {
        "field": 4,
        "name": "NPK Values",
        "unit": "",
        "marathi": "NPK मूल्ये"
    }
}

def get_thingspeak_data(field_number):
    """Fetch latest data from ThingSpeak for a specific field"""
    try:
        url = f"https://api.thingspeak.com/channels/{THINGSPEAK_CHANNEL}/fields/{field_number}.json"
        params = {
            "api_key": THINGSPEAK_READ_KEY,
            "results": 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("feeds") and len(data["feeds"]) > 0:
            latest_feed = data["feeds"][0]
            field_key = f"field{field_number}"
            value = latest_feed.get(field_key, "N/A")
            timestamp = latest_feed.get("created_at", "")
            
            return {
                "success": True,
                "value": value,
                "timestamp": timestamp
            }
        else:
            return {
                "success": False,
                "error": "No data available"
            }
            
    except requests.exceptions.RequestException as e:
        print(f"ThingSpeak API Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def send_sms(to_number, message):
    """Send SMS using Twilio"""
    if not TWILIO_ENABLED:
        print(f"[TEST MODE] Would send to {to_number}: {message}")
        return {"success": True, "mode": "test"}
    
    try:
        message_obj = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print(f"SMS sent successfully. SID: {message_obj.sid}")
        return {"success": True, "sid": message_obj.sid}
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return {"success": False, "error": str(e)}

@app.route("/", methods=["GET"])
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "GreenCoders SMS Backend",
        "thingspeak_channel": THINGSPEAK_CHANNEL,
        "twilio_enabled": TWILIO_ENABLED,
        "available_codes": list(SMS_CODES.keys())
    })

@app.route("/incoming-sms", methods=["POST"])
def incoming_sms():
    """Handle incoming SMS from Twilio webhook"""
    try:
        # Get SMS details
        from_number = request.form.get("From", "Unknown")
        body = request.form.get("Body", "").strip()
        
        print(f"\n[{datetime.now()}] Incoming SMS from {from_number}: {body}")
        
        # Check if code is valid
        if body not in SMS_CODES:
            error_message = (
                "Invalid code. Available codes:\n"
                "1234 - Soil Moisture\n"
                "5678 - Temperature\n"
                "9012 - Humidity\n"
                "3456 - NPK Values"
            )
            send_sms(from_number, error_message)
            return error_message, 200
        
        # Get sensor configuration
        sensor_config = SMS_CODES[body]
        field_number = sensor_config["field"]
        sensor_name = sensor_config["name"]
        unit = sensor_config["unit"]
        
        # Fetch data from ThingSpeak
        result = get_thingspeak_data(field_number)
        
        if result["success"]:
            value = result["value"]
            timestamp = result["timestamp"]
            
            # Format response message
            message = f"{sensor_name}: {value}{unit}\nTime: {timestamp}"
            
            # Send SMS response
            send_sms(from_number, message)
            
            print(f"✓ Sent response: {message}")
            return message, 200
        else:
            error_message = f"Error fetching {sensor_name} data: {result.get('error', 'Unknown error')}"
            send_sms(from_number, error_message)
            return error_message, 200
            
    except Exception as e:
        error_message = f"System error: {str(e)}"
        print(f"✗ Error: {error_message}")
        return error_message, 500

@app.route("/test-thingspeak", methods=["GET"])
def test_thingspeak():
    """Test endpoint to verify ThingSpeak connection"""
    field = request.args.get("field", "1")
    result = get_thingspeak_data(int(field))
    return jsonify(result)

@app.route("/test-sms", methods=["POST"])
def test_sms():
    """Test endpoint to send a test SMS"""
    data = request.get_json()
    to_number = data.get("to")
    message = data.get("message", "Test message from GreenCoders")
    
    if not to_number:
        return jsonify({"error": "Phone number required"}), 400
    
    result = send_sms(to_number, message)
    return jsonify(result)

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🌱 GreenCoders SMS Backend Server")
    print("="*50)
    print(f"ThingSpeak Channel: {THINGSPEAK_CHANNEL}")
    print(f"Twilio Enabled: {TWILIO_ENABLED}")
    print(f"Available SMS Codes: {', '.join(SMS_CODES.keys())}")
    print("="*50 + "\n")
    
    # Run Flask app
    app.run(host="0.0.0.0", port=5000, debug=True)
