// frontend/src/components/PersonaPanel.jsx
import React, { useState, useEffect } from 'react';
import './PersonaPanel.css';

const SAVED_DESTINATIONS_KEY = 'mausam_saved_destinations';

function loadSavedDestinations() {
  try {
    const raw = localStorage.getItem(SAVED_DESTINATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDestinations(list) {
  try {
    localStorage.setItem(SAVED_DESTINATIONS_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (e.g. private browsing) - fail silently
  }
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
}

function PersonaPanel({ persona, insights, city }) {
  const [savedDestinations, setSavedDestinations] = useState([]);

  useEffect(() => {
    setSavedDestinations(loadSavedDestinations());
  }, []);

  if (!insights) return null;

  const handleSaveDestination = () => {
    if (!city) return;
    const exists = savedDestinations.some(d => d.toLowerCase() === city.toLowerCase());
    if (exists) return;
    const updated = [...savedDestinations, city];
    setSavedDestinations(updated);
    saveDestinations(updated);
  };

  const handleRemoveDestination = (name) => {
    const updated = savedDestinations.filter(d => d !== name);
    setSavedDestinations(updated);
    saveDestinations(updated);
  };

  return (
    <div className="persona-panel">
      <h3 className="persona-panel-title">
        {persona} Insights
      </h3>

      {/* ---------------- Wellness ---------------- */}
      {persona === 'Wellness' && (
        <div className="persona-grid">
          <div className="persona-tile">
            <span className="persona-tile-label">Air Quality</span>
            {insights.airQuality ? (
              <>
                <strong>{insights.airQuality.category}</strong>
                <span className="persona-tile-sub">
                  PM2.5: {insights.airQuality.pm2_5 ?? '–'} · PM10: {insights.airQuality.pm10 ?? '–'}
                </span>
              </>
            ) : (
              <span className="persona-tile-sub">Not available for this location.</span>
            )}
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">UV Index</span>
            <strong>{insights.uv}</strong>
            <span className="persona-tile-sub">{insights.uvAdvice}</span>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">Humidity</span>
            <strong>{insights.humidity}%</strong>
            <span className="persona-tile-sub">{insights.humidityAdvice}</span>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">Pollen (estimated)</span>
            <strong>{insights.pollen.level}</strong>
            <span className="persona-tile-sub">{insights.pollen.note}</span>
          </div>
        </div>
      )}

      {/* ---------------- Fitness ---------------- */}
      {persona === 'Fitness' && (
        <div className="persona-grid">
          <div className="persona-tile">
            <span className="persona-tile-label">Sunrise / Sunset</span>
            <strong>{insights.sunrise} / {insights.sunset}</strong>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">Best Running Window</span>
            <strong>{insights.bestWindow.bestWindow}</strong>
            <span className="persona-tile-sub">Score: {insights.bestWindow.score}/100</span>
          </div>
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Heat Alert</span>
            <span className="persona-tile-sub">{insights.heatAlert || 'No heat concerns in the next 12 hours.'}</span>
          </div>
        </div>
      )}

      {/* ---------------- Surfer ---------------- */}
      {persona === 'Surfer' && (
        insights.available ? (
          <div className="persona-grid">
            <div className="persona-tile">
              <span className="persona-tile-label">Wave Height</span>
              <strong>{insights.waveHeight} m</strong>
            </div>
            <div className="persona-tile">
              <span className="persona-tile-label">Wave Period</span>
              <strong>{insights.wavePeriod} s</strong>
            </div>
            <div className="persona-tile">
              <span className="persona-tile-label">Sea Temp</span>
              <strong>{insights.seaTemp}°C</strong>
            </div>
            <div className="persona-tile">
              <span className="persona-tile-label">Surf Rating</span>
              <strong>{insights.rating.level}</strong>
              <span className="persona-tile-sub">{insights.rating.note}</span>
            </div>
            <div className="persona-tile persona-tile-wide">
              <span className="persona-tile-sub">{insights.note}</span>
            </div>
          </div>
        ) : (
          <p className="persona-empty">{insights.note}</p>
        )
      )}

      {/* ---------------- Traveler ---------------- */}
      {persona === 'Traveler' && (
        <div className="persona-grid">
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Packing Suggestions</span>
            <ul className="persona-list">
              {insights.packingList.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
          {insights.destinationRisk && (
            <div className="persona-tile persona-tile-wide persona-tile-warning">
              <span className="persona-tile-label">⚠️ Travel Risk</span>
              <span className="persona-tile-sub">{insights.destinationRisk}</span>
            </div>
          )}
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Saved Destinations</span>
            <div className="saved-destinations">
              {savedDestinations.length === 0 && (
                <span className="persona-tile-sub">No saved destinations yet.</span>
              )}
              {savedDestinations.map((d) => (
                <span key={d} className="saved-destination-chip">
                  {d}
                  <button onClick={() => handleRemoveDestination(d)} aria-label={`Remove ${d}`}>×</button>
                </span>
              ))}
            </div>
            <button className="btn-save-destination" onClick={handleSaveDestination}>
              📍 Save "{city}" for quick access
            </button>
            <span className="persona-tile-sub">Saved locally in your browser only.</span>
          </div>
        </div>
      )}

      {/* ---------------- Family ---------------- */}
      {persona === 'Family' && (
        <div className="persona-grid">
          <div className="persona-tile">
            <span className="persona-tile-label">Morning School Commute (7–9 AM)</span>
            <strong>{insights.schoolMorning.condition}</strong>
            <span className="persona-tile-sub">{insights.schoolMorning.advice}</span>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">Afternoon Pickup (3–5 PM)</span>
            <strong>{insights.schoolAfternoon.condition}</strong>
            <span className="persona-tile-sub">{insights.schoolAfternoon.advice}</span>
          </div>
          {insights.rainAlert && (
            <div className="persona-tile persona-tile-wide persona-tile-warning">
              <span className="persona-tile-label">☔ Rain Alert</span>
              <span className="persona-tile-sub">{insights.rainAlert}</span>
            </div>
          )}
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Today's Activity Tip</span>
            <span className="persona-tile-sub">{insights.activityTip}</span>
          </div>
        </div>
      )}

      {/* ---------------- Agriculture ---------------- */}
      {persona === 'Agriculture' && (
        <div className="persona-grid">
          <div className={`persona-tile ${insights.frost.risk ? 'persona-tile-warning' : ''}`}>
            <span className="persona-tile-label">Frost Risk (next 3 days)</span>
            <strong>{insights.frost.risk ? `Yes - ${insights.frost.minTemp}°C on ${insights.frost.date}` : 'None expected'}</strong>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">3-Day Rainfall Outlook</span>
            <strong>{insights.rainfall3Day.totalMm} mm</strong>
            <span className="persona-tile-sub">Peak chance of rain: {insights.rainfall3Day.chanceOfRain}%</span>
          </div>
          <div className="persona-tile">
            <span className="persona-tile-label">Soil Moisture (0–1cm)</span>
            {insights.soilMoisture ? (
              <>
                <strong>{insights.soilMoisture.value} m³/m³</strong>
                <span className="persona-tile-sub">{insights.soilMoisture.note}</span>
              </>
            ) : (
              <span className="persona-tile-sub">Not available for this location.</span>
            )}
          </div>
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Seasonal Planting Guidance</span>
            <span className="persona-tile-sub">{insights.plantingTip}</span>
          </div>
        </div>
      )}

      {/* ---------------- Commuter ---------------- */}
      {persona === 'Commuter' && (
        <div className="persona-grid">
          <div className="persona-tile">
            <span className="persona-tile-label">Visibility</span>
            <strong>{insights.visibility != null ? `${insights.visibility} km` : '–'}</strong>
            <span className="persona-tile-sub">{insights.visibilityAdvice}</span>
          </div>
          {insights.fogAlert && (
            <div className="persona-tile persona-tile-warning">
              <span className="persona-tile-label">🌫️ Fog</span>
              <span className="persona-tile-sub">{insights.fogAlert}</span>
            </div>
          )}
          {insights.stormAlert && (
            <div className="persona-tile persona-tile-warning">
              <span className="persona-tile-label">⛈️ Storm</span>
              <span className="persona-tile-sub">{insights.stormAlert}</span>
            </div>
          )}
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">Traffic</span>
            <span className="persona-tile-sub">{insights.trafficNote}</span>
          </div>
        </div>
      )}

      {/* ---------------- Event Planner ---------------- */}
      {persona === 'Event Planner' && (
        <div className="persona-grid">
          <div className="persona-tile persona-tile-wide">
            <span className="persona-tile-label">3-Day Forecast</span>
            <div className="event-forecast-row">
              {insights.threeDayForecast.map((d) => (
                <div key={d.date} className="event-forecast-day">
                  <strong>{d.date}</strong>
                  <span>{d.condition}</span>
                  <span>{d.minTemp}° / {d.maxTemp}°</span>
                  <span>Rain: {d.chanceOfRain}%</span>
                </div>
              ))}
            </div>
          </div>
          {insights.peakHeatHour && (
            <div className="persona-tile">
              <span className="persona-tile-label">Peak Heat Hour</span>
              <strong>{formatTime(insights.peakHeatHour.time)}</strong>
              <span className="persona-tile-sub">{insights.peakHeatHour.temperature}°C</span>
            </div>
          )}
          <div className={`persona-tile ${insights.lightningRisk.level !== 'Low' ? 'persona-tile-warning' : ''}`}>
            <span className="persona-tile-label">Lightning Risk (estimated)</span>
            <strong>{insights.lightningRisk.level}</strong>
            <span className="persona-tile-sub">{insights.lightningRisk.note}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonaPanel;
