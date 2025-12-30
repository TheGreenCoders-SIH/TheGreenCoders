"""
Pydantic Schemas for Farm Management
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from datetime import datetime

class FarmBoundary(BaseModel):
    """GeoJSON Polygon for farm boundary"""
    type: str = Field(..., description="Must be 'Polygon'")
    coordinates: List[List[List[float]]] = Field(..., description="Array of coordinate rings")
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v != 'Polygon':
            raise ValueError('Geometry type must be Polygon')
        return v
    
    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if not v or not v[0]:
            raise ValueError('Coordinates cannot be empty')
        if len(v[0]) < 4:
            raise ValueError('Polygon must have at least 4 coordinates')
        # Check if polygon is closed
        if v[0][0] != v[0][-1]:
            raise ValueError('Polygon must be closed (first and last coordinates must match)')
        return v

class FarmCreate(BaseModel):
    """Schema for creating a new farm"""
    name: str = Field(..., min_length=1, max_length=100, description="Farm name")
    boundary: FarmBoundary = Field(..., description="Farm boundary as GeoJSON Polygon")
    area_hectares: Optional[float] = Field(None, gt=0, description="Farm area in hectares")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "North Field",
                "boundary": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.1234, 28.5678],
                            [77.1235, 28.5679],
                            [77.1236, 28.5677],
                            [77.1234, 28.5678]
                        ]
                    ]
                },
                "area_hectares": 2.5
            }
        }

class FarmUpdate(BaseModel):
    """Schema for updating farm details"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    boundary: Optional[FarmBoundary] = None
    area_hectares: Optional[float] = Field(None, gt=0)

class FarmResponse(BaseModel):
    """Schema for farm response"""
    farm_id: str
    farmer_id: str
    name: str
    boundary: FarmBoundary
    area_hectares: Optional[float]
    created_at: datetime
    last_analyzed: Optional[datetime]
    
    class Config:
        from_attributes = True

class CoordinateEntry(BaseModel):
    """Schema for manual coordinate entry"""
    coordinates: List[List[float]] = Field(..., description="List of [longitude, latitude] pairs")
    
    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) < 3:
            raise ValueError('At least 3 coordinates required to form a polygon')
        for coord in v:
            if len(coord) != 2:
                raise ValueError('Each coordinate must be [longitude, latitude]')
            lon, lat = coord
            if not (-180 <= lon <= 180):
                raise ValueError(f'Invalid longitude: {lon}')
            if not (-90 <= lat <= 90):
                raise ValueError(f'Invalid latitude: {lat}')
        return v
    
    def to_geojson(self) -> FarmBoundary:
        """Convert coordinates to GeoJSON Polygon"""
        # Close the polygon if not already closed
        coords = self.coordinates.copy()
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        
        return FarmBoundary(
            type="Polygon",
            coordinates=[coords]
        )
    
    class Config:
        json_schema_extra = {
            "example": {
                "coordinates": [
                    [77.1234, 28.5678],
                    [77.1235, 28.5679],
                    [77.1236, 28.5677]
                ]
            }
        }
