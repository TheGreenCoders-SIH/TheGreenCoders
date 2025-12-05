"""
Analytics API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from firebase_admin import firestore
from datetime import datetime
import uuid
import logging

from ..schemas.analytics_schemas import (
    AnalysisRequest,
    AnalyticsResponse,
    HistoricalAnalyticsRequest,
    HistoricalAnalyticsResponse,
    FarmerHistoryResponse
)
from ..services.analytics_processor import AnalyticsProcessor
from ..utils.firebase_helper import get_current_user, get_firestore_client

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

analytics_processor = AnalyticsProcessor()

@router.post("/farms/{farm_id}/analyze", response_model=AnalyticsResponse)
async def analyze_farm(
    farm_id: str,
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Trigger satellite analysis for a farm
    
    - **farm_id**: ID of the farm to analyze
    - **analysis_date**: Optional target date (defaults to today)
    - **lookback_days**: Days to look back for satellite data
    """
    try:
        farmer_id = current_user['uid']
        
        # Get farm details
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        farm_data = farm.to_dict()
        
        # Verify ownership
        if farm_data['farmer_id'] != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to analyze this farm"
            )
        
        # Process analysis
        logger.info(f"Starting analysis for farm {farm_id}")
        
        analysis_date_str = request.analysis_date.isoformat() if request.analysis_date else None
        
        analytics = await analytics_processor.process_farm_analysis(
            farm_boundary=farm_data['boundary'],
            analysis_date=analysis_date_str,
            lookback_days=request.lookback_days
        )
        
        # Save analytics to database
        analytics_id = str(uuid.uuid4())
        analytics_doc = {
            'analytics_id': analytics_id,
            'farm_id': farm_id,
            'farmer_id': farmer_id,
            **analytics,
            'created_at': datetime.utcnow()
        }
        
        db.collection('farm_analytics').document(analytics_id).set(analytics_doc)
        
        # Update farm's last_analyzed timestamp
        farm_ref.update({'last_analyzed': datetime.utcnow()})
        
        # Add to history
        history_doc = {
            'history_id': str(uuid.uuid4()),
            'farmer_id': farmer_id,
            'farm_id': farm_id,
            'analytics_id': analytics_id,
            'timestamp': datetime.utcnow(),
            'status': 'completed',
            'summary': {
                'ndvi_health': analytics['ndvi']['classification']['health'],
                'moisture_level': analytics['soil_moisture']['category'],
                'overall_status': analytics['overall_health']['status']
            }
        }
        
        db.collection('analysis_history').add(history_doc)
        
        logger.info(f"Analysis completed for farm {farm_id}")
        
        return AnalyticsResponse(**analytics)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed for farm {farm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@router.get("/farms/{farm_id}/latest", response_model=AnalyticsResponse)
async def get_latest_analytics(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Get the latest analytics for a farm
    """
    try:
        farmer_id = current_user['uid']
        
        # Verify farm ownership
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        if farm.to_dict()['farmer_id'] != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get latest analytics
        analytics_ref = (
            db.collection('farm_analytics')
            .where('farm_id', '==', farm_id)
            .order_by('created_at', direction=firestore.Query.DESCENDING)
            .limit(1)
        )
        
        analytics_docs = list(analytics_ref.stream())
        
        if not analytics_docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No analytics found for this farm"
            )
        
        analytics_data = analytics_docs[0].to_dict()
        
        return AnalyticsResponse(**analytics_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analytics: {str(e)}"
        )

@router.post("/farms/{farm_id}/history", response_model=HistoricalAnalyticsResponse)
async def get_historical_analytics(
    farm_id: str,
    request: HistoricalAnalyticsRequest,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Get historical NDVI and moisture data for a farm
    
    - **start_date**: Start date for historical data
    - **end_date**: End date for historical data
    - **interval_days**: Interval between data points (default: 5 days)
    """
    try:
        farmer_id = current_user['uid']
        
        # Verify farm ownership
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found"
            )
        
        farm_data = farm.to_dict()
        
        if farm_data['farmer_id'] != farmer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get historical data
        logger.info(f"Retrieving historical data for farm {farm_id}")
        
        historical_data = await analytics_processor.get_historical_analytics(
            farm_boundary=farm_data['boundary'],
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            interval_days=request.interval_days
        )
        
        return HistoricalAnalyticsResponse(
            farm_id=farm_id,
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            data_points=historical_data,
            total_points=len(historical_data)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve historical data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve historical data: {str(e)}"
        )

@router.get("/farmer/history", response_model=FarmerHistoryResponse)
async def get_farmer_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Get all analysis history for the authenticated farmer
    
    - **limit**: Maximum number of history items to return
    """
    try:
        farmer_id = current_user['uid']
        
        # Get analysis history
        history_ref = (
            db.collection('analysis_history')
            .where('farmer_id', '==', farmer_id)
            .order_by('timestamp', direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        
        history_docs = history_ref.stream()
        
        history_items = []
        for doc in history_docs:
            history_data = doc.to_dict()
            
            # Get farm name
            farm_ref = db.collection('farms').document(history_data['farm_id'])
            farm = farm_ref.get()
            farm_name = farm.to_dict()['name'] if farm.exists else "Unknown Farm"
            
            history_items.append({
                'history_id': history_data['history_id'],
                'farm_id': history_data['farm_id'],
                'farm_name': farm_name,
                'timestamp': history_data['timestamp'],
                'status': history_data['status'],
                'summary': history_data['summary']
            })
        
        return FarmerHistoryResponse(
            farmer_id=farmer_id,
            total_analyses=len(history_items),
            history=history_items
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve history: {str(e)}"
        )

@router.get("/farms/{farm_id}/ndvi-timeline")
async def get_ndvi_timeline(
    farm_id: str,
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: firestore.Client = Depends(get_firestore_client)
):
    """
    Get NDVI time series for the last N days
    """
    try:
        farmer_id = current_user['uid']
        
        # Verify farm ownership
        farm_ref = db.collection('farms').document(farm_id)
        farm = farm_ref.get()
        
        if not farm.exists or farm.to_dict()['farmer_id'] != farmer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        
        # Get analytics from last N days
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        analytics_ref = (
            db.collection('farm_analytics')
            .where('farm_id', '==', farm_id)
            .where('created_at', '>=', cutoff_date)
            .order_by('created_at')
        )
        
        timeline = []
        for doc in analytics_ref.stream():
            data = doc.to_dict()
            timeline.append({
                'date': data['analysis_date'],
                'ndvi_mean': data['ndvi']['mean'],
                'health_status': data['ndvi']['classification']['health']
            })
        
        return {'farm_id': farm_id, 'timeline': timeline}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
