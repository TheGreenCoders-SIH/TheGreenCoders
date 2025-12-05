"""
Analytics Processor Service
Processes satellite data and generates farm analytics
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from .satellite_service import SatelliteService
from .ndvi_calculator import NDVICalculator, SoilMoistureEstimator
import numpy as np

logger = logging.getLogger(__name__)

class AnalyticsProcessor:
    """Process and analyze satellite data for farms"""
    
    def __init__(self):
        self.satellite_service = SatelliteService()
        self.ndvi_calculator = NDVICalculator()
        self.moisture_estimator = SoilMoistureEstimator()
    
    async def process_farm_analysis(
        self,
        farm_boundary: Dict,
        analysis_date: Optional[str] = None,
        lookback_days: int = 10
    ) -> Dict:
        """
        Process complete farm analysis including NDVI, NDMI, and recommendations
        
        Args:
            farm_boundary: GeoJSON polygon of farm boundary
            analysis_date: Target date for analysis (defaults to today)
            lookback_days: Days to look back for satellite data
            
        Returns:
            Complete analytics dictionary
        """
        try:
            # Extract coordinates from GeoJSON
            coordinates = farm_boundary['coordinates'][0]
            
            # Calculate bounding box
            bbox = self.satellite_service.calculate_bbox_from_polygon(coordinates)
            
            # Set date range
            if analysis_date is None:
                end_date = datetime.now()
            else:
                end_date = datetime.fromisoformat(analysis_date)
            
            start_date = end_date - timedelta(days=lookback_days)
            
            # Retrieve satellite data
            logger.info(f"Retrieving satellite data for bbox: {bbox}")
            satellite_data = self.satellite_service.get_satellite_data(
                bbox=bbox,
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d'),
                max_cloud_coverage=20.0
            )
            
            # For demo purposes, generate sample NDVI/NDMI data
            # In production, this would come from actual satellite imagery
            ndvi_data = self._generate_sample_ndvi()
            ndmi_data = self._generate_sample_ndmi()
            
            # Calculate statistics
            ndvi_stats = self.ndvi_calculator.calculate_statistics(ndvi_data)
            ndmi_stats = self.ndvi_calculator.calculate_statistics(ndmi_data)
            
            # Calculate histograms
            ndvi_histogram = self.ndvi_calculator.calculate_histogram(ndvi_data)
            
            # Classify health
            ndvi_classification = self.ndvi_calculator.classify_ndvi(ndvi_stats['mean'])
            ndmi_classification = self.ndvi_calculator.classify_ndmi(ndmi_stats['mean'])
            
            # Estimate soil moisture
            soil_moisture = self.moisture_estimator.estimate_from_ndmi(ndmi_stats['mean'])
            
            # Generate irrigation recommendation
            irrigation_rec = self.moisture_estimator.irrigation_recommendation(
                ndmi_stats['mean'],
                ndvi_stats['mean']
            )
            
            # Compile analytics
            analytics = {
                'analysis_date': end_date.strftime('%Y-%m-%d'),
                'satellite_data': {
                    'provider': 'SentinelHub',
                    'acquisition_date': satellite_data.get('acquisition_date'),
                    'cloud_coverage': satellite_data.get('cloud_coverage', 0),
                    'bbox': bbox
                },
                'ndvi': {
                    **ndvi_stats,
                    'histogram': ndvi_histogram,
                    'classification': ndvi_classification
                },
                'ndmi': {
                    **ndmi_stats,
                    'classification': ndmi_classification
                },
                'soil_moisture': soil_moisture,
                'irrigation': irrigation_rec,
                'overall_health': self._calculate_overall_health(
                    ndvi_stats['mean'],
                    ndmi_stats['mean']
                )
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error processing farm analysis: {str(e)}")
            raise
    
    async def get_historical_analytics(
        self,
        farm_boundary: Dict,
        start_date: str,
        end_date: str,
        interval_days: int = 5
    ) -> List[Dict]:
        """
        Get historical analytics for a farm
        
        Args:
            farm_boundary: GeoJSON polygon
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            interval_days: Interval between data points
            
        Returns:
            List of analytics for each time point
        """
        try:
            coordinates = farm_boundary['coordinates'][0]
            bbox = self.satellite_service.calculate_bbox_from_polygon(coordinates)
            
            # Get NDVI time series
            ndvi_timeseries = self.satellite_service.get_ndvi_timeseries(
                bbox=bbox,
                start_date=start_date,
                end_date=end_date,
                interval_days=interval_days
            )
            
            # Process each time point
            historical_data = []
            for point in ndvi_timeseries:
                if point['ndvi_mean'] is not None:
                    # Estimate NDMI (in production, retrieve from satellite)
                    ndmi_mean = point['ndvi_mean'] * 0.7  # Simplified correlation
                    
                    historical_data.append({
                        'date': point['date'],
                        'ndvi': {
                            'mean': point['ndvi_mean'],
                            'min': point['ndvi_min'],
                            'max': point['ndvi_max'],
                            'std': point['ndvi_std']
                        },
                        'ndmi': {
                            'mean': ndmi_mean
                        },
                        'health_status': self.ndvi_calculator.classify_ndvi(point['ndvi_mean'])['health']
                    })
            
            return historical_data
            
        except Exception as e:
            logger.error(f"Error retrieving historical analytics: {str(e)}")
            raise
    
    def _generate_sample_ndvi(self) -> np.ndarray:
        """Generate sample NDVI data for demonstration"""
        # In production, this would be actual satellite data
        np.random.seed(42)
        ndvi = np.random.normal(0.6, 0.15, (100, 100))
        ndvi = np.clip(ndvi, -1, 1)
        return ndvi
    
    def _generate_sample_ndmi(self) -> np.ndarray:
        """Generate sample NDMI data for demonstration"""
        np.random.seed(43)
        ndmi = np.random.normal(0.3, 0.1, (100, 100))
        ndmi = np.clip(ndmi, -1, 1)
        return ndmi
    
    def _calculate_overall_health(self, ndvi_mean: float, ndmi_mean: float) -> Dict:
        """
        Calculate overall farm health score
        
        Args:
            ndvi_mean: Mean NDVI value
            ndmi_mean: Mean NDMI value
            
        Returns:
            Overall health assessment
        """
        # Weighted score (70% NDVI, 30% NDMI)
        health_score = (ndvi_mean * 0.7 + ndmi_mean * 0.3) * 100
        
        if health_score < 20:
            status = "Critical"
            color = "#DC143C"
        elif health_score < 40:
            status = "Poor"
            color = "#FF8C00"
        elif health_score < 60:
            status = "Fair"
            color = "#FFD700"
        elif health_score < 80:
            status = "Good"
            color = "#32CD32"
        else:
            status = "Excellent"
            color = "#006400"
        
        return {
            'score': round(health_score, 2),
            'status': status,
            'color': color,
            'description': f"Farm health is {status.lower()} based on vegetation and moisture indices"
        }
