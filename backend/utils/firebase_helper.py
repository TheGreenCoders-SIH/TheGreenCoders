"""
Firebase Helper Utilities
Authentication and Firestore client management
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from pathlib import Path
from typing import Optional

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Try to load credentials from environment or file
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
        
        if cred_path and Path(cred_path).exists():
            cred = credentials.Certificate(cred_path)
        else:
            # Use default credentials or application default
            cred = credentials.ApplicationDefault()
        
        firebase_admin.initialize_app(cred, {
            'projectId': os.getenv('FIREBASE_PROJECT_ID'),
        })

# Initialize on module import
initialize_firebase()

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Firebase ID token and return user information
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        Dictionary with user information (uid, email, etc.)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Extract token from Bearer scheme
        token = credentials.credentials
        
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        
        # Return user information
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'name': decoded_token.get('name'),
        }
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_firestore_client() -> firestore.Client:
    """
    Get Firestore client instance
    
    Returns:
        Firestore client
    """
    return firestore.client()

async def verify_farm_ownership(
    farm_id: str,
    farmer_id: str,
    db: firestore.Client
) -> bool:
    """
    Verify that a farmer owns a specific farm
    
    Args:
        farm_id: Farm document ID
        farmer_id: Farmer user ID
        db: Firestore client
        
    Returns:
        True if farmer owns the farm, False otherwise
    """
    try:
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            return False
        
        farm_data = farm.to_dict()
        return farm_data.get('farmer_id') == farmer_id
        
    except Exception:
        return False

class FirebaseAuthMiddleware:
    """Middleware for Firebase authentication"""
    
    @staticmethod
    async def authenticate_request(token: str) -> Optional[dict]:
        """
        Authenticate a request using Firebase ID token
        
        Args:
            token: Firebase ID token
            
        Returns:
            User information if valid, None otherwise
        """
        try:
            decoded_token = auth.verify_id_token(token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'email_verified': decoded_token.get('email_verified', False),
            }
        except Exception:
            return None
