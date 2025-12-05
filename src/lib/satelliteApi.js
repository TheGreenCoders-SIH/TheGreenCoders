/**
 * Satellite Analytics API Service
 * Handles all API calls for farm management and satellite analytics
 */

const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

class SatelliteAPI {
    /**
     * Get authorization headers with Firebase token
     */
    async getHeaders(token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    // ==================== FARM MANAGEMENT ====================

    /**
     * Get all farms for the authenticated farmer
     */
    async getFarms(token) {
        const response = await fetch(`${API_BASE_URL}/farms`, {
            headers: await this.getHeaders(token)
        });
        return this.handleResponse(response);
    }

    /**
     * Get a specific farm by ID
     */
    async getFarm(token, farmId) {
        const response = await fetch(`${API_BASE_URL}/farms/${farmId}`, {
            headers: await this.getHeaders(token)
        });
        return this.handleResponse(response);
    }

    /**
     * Create a new farm with boundary polygon
     */
    async createFarm(token, farmData) {
        const response = await fetch(`${API_BASE_URL}/farms`, {
            method: 'POST',
            headers: await this.getHeaders(token),
            body: JSON.stringify(farmData)
        });
        return this.handleResponse(response);
    }

    /**
     * Create a farm from coordinate list
     */
    async createFarmFromCoordinates(token, farmName, coordinates, areaHectares = null) {
        const response = await fetch(`${API_BASE_URL}/farms/from-coordinates?farm_name=${encodeURIComponent(farmName)}${areaHectares ? `&area_hectares=${areaHectares}` : ''}`, {
            method: 'POST',
            headers: await this.getHeaders(token),
            body: JSON.stringify({ coordinates })
        });
        return this.handleResponse(response);
    }

    /**
     * Update farm details
     */
    async updateFarm(token, farmId, updateData) {
        const response = await fetch(`${API_BASE_URL}/farms/${farmId}`, {
            method: 'PUT',
            headers: await this.getHeaders(token),
            body: JSON.stringify(updateData)
        });
        return this.handleResponse(response);
    }

    /**
     * Delete a farm
     */
    async deleteFarm(token, farmId) {
        const response = await fetch(`${API_BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers: await this.getHeaders(token)
        });
        if (response.status === 204) {
            return { success: true };
        }
        return this.handleResponse(response);
    }

    // ==================== ANALYTICS ====================

    /**
     * Trigger satellite analysis for a farm
     */
    async analyzeFarm(token, farmId, options = {}) {
        const response = await fetch(`${API_BASE_URL}/analytics/farms/${farmId}/analyze`, {
            method: 'POST',
            headers: await this.getHeaders(token),
            body: JSON.stringify({
                analysis_date: options.analysisDate || null,
                lookback_days: options.lookbackDays || 10
            })
        });
        return this.handleResponse(response);
    }

    /**
     * Get the latest analytics for a farm
     */
    async getLatestAnalytics(token, farmId) {
        const response = await fetch(`${API_BASE_URL}/analytics/farms/${farmId}/latest`, {
            headers: await this.getHeaders(token)
        });
        return this.handleResponse(response);
    }

    /**
     * Get historical analytics for a farm
     */
    async getHistoricalAnalytics(token, farmId, params) {
        const response = await fetch(`${API_BASE_URL}/analytics/farms/${farmId}/history`, {
            method: 'POST',
            headers: await this.getHeaders(token),
            body: JSON.stringify({
                start_date: params.start_date,
                end_date: params.end_date,
                interval_days: params.interval_days || 5
            })
        });
        return this.handleResponse(response);
    }

    /**
     * Get NDVI timeline for a farm
     */
    async getNDVITimeline(token, farmId, days = 30) {
        const response = await fetch(`${API_BASE_URL}/analytics/farms/${farmId}/ndvi-timeline?days=${days}`, {
            headers: await this.getHeaders(token)
        });
        return this.handleResponse(response);
    }

    /**
     * Get all analysis history for the farmer
     */
    async getFarmerHistory(token, limit = 50) {
        const response = await fetch(`${API_BASE_URL}/analytics/farmer/history?limit=${limit}`, {
            headers: await this.getHeaders(token)
        });
        return this.handleResponse(response);
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Calculate area of a polygon in hectares
     */
    calculateArea(coordinates) {
        // Simple approximation - for production use turf.js
        if (!coordinates || coordinates.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            const [x1, y1] = coordinates[i];
            const [x2, y2] = coordinates[i + 1];
            area += (x1 * y2) - (x2 * y1);
        }
        area = Math.abs(area) / 2;

        // Convert to hectares (very rough approximation)
        const areaM2 = area * 111320 * 111320;
        return areaM2 / 10000;
    }

    /**
     * Validate GeoJSON polygon
     */
    validatePolygon(geojson) {
        if (!geojson || geojson.type !== 'Polygon') {
            return { valid: false, error: 'Invalid polygon type' };
        }

        if (!geojson.coordinates || !geojson.coordinates[0]) {
            return { valid: false, error: 'Missing coordinates' };
        }

        const coords = geojson.coordinates[0];
        if (coords.length < 4) {
            return { valid: false, error: 'Polygon must have at least 4 coordinates' };
        }

        // Check if closed
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            return { valid: false, error: 'Polygon must be closed' };
        }

        return { valid: true };
    }
}

// Export singleton instance
export const satelliteApi = new SatelliteAPI();
export default satelliteApi;
