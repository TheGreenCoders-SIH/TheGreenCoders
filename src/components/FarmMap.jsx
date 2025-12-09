import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && zoom) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);

    return null;
};

const FarmMap = ({
    onBoundaryCreated,
    initialBoundary = null,
    center = [20.5937, 78.9629], // India center
    zoom = 5,
    height = '500px'
}) => {
    const [boundary, setBoundary] = useState(initialBoundary);
    const [mapCenter, setMapCenter] = useState(center);
    const [mapZoom, setMapZoom] = useState(zoom);
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const featureGroupRef = useRef();

    useEffect(() => {
        // Cleanup function to remove the map instance from the DOM element
        // This is crucial for preventing "Map container is already initialized" errors
        return () => {
            const container = document.querySelector('.leaflet-container');
            if (container && container._leaflet_id) {
                container._leaflet_id = null;
            }
        };
    }, []);

    useEffect(() => {
        if (initialBoundary) {
            setBoundary(initialBoundary);
            // Calculate center of polygon
            const coords = initialBoundary.coordinates[0];
            const lats = coords.map(c => c[1]);
            const lngs = coords.map(c => c[0]);
            const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
            const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
            setMapCenter([centerLat, centerLng]);
            setMapZoom(13);
        }
    }, [initialBoundary]);

    const handleCreated = (e) => {
        const { layer } = e;

        // Clear previous drawings
        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            featureGroupRef.current.addLayer(layer);
        }

        const coordinates = layer.getLatLngs()[0].map(latlng => [
            latlng.lng,
            latlng.lat
        ]);

        // Close the polygon
        coordinates.push(coordinates[0]);

        const geojson = {
            type: 'Polygon',
            coordinates: [coordinates]
        };

        setBoundary(geojson);
        onBoundaryCreated(geojson);
    };

    const handleEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer((layer) => {
            const coordinates = layer.getLatLngs()[0].map(latlng => [
                latlng.lng,
                latlng.lat
            ]);
            coordinates.push(coordinates[0]);

            const geojson = {
                type: 'Polygon',
                coordinates: [coordinates]
            };

            setBoundary(geojson);
            onBoundaryCreated(geojson);
        });
    };

    const handleDeleted = () => {
        setBoundary(null);
        onBoundaryCreated(null);
    };

    return (
        <div className="farm-map-container" style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
                key={initialBoundary ? 'boundary-map' : 'empty-map'}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <MapController center={mapCenter} zoom={mapZoom} />

                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={handleCreated}
                        onEdited={handleEdited}
                        onDeleted={handleDeleted}
                        draw={{
                            rectangle: false,
                            circle: false,
                            circlemarker: false,
                            marker: false,
                            polyline: false,
                            polygon: {
                                allowIntersection: false,
                                showArea: false,
                                metric: ['km', 'm'],
                                shapeOptions: {
                                    color: '#22c55e',
                                    fillColor: '#86efac',
                                    fillOpacity: 0.3,
                                    weight: 2
                                }
                            }
                        }}
                        edit={{
                            edit: {},
                            remove: {}
                        }}
                    />

                    {boundary && (
                        <Polygon
                            positions={boundary.coordinates[0].map(coord => [coord[1], coord[0]])}
                            pathOptions={{
                                color: '#22c55e',
                                fillColor: '#86efac',
                                fillOpacity: 0.3,
                                weight: 2
                            }}
                        />
                    )}
                </FeatureGroup>
            </MapContainer>
        </div>
    );
};

export default FarmMap;
