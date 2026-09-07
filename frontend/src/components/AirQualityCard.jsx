// frontend/src/components/AirQualityCard.jsx
import React from 'react';
import './AirQualityCard.css';

// WeatherAPI gives us the US EPA index (1-6) for the overall ring, not
// OpenWeather's 1-5 scale - labeling it accurately rather than borrowing
// OpenWeather's name for it.
const EPA_COLORS = {
  1: '#2dd4bf', // Good
  2: '#a3e635', // Moderate
  3: '#fbbf24', // Unhealthy for sensitive groups
  4: '#fb923c', // Unhealthy
  5: '#f87171', // Very unhealthy
  6: '#c084fc'  // Hazardous
};

// A bare "117.8 µg/m³" means nothing to most people. CPCB's National AQI
// breakpoints (India's official standard) turn each pollutant's raw number
// into a plain-language severity label with a matching color, the same way
// the SAFAR/CPCB apps do - so a number reads as "Poor" at a glance instead
// of requiring the reader to already know what's dangerous.
const POLLUTANT_BREAKPOINTS = {
  pm2_5: [
    { max: 30, label: 'Good', color: '#2dd4bf' },
    { max: 60, label: 'Satisfactory', color: '#a3e635' },
    { max: 90, label: 'Moderate', color: '#fbbf24' },
    { max: 120, label: 'Poor', color: '#fb923c' },
    { max: 250, label: 'Very Poor', color: '#f87171' },
    { max: Infinity, label: 'Severe', color: '#c084fc' }
  ],
  pm10: [
    { max: 50, label: 'Good', color: '#2dd4bf' },
    { max: 100, label: 'Satisfactory', color: '#a3e635' },
    { max: 250, label: 'Moderate', color: '#fbbf24' },
    { max: 350, label: 'Poor', color: '#fb923c' },
    { max: 430, label: 'Very Poor', color: '#f87171' },
    { max: Infinity, label: 'Severe', color: '#c084fc' }
  ],
  no2: [
    { max: 40, label: 'Good', color: '#2dd4bf' },
    { max: 80, label: 'Satisfactory', color: '#a3e635' },
    { max: 180, label: 'Moderate', color: '#fbbf24' },
    { max: 280, label: 'Poor', color: '#fb923c' },
    { max: 400, label: 'Very Poor', color: '#f87171' },
    { max: Infinity, label: 'Severe', color: '#c084fc' }
  ],
  o3: [
    { max: 50, label: 'Good', color: '#2dd4bf' },
    { max: 100, label: 'Satisfactory', color: '#a3e635' },
    { max: 168, label: 'Moderate', color: '#fbbf24' },
    { max: 208, label: 'Poor', color: '#fb923c' },
    { max: 748, label: 'Very Poor', color: '#f87171' },
    { max: Infinity, label: 'Severe', color: '#c084fc' }
  ]
};

function classifyPollutant(pollutant, value) {
  if (value == null) return null;
  const bands = POLLUTANT_BREAKPOINTS[pollutant];
  return bands.find((band) => value <= band.max) || bands[bands.length - 1];
}

function PollutantTile({ label, pollutant, value }) {
  const band = classifyPollutant(pollutant, value);
  return (
    <div className="aq-tile">
      <span className="aq-tile-label">{label}</span>
      <span className="aq-tile-value">{value ?? '–'} µg/m³</span>
      {band && (
        <span className="aq-tile-badge" style={{ color: band.color, borderColor: band.color }}>
          {band.label}
        </span>
      )}
    </div>
  );
}

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
        <PollutantTile label="PM2.5" pollutant="pm2_5" value={pm2_5} />
        <PollutantTile label="PM10" pollutant="pm10" value={pm10} />
        <PollutantTile label="NO₂" pollutant="no2" value={no2} />
        <PollutantTile label="O₃" pollutant="o3" value={o3} />
      </div>
      <p className="aq-footnote">Severity per pollutant follows India's CPCB National AQI scale.</p>
    </div>
  );
}

export default AirQualityCard;
