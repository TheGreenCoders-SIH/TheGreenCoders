"""
Pydantic Schemas for Analytics
"""

from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict
from datetime import datetime, date

class NDVIStats(BaseModel):
    """NDVI statistical metrics"""
    mean: Optional[float] = Field(None, ge=-1, le=1)
    min: Optional[float] = Field(None, ge=-1, le=1)
    max: Optional[float] = Field(None, ge=-1, le=1)
    std: Optional[float] = Field(None, ge=0)
    percentile_25: Optional[float] = None
    percentile_50: Optional[float] = None
    percentile_75: Optional[float] = None
    count: int = Field(0, ge=0)
    histogram: Optional[Dict] = None
    classification: Optional[Dict] = None

class NDMIStats(BaseModel):
    """NDMI statistical metrics"""
    mean: Optional[float] = Field(None, ge=-1, le=1)
    min: Optional[float] = Field(None, ge=-1, le=1)
    max: Optional[float] = Field(None, ge=-1, le=1)
    std: Optional[float] = Field(None, ge=0)
    classification: Optional[Dict] = None

class SoilMoisture(BaseModel):
    """Soil moisture estimation"""
    moisture_percentage: float = Field(..., ge=0, le=100)
    category: str
    unit: str = "percentage"
    confidence: str = "estimated"

class IrrigationRecommendation(BaseModel):
    """Irrigation recommendation"""
    recommendation: str
    priority: str
    action: str
    reason: str

class OverallHealth(BaseModel):
    """Overall farm health assessment"""
    score: float = Field(..., ge=0, le=100)
    status: str
    color: str
    description: str

class SatelliteMetadata(BaseModel):
    """Satellite data metadata"""
    provider: str = "SentinelHub"
    acquisition_date: Optional[str] = None
    cloud_coverage: float = Field(0, ge=0, le=100)
    bbox: List[float]

class AnalyticsResponse(BaseModel):
    """Complete analytics response"""
    analysis_date: str
    satellite_data: SatelliteMetadata
    ndvi: NDVIStats
    ndmi: NDMIStats
    soil_moisture: SoilMoisture
    irrigation: IrrigationRecommendation
    overall_health: OverallHealth
    
    class Config:
        json_schema_extra = {
            "example": {
                "analysis_date": "2025-12-05",
                "satellite_data": {
                    "provider": "SentinelHub",
                    "acquisition_date": "2025-12-04T10:30:00Z",
                    "cloud_coverage": 5.2,
                    "bbox": [77.1234, 28.5678, 77.1236, 28.5679]
                },
                "ndvi": {
                    "mean": 0.72,
                    "min": 0.45,
                    "max": 0.89,
                    "std": 0.12,
                    "classification": {
                        "category": "Very Healthy Vegetation",
                        "health": "Excellent"
                    }
                },
                "ndmi": {
                    "mean": 0.45,
                    "classification": {
                        "category": "Very Moist",
                        "moisture_level": "High"
                    }
                },
                "soil_moisture": {
                    "moisture_percentage": 65.5,
                    "category": "Moist"
                },
                "irrigation": {
                    "recommendation": "No irrigation needed",
                    "priority": "Low",
                    "action": "Monitor regularly"
                },
                "overall_health": {
                    "score": 85.5,
                    "status": "Excellent",
                    "color": "#006400"
                }
            }
        }

class AnalysisRequest(BaseModel):
    """Request to trigger farm analysis"""
    analysis_date: Optional[date] = Field(None, description="Target date for analysis (defaults to today)")
    lookback_days: int = Field(10, ge=1, le=30, description="Days to look back for satellite data")

class HistoricalDataPoint(BaseModel):
    """Single point in historical time series"""
    date: str
    ndvi: Dict
    ndmi: Dict
    health_status: str

class HistoricalAnalyticsRequest(BaseModel):
    """Request for historical analytics"""
    start_date: date = Field(..., description="Start date for historical data")
    end_date: date = Field(..., description="End date for historical data")
    interval_days: int = Field(5, ge=1, le=30, description="Interval between data points")
    
    @model_validator(mode='after')
    def validate_date_range(self):
        if self.end_date < self.start_date:
            raise ValueError('end_date must be after start_date')
        return self

class HistoricalAnalyticsResponse(BaseModel):
    """Response with historical analytics"""
    farm_id: str
    start_date: str
    end_date: str
    data_points: List[HistoricalDataPoint]
    total_points: int

class FarmerHistoryItem(BaseModel):
    """Single item in farmer's analysis history"""
    history_id: str
    farm_id: str
    farm_name: str
    timestamp: datetime
    status: str
    summary: Dict

class FarmerHistoryResponse(BaseModel):
    """Farmer's complete analysis history"""
    farmer_id: str
    total_analyses: int
    history: List[FarmerHistoryItem]
