// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { weatherApi } from './api';
import WeatherCard from './components/WeatherCard';
import RecommendationCard from './components/RecommendationCard';
import AlertList from './components/AlertList';
import AirQualityCard from './components/AirQualityCard';
import SavedLocationsCard from './components/SavedLocationsCard';
import DailyForecastCard from './components/DailyForecastCard';
import MapView from './components/MapView';
import LoadingScreen from './components/LoadingScreen';
import Assistant from './components/Assistant';
import ActivitySelector from './components/ActivitySelector';
import PersonaPanel from './components/PersonaPanel';
import CitySelect from './components/CitySelect';
import './App.css';

function App() {
  // 'landing' = the city-select screen, 'dashboard' = the main weather app
  const [stage, setStage] = useState('landing');
  const [city, setCity] = useState('');
  const [inputCity, setInputCity] = useState('');
  const [persona, setPersona] = useState('Fitness');
  const [weather, setWeather] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [alertPopupOpen, setAlertPopupOpen] = useState(false);

  const fetchAllData = async (cityName, pers) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch weather, recommendation, alerts, and persona insights in parallel.
      // The backend caches/de-dupes the underlying weather lookup, so this
      // doesn't multiply external API calls.
      const [weatherRes, recRes, alertRes, personaRes] = await Promise.all([
        weatherApi.getWeather(cityName),
        weatherApi.getRecommendation({ city: cityName, persona: pers }),
        weatherApi.getAlerts(cityName, pers),
        weatherApi.getPersonaInsights(cityName, pers)
      ]);

      setWeather(weatherRes.data);
      setRecommendation(recRes.data.recommendation);
      setAlerts(alertRes.data.alerts);
      setInsights(personaRes.data.insights);
      setLastUpdated(new Date().toLocaleTimeString());

      // Surface alerts as a popup the moment they load, instead of making
      // the user notice the Smart Alerts card tucked in the sidebar. The
      // card itself still renders as always - this is just an extra,
      // dismissible heads-up on top of it.
      if (alertRes.data.alerts && alertRes.data.alerts.length > 0) {
        setAlertPopupOpen(true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever we're on the dashboard and city/persona changes
  useEffect(() => {
    if (stage === 'dashboard' && city) {
      fetchAllData(city, persona);
    }
  }, [stage, city, persona]);

  // Escape closes the map modal, same as the assistant popup
  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMapOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  // Same Escape-to-close behavior for the alert popup
  useEffect(() => {
    if (!alertPopupOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setAlertPopupOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [alertPopupOpen]);

  // Called from the landing screen once a city has been chosen
  const handleLocationConfirmed = (selectedCity) => {
    setCity(selectedCity);
    setInputCity(selectedCity);
    setStage('dashboard');
  };

  // Lets the user go back and pick a different city
  const handleChangeLocation = () => {
    setWeather(null);
    setRecommendation(null);
    setAlerts([]);
    setInsights(null);
    setAlertPopupOpen(false);
    setStage('landing');
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setCity(inputCity.trim());
    }
  };

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
  };

  // Screen 1: ask the user for their location before showing anything else
  if (stage === 'landing') {
    return <CitySelect onContinue={handleLocationConfirmed} />;
  }

  // Screen 2: the full dashboard
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1>🌤️ MAUSAM AI</h1>
            <span className="tagline">Know what it means for you.</span>
          </div>
          <div className="header-controls">
            <form onSubmit={handleCitySubmit} className="city-form">
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder="Enter city..."
                className="city-input"
              />
              <button type="submit" className="btn btn-primary">Go</button>
            </form>
            {lastUpdated && (
              <span className="last-updated">Updated: {lastUpdated}</span>
            )}
            <Assistant city={city} persona={persona} />
            <button
              type="button"
              className="change-location-btn"
              onClick={handleChangeLocation}
            >
              📍 Change location
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* "What describes you?" persona selector */}
        <ActivitySelector
          persona={persona}
          onPersonaChange={handlePersonaChange}
        />

        {error && <div className="error-banner">{error}</div>}

        {loading && <LoadingScreen />}

        {!loading && weather && (
          <>
            {/* The personalization "scale" - score, best time, and the
                why-this-window reasons - promoted to the top, full width,
                so it's the first thing visible without scrolling past
                the weather card and map first. */}
            {recommendation && (
              <div className="spotlight-section">
                <RecommendationCard recommendation={recommendation} />
              </div>
            )}

            <div className="dashboard-grid">
              {/* Left column: Weather + Forecast + 3-day outlook - this
                  fills the space that used to sit blank under the weather
                  card, keeping this column close in height to the sidebar. */}
              <div className="column primary">
                <WeatherCard weather={weather} onOpenMap={() => setMapOpen(true)} />
                <DailyForecastCard daily={weather?.daily} />
              </div>

              {/* Right column: Air Quality + Alerts + Saved Locations */}
              <div className="column secondary">
                {weather?.airQuality && (
                  <AirQualityCard airQuality={weather.airQuality} />
                )}
                <AlertList alerts={alerts} />
                <SavedLocationsCard city={city} onSelectCity={setCity} />
              </div>
            </div>

            {/* Persona-specific panel (Wellness/Fitness/Surfer/Traveler/etc.) -
                back to full-width below the grid, now that the 3-day
                forecast fills the left column's blank space instead. */}
            <PersonaPanel persona={persona} insights={insights} city={city} />

            {/* Interactive Map - only mounted while open, so it isn't
                fetching/rendering tiles in the background the rest of the
                time. Closing via the backdrop, the ✕, or Escape all just
                flip mapOpen back to false. */}
            {mapOpen && (
              <div className="map-modal-overlay" onClick={() => setMapOpen(false)}>
                <div className="map-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="map-modal-header">
                    <h3>🗺️ Interactive Map · {weather?.location}</h3>
                    <button
                      type="button"
                      className="map-modal-close"
                      onClick={() => setMapOpen(false)}
                      aria-label="Close map"
                    >
                      ✕
                    </button>
                  </div>
                  <MapView
                    latitude={weather?.latitude}
                    longitude={weather?.longitude}
                    location={weather?.location}
                    persona={persona}
                  />
                </div>
              </div>
            )}

            {/* Alert popup - fires once when alerts load for this
                city/persona. Dismissing it just closes the popup; the
                Smart Alerts card in the sidebar keeps showing the same
                alerts as always, popup or not. */}
            {alertPopupOpen && alerts.length > 0 && (
              <div className="alert-popup-overlay" onClick={() => setAlertPopupOpen(false)}>
                <div className="alert-popup" onClick={(e) => e.stopPropagation()}>
                  <div className="alert-popup-header">
                    <h3>🔔 Smart Alerts</h3>
                    <button
                      type="button"
                      className="alert-popup-close"
                      onClick={() => setAlertPopupOpen(false)}
                      aria-label="Dismiss alerts"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="alert-items">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`alert-item ${
                          alert.priority === 'High' ? 'priority-high'
                            : alert.priority === 'Medium' ? 'priority-medium'
                            : 'priority-low'
                        }`}
                      >
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-message">{alert.message}</div>
                        <div className="alert-priority">{alert.priority} Priority</div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="alert-popup-dismiss" onClick={() => setAlertPopupOpen(false)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !weather && !error && (
          <div className="empty-state">
            <p>Fetching weather for {city}...</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>MAUSAM AI · Personalized Weather Intelligence · SIH 2026</p>
        <p className="footer-sub">Ministry of Earth Sciences · India Meteorological Department</p>
      </footer>
    </div>
  );
}

export default App;
