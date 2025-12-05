"""
Farm Management API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import firebase_admin
from firebase_admin import firestore
from datetime import datetime
import uuid

from ..schemas.farm_schemas import (
    FarmCreate,
    FarmUpdate,
    FarmResponse,
    CoordinateEntry,
    FarmBoundary
)
from ..utils.firebase_helper import get_current_user, get_firestore_client

router = APIRouter(prefix="/farms", tags=["farms"])

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    farm_data: FarmCreate,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Create a new farm with boundary polygon
    
    - **name**: Farm name
    - **boundary**: GeoJSON Polygon with coordinates
    - **area_hectares**: Optional farm area in hectares
    """
    try:
        farm_id = str(uuid.uuid4())
        farmer_id = current_user['uid']
        
        farm_doc = {
            'farm_id': farm_id,
            'farmer_id': farmer_id,
            'name': farm_data.name,
            'boundary': farm_data.boundary.dict(),
            'area_hectares': farm_data.area_hectares,
            'created_at': datetime.utcnow(),
            'last_analyzed': None
        }
        
        # Save to Firestore
        db.collection('farms').document(farm_id).set(farm_doc)
        
        return FarmResponse(**farm_doc)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create farm: {str(e)}"
        )

@router.post("/from-coordinates", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm_from_coordinates(
    farm_name: str,
    coordinates: CoordinateEntry,
    area_hectares: float = None,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Create a farm from manual coordinate entry
    
    - **farm_name**: Name for the farm
    - **coordinates**: List of [longitude, latitude] pairs
    - **area_hectares**: Optional farm area
    """
    try:
        # Convert coordinates to GeoJSON
        boundary = coordinates.to_geojson()
        
        farm_data = FarmCreate(
            name=farm_name,
            boundary=boundary,
            area_hectares=area_hectares
        )
        
        return await create_farm(farm_data, current_user, db)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid coordinates: {str(e)}"
        )

@router.get("", response_model=List[FarmResponse])
async def list_farms(
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    List all farms for the authenticated farmer
    """
    try:
        farmer_id = current_user['uid']
        
        farms_ref = db.collection('farms').where('farmer_id', '==', farmer_id)
        farms = farms_ref.stream()
        
        farm_list = []
        for farm in farms:
            farm_data = farm.to_dict()
            farm_list.append(FarmResponse(**farm_data))
        
        return farm_list
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve farms: {str(e)}"
        )

@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Get details of a specific farm
    """
    try:
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        farm_data = farm.to_dict()
        
        # Verify ownership
        if farm_data['farmer_id'] != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this farm"
            )
        
        return FarmResponse(**farm_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve farm: {str(e)}"
        )

@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: str,
    farm_update: FarmUpdate,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Update farm details
    """
    try:
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        farm_data = farm.to_dict()
        
        # Verify ownership
        if farm_data['farmer_id'] != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this farm"
            )
        
        # Update fields
        update_data = farm_update.dict(exclude_unset=True)
        if update_data:
            farm_ref.update(update_data)
            farm_data.update(update_data)
        
        return FarmResponse(**farm_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update farm: {str(e)}"
        )

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Delete a farm
    """
    try:
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        farm_data = farm.to_dict()
        
        # Verify ownership
        if farm_data['farmer_id'] != current_user['uid']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this farm"
            )
        
        # Delete farm and associated analytics
        farm_ref.delete()
        
        # Delete associated analytics
        analytics_ref = db.collection('farm_analytics').where('farm_id', '==', farm_id)
        for doc in analytics_ref.stream():
            doc.reference.delete()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete farm: {str(e)}"
        )
