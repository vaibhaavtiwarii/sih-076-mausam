// frontend/src/components/AirQualityCard.jsx
import React from 'react';
import './AirQualityCard.css';

// WeatherAPI gives us the US EPA index (1-6), not OpenWeather's 1-5 scale -
// labeling it accurately rather than borrowing OpenWeather's name for it.
const EPA_COLORS = {
  1: '#2dd4bf', // Good
  2: '#a3e635', // Moderate
  3: '#fbbf24', // Unhealthy for sensitive groups
  4: '#fb923c', // Unhealthy
  5: '#f87171', // Very unhealthy
  6: '#c084fc'  // Hazardous
};

function AirQualityCard({ airQuality }) {
  if (!airQuality) return null;

  const { index, category, pm2_5, pm10, no2, o3 } = airQuality;
  const color = EPA_COLORS[index] || '#94a3b8';
  const circumference = 2 * Math.PI * 30;
  const offset = circumference * (1 - Math.min(index, 6) / 6);

  return (
    <div className="aq-card">
      <h3>Air Quality</h3>
      <div className="aq-body">
        <div className="aq-ring" style={{ width: 72, height: 72 }}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            <circle cx={36} cy={36} r={30} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
            <circle
              cx={36}
              cy={36}
              r={30}
              fill="none"
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
              className="aq-ring-progress"
            />
          </svg>
          <div className="aq-ring-label">
            <span className="aq-ring-number">{index ?? '–'}</span>
            <span className="aq-ring-unit">/6</span>
          </div>
        </div>
        <div className="aq-info">
          <div className="aq-category" style={{ color }}>{category}</div>
          <div className="aq-sub">US EPA AQI scale</div>
        </div>
      </div>
      <div className="aq-grid">
        <div className="aq-tile">
          <span className="aq-tile-label">PM2.5</span>
          <span className="aq-tile-value">{pm2_5 ?? '–'} µg/m³</span>
        </div>
        <div className="aq-tile">
          <span className="aq-tile-label">PM10</span>
          <span className="aq-tile-value">{pm10 ?? '–'} µg/m³</span>
        </div>
        <div className="aq-tile">
          <span className="aq-tile-label">NO₂</span>
          <span className="aq-tile-value">{no2 ?? '–'} µg/m³</span>
        </div>
        <div className="aq-tile">
          <span className="aq-tile-label">O₃</span>
          <span className="aq-tile-value">{o3 ?? '–'} µg/m³</span>
        </div>
      </div>
    </div>
  );
}

export default AirQualityCard;
