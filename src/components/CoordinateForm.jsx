import React, { useState } from 'react';

const CoordinateForm = ({ onCoordinatesSubmit, onCancel }) => {
    const [coordinates, setCoordinates] = useState([
        { lng: '', lat: '' },
        { lng: '', lat: '' },
        { lng: '', lat: '' }
    ]);
    const [error, setError] = useState('');

    const addCoordinate = () => {
        setCoordinates([...coordinates, { lng: '', lat: '' }]);
    };

    const removeCoordinate = (index) => {
        if (coordinates.length > 3) {
            const updated = coordinates.filter((_, i) => i !== index);
            setCoordinates(updated);
        }
    };

    const updateCoordinate = (index, field, value) => {
        const updated = [...coordinates];
        updated[index][field] = value;
        setCoordinates(updated);
        setError('');
    };

    const validateCoordinates = () => {
        const validCoords = coordinates.filter(c => c.lng && c.lat);

        if (validCoords.length < 3) {
            setError('At least 3 coordinates are required to form a polygon');
            return false;
        }

        for (let i = 0; i < validCoords.length; i++) {
            const lng = parseFloat(validCoords[i].lng);
            const lat = parseFloat(validCoords[i].lat);

            if (isNaN(lng) || isNaN(lat)) {
                setError(`Invalid coordinate at position ${i + 1}`);
                return false;
            }

            if (lng < -180 || lng > 180) {
                setError(`Longitude at position ${i + 1} must be between -180 and 180`);
                return false;
            }

            if (lat < -90 || lat > 90) {
                setError(`Latitude at position ${i + 1} must be between -90 and 90`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateCoordinates()) {
            return;
        }

        const coordList = coordinates
            .filter(c => c.lng && c.lat)
            .map(c => [parseFloat(c.lng), parseFloat(c.lat)]);

        onCoordinatesSubmit(coordList);
    };

    return (
        <div className="coordinate-form">
            <div className="form-header">
                <h3>Enter Farm Coordinates</h3>
                <p className="text-sm text-gray-600">
                    Enter at least 3 coordinate points to define your farm boundary
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="coordinates-list">
                    {coordinates.map((coord, index) => (
                        <div key={index} className="coordinate-input-row">
                            <span className="coordinate-number">{index + 1}</span>
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="Longitude (e.g., 77.1234)"
                                value={coord.lng}
                                onChange={(e) => updateCoordinate(index, 'lng', e.target.value)}
                                className="coordinate-input"
                            />
                            <input
                                type="number"
                                step="0.000001"
                                placeholder="Latitude (e.g., 28.5678)"
                                value={coord.lat}
                                onChange={(e) => updateCoordinate(index, 'lat', e.target.value)}
                                className="coordinate-input"
                            />
                            {coordinates.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() => removeCoordinate(index)}
                                    className="remove-btn"
                                    title="Remove coordinate"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-actions">
                    <button type="button" onClick={addCoordinate} className="btn-secondary">
                        + Add Point
                    </button>
                    <div className="action-buttons">
                        {onCancel && (
                            <button type="button" onClick={onCancel} className="btn-cancel">
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="btn-primary">
                            Create Farm Boundary
                        </button>
                    </div>
                </div>
            </form>

            <style jsx>{`
        .coordinate-form {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-header {
          margin-bottom: 20px;
        }

        .form-header h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
        }

        .coordinates-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .coordinate-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .coordinate-number {
          min-width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .coordinate-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .coordinate-input:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .remove-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 6px;
          font-size: 20px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .remove-btn:hover {
          background: #fecaca;
        }

        .error-message {
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-secondary, .btn-primary, .btn-cancel {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-primary {
          background: #22c55e;
          color: white;
        }

        .btn-primary:hover {
          background: #16a34a;
        }

        .btn-cancel {
          background: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover {
          background: #f9fafb;
        }
      `}</style>
        </div>
    );
};

export default CoordinateForm;
