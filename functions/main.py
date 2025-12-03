import os
import sys
from firebase_functions import https_fn
from firebase_admin import initialize_app

# Initialize Firebase Admin
initialize_app()

# Add current directory to path so we can import backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the FastAPI app
from backend.main import app as fastapi_app

# Expose the app for Cloud Functions
# This works because Cloud Functions for Python uses Gunicorn/Uvicorn
# and can detect the 'app' object if we point to it, 
# OR we can use the https_fn wrapper if we want specific triggers.
# For 2nd Gen, we can just expose the ASGI app.

from firebase_functions import https_fn, options

@https_fn.on_request(
    region="asia-south1",
    memory=options.MemoryOption.GB_1,
    timeout_sec=300,
)
def api(req: https_fn.Request) -> https_fn.Response:
    # This is a WSGI to ASGI adapter approach or similar
    # But actually, for FastAPI on Functions, it's often easier to use
    # the 'mangum' adapter or similar if we were on AWS Lambda,
    # but on Cloud Run (which Functions v2 is built on), we can just run the container.
    
    # However, since we are using the "functions" deployment method:
    from werkzeug.middleware.dispatcher import DispatcherMiddleware
    from werkzeug.wrappers import Request, Response
    
    # We need an adapter. A simple way is to use the `functions-framework` 
    # which wraps the app. But `https_fn` expects a standard request/response.
    
    # Let's try a simpler approach: 
    # We will use the `functions_framework` directly in a separate file if needed,
    # but here we can use a library like `a2wsgi` to convert ASGI to WSGI
    # because `https_fn.on_request` gives us a standard HTTP request.
    
    # For now, let's use a known working pattern for FastAPI on Firebase Functions:
    # We'll use `google-cloud-functions-framework` implicitly.
    
    pass

# REVISION:
# The easiest way to deploy FastAPI to Cloud Functions 2nd Gen is NOT to use `firebase deploy --only functions`
# if we want full FastAPI capabilities easily. 
# BUT, if we MUST use `firebase deploy`, we need to wrap it.
# A better way is to use `a2wsgi`.

from a2wsgi import ASGIMiddleware
wsgi_app = ASGIMiddleware(fastapi_app)

@https_fn.on_request(
    region="asia-south1",
    memory=options.MemoryOption.GB_1,
    timeout_sec=300,
)
def api(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response.from_app(wsgi_app, req)
