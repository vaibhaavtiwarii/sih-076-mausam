// frontend/src/components/MobileTabs.jsx
import React, { useState } from 'react';
import WeatherCard from './WeatherCard';
import DailyForecastCard from './DailyForecastCard';
import AirQualityCard from './AirQualityCard';
import AlertList from './AlertList';
import SavedLocationsCard from './SavedLocationsCard';
import DemoAlertButton from './DemoAlertButton';
import PersonaPanel from './PersonaPanel';
import './MobileTabs.css';

const TABS = [
  { id: 'weather', label: 'Weather', icon: '🌤️' },
  { id: 'insights', label: 'Insights', icon: '🎯' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' }
];

// This only renders on phone-width screens (see App.jsx). The persona
// picker and the score/recommendation card stay above this, always
// visible - everything else (full forecast, air quality, persona
// insights, smart alerts, saved locations, SMS demo) is sorted into
// exactly 3 tabs instead of one long stacked scroll, so nothing is more
// than one tap away.
function MobileTabs({ weather, alerts, insights, persona, city, subscribedPhone, onSelectCity, onOpenMap }) {
  const [tab, setTab] = useState('weather');

  return (
    <div className="mobile-tabs">
      <div className="mobile-tab-panel">
        {tab === 'weather' && (
          <>
            <WeatherCard weather={weather} onOpenMap={onOpenMap} />
            <DailyForecastCard daily={weather?.daily} />
          </>
        )}

        {tab === 'insights' && (
          <>
            {weather?.airQuality && <AirQualityCard airQuality={weather.airQuality} />}
            <PersonaPanel persona={persona} insights={insights} city={city} />
          </>
        )}

        {tab === 'alerts' && (
          <>
            <AlertList alerts={alerts} />
            <SavedLocationsCard city={city} onSelectCity={onSelectCity} />
            <DemoAlertButton city={city} persona={persona} initialPhone={subscribedPhone} />
          </>
        )}
      </div>

      <nav className="mobile-tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mobile-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="mobile-tab-icon">{t.icon}</span>
            <span className="mobile-tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default MobileTabs;
