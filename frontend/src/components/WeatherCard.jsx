// frontend/src/components/WeatherCard.jsx
import React from 'react';
import './WeatherCard.css';

function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h2 className="weather-location">{weather.location}</h2>
        <span className="weather-condition">{weather.condition}</span>
      </div>
      <div className="weather-main">
        <div className="weather-temp">{weather.temperature}°C</div>
        <div className="weather-feels">Feels like {weather.feelsLike}°C</div>
      </div>
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">💧 Humidity</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">🌬️ Wind</span>
          <span className="detail-value">{weather.wind} km/h</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">☀️ UV Index</span>
          <span className="detail-value">{weather.uv}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">🌧️ Rain</span>
          <span className="detail-value">{weather.rain}%</span>
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;