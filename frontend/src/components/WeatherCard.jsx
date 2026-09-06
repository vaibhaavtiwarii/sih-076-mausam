// frontend/src/components/WeatherCard.jsx
import React from 'react';
import { WiHumidity, WiStrongWind, WiDaySunny, WiRain } from 'react-icons/wi';
import './WeatherCard.css';

function WeatherCard({ weather }) {
  // Basic safety check in case weather is loading
  if (!weather) return null;

  return (
    <div className="main-weather-card">
      <h2 className="city-name">{weather.city}</h2>
      
      <div className="temp-display">
        {/* Big weather icon (Sun for day, can change based on condition) */}
        <WiDaySunny size={110} color="#f59e0b" />
        <div>
          <h1 className="temp-text">{weather.temperature}°</h1>
          <p className="feels-like">Feels like {weather.feels_like}°C</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-tile" style={{ background: '#dbeafe' }}>
           <WiHumidity size={35} color="#2563eb" />
           <span>Humidity</span>
           <strong>{weather.humidity}%</strong>
        </div>

        <div className="stat-tile" style={{ background: '#dcfce7' }}>
           <WiStrongWind size={35} color="#16a34a" />
           <span>Wind</span>
           <strong>{weather.wind} km/h</strong>
        </div>

        <div className="stat-tile" style={{ background: '#fef3c7' }}>
           <WiDaySunny size={35} color="#d97706" />
           <span>UV Index</span>
           <strong>{weather.uv_index}</strong>
        </div>

        <div className="stat-tile" style={{ background: '#e0f2fe' }}>
           <WiRain size={35} color="#0ea5e9" />
           <span>Rain</span>
           <strong>{weather.rain}%</strong>
        </div>
      </div>

      <div className="hourly-forecast">
        <h3>Hourly Forecast</h3>
        <div className="hourly-scroll">
          {weather.hourly && weather.hourly.slice(0, 12).map((hour, idx) => (
            <div key={idx} className="hour-item">
              <div className="hour-time">
                {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
              </div>
              <div className="hour-temp">{hour.temperature}°</div>
              
              {/* This is the NEW line that fixes the overlapping text! */}
              <div className="hour-condition">{hour.condition}</div>
              
              <div className="hour-rain">{hour.rain}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;