"""
NDVI and NDMI Calculator Utilities
Provides functions for calculating vegetation indices from satellite band data
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import rasterio
from rasterio.transform import from_bounds
from rasterio.features import geometry_mask
from shapely.geometry import shape, Polygon
import io

class NDVICalculator:
    """Calculator for NDVI (Normalized Difference Vegetation Index)"""
    
    @staticmethod
    def calculate_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
        """
        Calculate NDVI from NIR and RED bands
        
        Formula: NDVI = (NIR - RED) / (NIR + RED)
        
        Args:
            nir: Near-Infrared band (Band 8 for Sentinel-2)
            red: Red band (Band 4 for Sentinel-2)
            
        Returns:
            NDVI array with values between -1 and 1
        """
        # Avoid division by zero
        denominator = nir + red
        denominator = np.where(denominator == 0, np.nan, denominator)
        
        ndvi = (nir - red) / denominator
        
        # Clip values to valid range
        ndvi = np.clip(ndvi, -1, 1)
        
        return ndvi
    
    @staticmethod
    def calculate_ndmi(nir: np.ndarray, swir: np.ndarray) -> np.ndarray:
        """
        Calculate NDMI (Normalized Difference Moisture Index)
        
        Formula: NDMI = (NIR - SWIR) / (NIR + SWIR)
        
        Args:
            nir: Near-Infrared band (Band 8)
            swir: Short-Wave Infrared band (Band 11)
            
        Returns:
            NDMI array with values between -1 and 1
        """
        denominator = nir + swir
        denominator = np.where(denominator == 0, np.nan, denominator)
        
        ndmi = (nir - swir) / denominator
        ndmi = np.clip(ndmi, -1, 1)
        
        return ndmi
    
    @staticmethod
    def calculate_statistics(data: np.ndarray, mask: Optional[np.ndarray] = None) -> Dict:
        """
        Calculate statistical metrics for an index array
        
        Args:
            data: NDVI or NDMI array
            mask: Optional boolean mask to exclude certain pixels
            
        Returns:
            Dictionary with mean, min, max, std, percentiles
        """
        # Apply mask if provided
        if mask is not None:
            data = data[mask]
        
        # Remove NaN values
        valid_data = data[~np.isnan(data)]
        
        if len(valid_data) == 0:
            return {
                'mean': None,
                'min': None,
                'max': None,
                'std': None,
                'percentile_25': None,
                'percentile_50': None,
                'percentile_75': None,
                'count': 0
            }
        
        return {
            'mean': float(np.mean(valid_data)),
            'min': float(np.min(valid_data)),
            'max': float(np.max(valid_data)),
            'std': float(np.std(valid_data)),
            'percentile_25': float(np.percentile(valid_data, 25)),
            'percentile_50': float(np.percentile(valid_data, 50)),
            'percentile_75': float(np.percentile(valid_data, 75)),
            'count': len(valid_data)
        }
    
    @staticmethod
    def calculate_histogram(data: np.ndarray, bins: int = 20) -> Dict:
        """
        Calculate histogram for NDVI/NDMI data
        
        Args:
            data: Index array
            bins: Number of histogram bins
            
        Returns:
            Dictionary with histogram data
        """
        valid_data = data[~np.isnan(data)]
        
        if len(valid_data) == 0:
            return {'bins': [], 'counts': []}
        
        counts, bin_edges = np.histogram(valid_data, bins=bins, range=(-1, 1))
        
        return {
            'bins': bin_edges.tolist(),
            'counts': counts.tolist()
        }
    
    @staticmethod
    def classify_ndvi(ndvi_value: float) -> Dict:
        """
        Classify NDVI value into health categories
        
        Args:
            ndvi_value: NDVI value between -1 and 1
            
        Returns:
            Classification with category, color, and description
        """
        if ndvi_value < 0:
            return {
                'category': 'Water/Bare Soil',
                'color': '#8B4513',
                'health': 'N/A',
                'description': 'Non-vegetated area'
            }
        elif ndvi_value < 0.2:
            return {
                'category': 'Sparse Vegetation',
                'color': '#FFD700',
                'health': 'Poor',
                'description': 'Very low vegetation density'
            }
        elif ndvi_value < 0.4:
            return {
                'category': 'Moderate Vegetation',
                'color': '#ADFF2F',
                'health': 'Fair',
                'description': 'Moderate vegetation health'
            }
        elif ndvi_value < 0.6:
            return {
                'category': 'Healthy Vegetation',
                'color': '#32CD32',
                'health': 'Good',
                'description': 'Good vegetation health'
            }
        else:
            return {
                'category': 'Very Healthy Vegetation',
                'color': '#006400',
                'health': 'Excellent',
                'description': 'Excellent vegetation health'
            }
    
    @staticmethod
    def classify_ndmi(ndmi_value: float) -> Dict:
        """
        Classify NDMI value into moisture categories
        
        Args:
            ndmi_value: NDMI value between -1 and 1
            
        Returns:
            Classification with category and moisture level
        """
        if ndmi_value < -0.2:
            return {
                'category': 'Very Dry',
                'color': '#8B0000',
                'moisture_level': 'Critical',
                'description': 'Severe water stress'
            }
        elif ndmi_value < 0:
            return {
                'category': 'Dry',
                'color': '#FF4500',
                'moisture_level': 'Low',
                'description': 'Water stress present'
            }
        elif ndmi_value < 0.2:
            return {
                'category': 'Moderate Moisture',
                'color': '#FFD700',
                'moisture_level': 'Moderate',
                'description': 'Adequate moisture'
            }
        elif ndmi_value < 0.4:
            return {
                'category': 'Moist',
                'color': '#00CED1',
                'moisture_level': 'Good',
                'description': 'Good moisture content'
            }
        else:
            return {
                'category': 'Very Moist',
                'color': '#0000CD',
                'moisture_level': 'High',
                'description': 'High moisture content'
            }
    
    @staticmethod
    def generate_color_map(data: np.ndarray, index_type: str = 'ndvi') -> np.ndarray:
        """
        Generate RGB color map for visualization
        
        Args:
            data: NDVI or NDMI array
            index_type: 'ndvi' or 'ndmi'
            
        Returns:
            RGB array for visualization
        """
        # Normalize data to 0-255 range
        normalized = ((data + 1) / 2 * 255).astype(np.uint8)
        
        if index_type == 'ndvi':
            # Green color scale for NDVI
            rgb = np.zeros((*data.shape, 3), dtype=np.uint8)
            rgb[:, :, 1] = normalized  # Green channel
            rgb[:, :, 0] = 255 - normalized  # Red channel (inverse)
        else:
            # Blue color scale for NDMI
            rgb = np.zeros((*data.shape, 3), dtype=np.uint8)
            rgb[:, :, 2] = normalized  # Blue channel
            rgb[:, :, 0] = 255 - normalized  # Red channel (inverse)
        
        return rgb
    
    @staticmethod
    def mask_polygon(
        data: np.ndarray,
        polygon_coords: List[List[float]],
        transform: rasterio.Affine
    ) -> np.ndarray:
        """
        Mask data array to polygon boundary
        
        Args:
            data: Raster data array
            polygon_coords: List of [lon, lat] coordinates
            transform: Rasterio affine transform
            
        Returns:
            Boolean mask array
        """
        polygon = Polygon(polygon_coords)
        mask = geometry_mask(
            [polygon],
            out_shape=data.shape,
            transform=transform,
            invert=True
        )
        
        return mask


class SoilMoistureEstimator:
    """Estimate soil moisture from satellite indices"""
    
    @staticmethod
    def estimate_from_ndmi(ndmi: float) -> Dict:
        """
        Estimate soil moisture from NDMI value
        
        This is a simplified estimation. For production, use dedicated
        soil moisture products like SMAP or SMOS.
        
        Args:
            ndmi: NDMI value
            
        Returns:
            Estimated soil moisture percentage and category
        """
        # Simplified linear relationship
        # NDMI ranges from -1 to 1
        # Soil moisture estimated as percentage (0-100%)
        
        if ndmi < -0.5:
            moisture_pct = 10
            category = "Very Dry"
        elif ndmi < 0:
            moisture_pct = 20 + (ndmi + 0.5) * 40
            category = "Dry"
        elif ndmi < 0.3:
            moisture_pct = 40 + (ndmi * 66.67)
            category = "Moderate"
        elif ndmi < 0.5:
            moisture_pct = 60 + ((ndmi - 0.3) * 100)
            category = "Moist"
        else:
            moisture_pct = 80 + ((ndmi - 0.5) * 40)
            category = "Very Moist"
        
        return {
            'moisture_percentage': round(moisture_pct, 2),
            'category': category,
            'unit': 'percentage',
            'confidence': 'estimated'
        }
    
    @staticmethod
    def irrigation_recommendation(ndmi_mean: float, ndvi_mean: float) -> Dict:
        """
        Generate irrigation recommendation based on indices
        
        Args:
            ndmi_mean: Mean NDMI value
            ndvi_mean: Mean NDVI value
            
        Returns:
            Irrigation recommendation
        """
        # Low moisture and low vegetation health
        if ndmi_mean < 0 and ndvi_mean < 0.4:
            return {
                'recommendation': 'Immediate irrigation required',
                'priority': 'High',
                'action': 'Irrigate within 24 hours',
                'reason': 'Low moisture and vegetation stress detected'
            }
        
        # Low moisture but good vegetation
        elif ndmi_mean < 0.1 and ndvi_mean >= 0.4:
            return {
                'recommendation': 'Schedule irrigation soon',
                'priority': 'Medium',
                'action': 'Irrigate within 2-3 days',
                'reason': 'Moisture levels declining'
            }
        
        # Good moisture and vegetation
        elif ndmi_mean >= 0.2 and ndvi_mean >= 0.4:
            return {
                'recommendation': 'No irrigation needed',
                'priority': 'Low',
                'action': 'Monitor regularly',
                'reason': 'Adequate moisture and healthy vegetation'
            }
        
        # Good moisture but poor vegetation
        elif ndmi_mean >= 0.2 and ndvi_mean < 0.4:
            return {
                'recommendation': 'Check for other issues',
                'priority': 'Medium',
                'action': 'Inspect for pests or disease',
                'reason': 'Good moisture but poor vegetation health'
            }
        
        else:
            return {
                'recommendation': 'Maintain current irrigation',
                'priority': 'Low',
                'action': 'Continue monitoring',
                'reason': 'Conditions are stable'
            }
