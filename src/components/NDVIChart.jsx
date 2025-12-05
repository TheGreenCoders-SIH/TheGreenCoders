import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const NDVIChart = ({ data, title = "NDVI Timeline", showMoisture = false }) => {
    if (!data || data.length === 0) {
        return (
            <div className="ndvi-chart-empty">
                <p>No historical data available</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`Date: ${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value?.toFixed(3) || 'N/A'}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="ndvi-chart-container">
            <h3 className="chart-title">{title}</h3>

            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorNDVI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                        {showMoisture && (
                            <linearGradient id="colorNDMI" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                        )}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        domain={[-1, 1]}
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        iconType="line"
                    />

                    <Area
                        type="monotone"
                        dataKey="ndvi.mean"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorNDVI)"
                        name="NDVI Mean"
                        strokeWidth={2}
                    />

                    {showMoisture && data[0]?.ndmi && (
                        <Area
                            type="monotone"
                            dataKey="ndmi.mean"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorNDMI)"
                            name="NDMI Mean"
                            strokeWidth={2}
                        />
                    )}

                    <Line
                        type="monotone"
                        dataKey="ndvi.max"
                        stroke="#16a34a"
                        strokeDasharray="5 5"
                        dot={false}
                        name="NDVI Max"
                        strokeWidth={1.5}
                    />
                    <Line
                        type="monotone"
                        dataKey="ndvi.min"
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        dot={false}
                        name="NDVI Min"
                        strokeWidth={1.5}
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="chart-legend-info">
                <div className="legend-item">
                    <div className="legend-color" style={{ background: '#22c55e' }}></div>
                    <span>Healthy Vegetation (0.6 - 1.0)</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ background: '#fbbf24' }}></div>
                    <span>Moderate Vegetation (0.2 - 0.6)</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ background: '#dc2626' }}></div>
                    <span>Sparse/No Vegetation (-1.0 - 0.2)</span>
                </div>
            </div>

            <style jsx>{`
        .ndvi-chart-container {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }

        .chart-title {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }

        .ndvi-chart-empty {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          color: #6b7280;
        }

        .custom-tooltip {
          background: white;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .custom-tooltip .label {
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .custom-tooltip p {
          margin: 4px 0;
          font-size: 13px;
        }

        .chart-legend-info {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
      `}</style>
        </div>
    );
};

export default NDVIChart;
