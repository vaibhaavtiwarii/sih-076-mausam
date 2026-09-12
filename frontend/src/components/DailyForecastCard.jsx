// frontend/src/components/DailyForecastCard.jsx
import React from 'react';
import { WiDaySunny, WiCloud, WiRain, WiThunderstorm, WiFog, WiSnow } from 'react-icons/wi';
import './DailyForecastCard.css';

// Backend already sends 3 days of maxTemp/minTemp/condition/chanceOfRain -
// it just wasn't being rendered anywhere yet. Same rough condition->icon
// matching approach as elsewhere in the app: keyword match on the text
// WeatherAPI gives us, since there's no icon code mapping wired up here.
function iconFor(condition = '') {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <WiThunderstorm size={30} color="#7c3aed" />;
  if (c.includes('snow')) return <WiSnow size={30} color="#38bdf8" />;
  if (c.includes('rain') || c.includes('drizzle')) return <WiRain size={30} color="#0ea5e9" />;
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return <WiFog size={30} color="#94a3b8" />;
  if (c.includes('cloud') || c.includes('overcast')) return <WiCloud size={30} color="#64748b" />;
  return <WiDaySunny size={30} color="#f59e0b" />;
}

function dayLabel(dateStr, idx) {
  if (idx === 0) return 'Today';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function DailyForecastCard({ daily }) {
  if (!daily || daily.length === 0) return null;

  return (
    <div className="daily-forecast-card">
      <h3>3-Day Forecast</h3>
      <div className="daily-forecast-list">
        {daily.map((day, idx) => (
          <div key={day.date} className="daily-forecast-row">
            <span className="daily-forecast-day">{dayLabel(day.date, idx)}</span>
            <span className="daily-forecast-icon">{iconFor(day.condition)}</span>
            <span className="daily-forecast-condition">{day.condition}</span>
            <span className="daily-forecast-rain">💧 {day.chanceOfRain}%</span>
            <span className="daily-forecast-temps">
              <strong>{day.maxTemp}°</strong>
              <span className="daily-forecast-min">{day.minTemp}°</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DailyForecastCard;
