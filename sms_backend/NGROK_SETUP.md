# ngrok Installation and Setup Guide

## Option 1: Download and Install ngrok (Recommended)

### Step 1: Download ngrok
1. Go to https://ngrok.com/download
2. Download the Windows version (ZIP file)
3. Extract the ZIP file to a folder (e.g., `C:\ngrok`)

### Step 2: Add to PATH (Optional but recommended)
1. Right-click "This PC" → Properties → Advanced System Settings
2. Click "Environment Variables"
3. Under "System Variables", find "Path" and click "Edit"
4. Click "New" and add the folder where you extracted ngrok (e.g., `C:\ngrok`)
5. Click OK on all dialogs
6. **Restart PowerShell** for changes to take effect

### Step 3: Sign up and authenticate (Required)
1. Sign up at https://dashboard.ngrok.com/signup
2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Run in PowerShell:
```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Step 4: Run ngrok
```powershell
ngrok http 5000
```

---

## Option 2: Use ngrok without installation (Quick Test)

If you just want to test quickly without adding to PATH:

1. Download and extract ngrok to any folder
2. Navigate to that folder in PowerShell:
```powershell
cd C:\path\to\ngrok\folder
.\ngrok http 5000
```

---

## Option 3: Alternative - Use localtunnel (No signup required)

If you want a simpler alternative:

### Install localtunnel
```powershell
npm install -g localtunnel
```

### Run localtunnel
```powershell
lt --port 5000
```

You'll get a URL like: `https://random-name.loca.lt`

---

## Testing the Flask Backend First

Before setting up ngrok, let's test the Flask backend locally:

### Step 1: Install Python dependencies
```powershell
cd sms_backend
pip install -r requirements.txt
```

### Step 2: Run Flask server
```powershell
python app.py
```

You should see:
```
==================================================
🌱 GreenCoders SMS Backend Server
==================================================
ThingSpeak Channel: 3197650
Twilio Enabled: False
Available SMS Codes: 1234, 5678, 9012, 3456
==================================================

 * Running on http://0.0.0.0:5000
```

### Step 3: Test in browser
Open: http://localhost:5000

You should see JSON response with server status.

### Step 4: Test ThingSpeak connection
Open: http://localhost:5000/test-thingspeak?field=1

This will fetch real data from ThingSpeak.

---

## After ngrok is running

Once you have ngrok running, you'll see:

```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5000
```

Copy that HTTPS URL and use it in Twilio webhook configuration:
```
https://abc123.ngrok-free.app/incoming-sms
```

---

## Quick Commands Summary

```powershell
# Install dependencies
cd sms_backend
pip install -r requirements.txt

# Run Flask server (Terminal 1)
python app.py

# Run ngrok (Terminal 2 - after installing)
ngrok http 5000

# OR use localtunnel instead
npm install -g localtunnel
lt --port 5000
```
