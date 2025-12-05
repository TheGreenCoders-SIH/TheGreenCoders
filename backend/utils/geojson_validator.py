"""
GeoJSON Validation Utilities
"""

from typing import List, Dict, Tuple
from shapely.geometry import Polygon, shape
from shapely.validation import explain_validity
import json

class GeoJSONValidator:
    """Validator for GeoJSON geometries"""
    
    @staticmethod
    def validate_polygon(geojson: Dict) -> Tuple[bool, str]:
        """
        Validate a GeoJSON Polygon
        
        Args:
            geojson: GeoJSON dictionary
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check type
            if geojson.get('type') != 'Polygon':
                return False, "Geometry type must be 'Polygon'"
            
            # Check coordinates
            if 'coordinates' not in geojson:
                return False, "Missing 'coordinates' field"
            
            coordinates = geojson['coordinates']
            
            if not coordinates or not coordinates[0]:
                return False, "Coordinates cannot be empty"
            
            # Check minimum points
            if len(coordinates[0]) < 4:
                return False, "Polygon must have at least 4 coordinates"
            
            # Check if closed
            if coordinates[0][0] != coordinates[0][-1]:
                return False, "Polygon must be closed (first and last coordinates must match)"
            
            # Validate with Shapely
            try:
                polygon = shape(geojson)
                
                if not polygon.is_valid:
                    return False, f"Invalid polygon: {explain_validity(polygon)}"
                
                # Check if polygon is too small
                if polygon.area < 1e-10:
                    return False, "Polygon area is too small"
                
                return True, "Valid polygon"
                
            except Exception as e:
                return False, f"Shapely validation failed: {str(e)}"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    @staticmethod
    def validate_coordinates(coordinates: List[List[float]]) -> Tuple[bool, str]:
        """
        Validate coordinate list
        
        Args:
            coordinates: List of [longitude, latitude] pairs
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if len(coordinates) < 3:
                return False, "At least 3 coordinates required"
            
            for i, coord in enumerate(coordinates):
                if len(coord) != 2:
                    return False, f"Coordinate {i} must be [longitude, latitude]"
                
                lon, lat = coord
                
                if not isinstance(lon, (int, float)) or not isinstance(lat, (int, float)):
                    return False, f"Coordinate {i} must contain numeric values"
                
                if not (-180 <= lon <= 180):
                    return False, f"Invalid longitude at coordinate {i}: {lon}"
                
                if not (-90 <= lat <= 90):
                    return False, f"Invalid latitude at coordinate {i}: {lat}"
            
            return True, "Valid coordinates"
            
        except Exception as e:
            return False, f"Coordinate validation error: {str(e)}"
    
    @staticmethod
    def calculate_area(geojson: Dict) -> float:
        """
        Calculate area of a polygon in square meters
        
        Args:
            geojson: GeoJSON Polygon
            
        Returns:
            Area in square meters
        """
        try:
            polygon = shape(geojson)
            
            # Convert to projected CRS for accurate area calculation
            # For simplicity, using approximate calculation
            # In production, use pyproj for proper projection
            
            # Approximate area (assumes small polygons)
            area_degrees = polygon.area
            
            # Convert to square meters (very rough approximation)
            # 1 degree ≈ 111,320 meters at equator
            area_m2 = area_degrees * (111320 ** 2)
            
            return area_m2
            
        except Exception:
            return 0.0
    
    @staticmethod
    def calculate_area_hectares(geojson: Dict) -> float:
        """
        Calculate area in hectares
        
        Args:
            geojson: GeoJSON Polygon
            
        Returns:
            Area in hectares
        """
        area_m2 = GeoJSONValidator.calculate_area(geojson)
        return area_m2 / 10000  # 1 hectare = 10,000 m²
    
    @staticmethod
    def get_centroid(geojson: Dict) -> List[float]:
        """
        Get centroid of a polygon
        
        Args:
            geojson: GeoJSON Polygon
            
        Returns:
            [longitude, latitude] of centroid
        """
        try:
            polygon = shape(geojson)
            centroid = polygon.centroid
            return [centroid.x, centroid.y]
        except Exception:
            return [0.0, 0.0]
    
    @staticmethod
    def simplify_polygon(geojson: Dict, tolerance: float = 0.0001) -> Dict:
        """
        Simplify polygon by reducing number of points
        
        Args:
            geojson: GeoJSON Polygon
            tolerance: Simplification tolerance
            
        Returns:
            Simplified GeoJSON Polygon
        """
        try:
            polygon = shape(geojson)
            simplified = polygon.simplify(tolerance, preserve_topology=True)
            
            return {
                'type': 'Polygon',
                'coordinates': [list(simplified.exterior.coords)]
            }
        except Exception:
            return geojson
