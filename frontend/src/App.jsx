// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { weatherApi } from './api';
import WeatherCard from './components/WeatherCard';
import RecommendationCard from './components/RecommendationCard';
import AlertList from './components/AlertList';
import Assistant from './components/Assistant';
import ActivitySelector from './components/ActivitySelector';
import './App.css';

function App() {
  const [city, setCity] = useState('Bareilly');
  const [inputCity, setInputCity] = useState('Bareilly');
  const [activity, setActivity] = useState('Running');
  const [persona, setPersona] = useState('Fitness');
  const [weather, setWeather] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAllData = async (cityName, act, pers) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch weather, recommendations, and alerts in parallel
      const [weatherRes, recRes, alertRes] = await Promise.all([
        weatherApi.getWeather(cityName),
        weatherApi.getRecommendation({ city: cityName, activity: act, persona: pers }),
        weatherApi.getAlerts(cityName, act, pers)
      ]);

      setWeather(weatherRes.data);
      setRecommendation(recRes.data.recommendation);
      setAlerts(alertRes.data.alerts);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when city/activity/persona changes
  useEffect(() => {
    fetchAllData(city, activity, persona);
  }, [city, activity, persona]);

  const handleCitySubmit = (e) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setCity(inputCity.trim());
    }
  };

  const handleActivityChange = (newActivity) => {
    setActivity(newActivity);
    // Map activity to persona if needed, but keep it separate for flexibility
  };

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
  };

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
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Activity / Persona Selector */}
        <ActivitySelector
          activity={activity}
          persona={persona}
          onActivityChange={handleActivityChange}
          onPersonaChange={handlePersonaChange}
        />

        {error && <div className="error-banner">{error}</div>}

        {loading && <div className="loading">Loading your personalized weather intelligence...</div>}

        {!loading && weather && (
          <>
            <div className="dashboard-grid">
              {/* Left column: Weather + Forecast */}
              <div className="column primary">
                <WeatherCard weather={weather} />
                {/* Hourly forecast mini */}
                <div className="hourly-forecast">
                  <h3>Hourly Forecast</h3>
                  <div className="hourly-scroll">
                    {weather.hourly && weather.hourly.slice(0, 12).map((hour, idx) => (
                      <div key={idx} className="hour-item">
                        <div className="hour-time">
                          {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                        </div>
                        <div className="hour-temp">{hour.temperature}°</div>
                        <div className="hour-icon">{hour.condition.split(' ')[0]}</div>
                        <div className="hour-rain">{hour.rain}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Recommendations + Alerts */}
              <div className="column secondary">
                {recommendation && (
                  <RecommendationCard recommendation={recommendation} />
                )}
                <AlertList alerts={alerts} />
              </div>
            </div>

            {/* Assistant Section */}
            <div className="assistant-section">
              <Assistant
                city={city}
                activity={activity}
                persona={persona}
              />
            </div>
          </>
        )}

        {!loading && !weather && !error && (
          <div className="empty-state">
            <p>Enter a city to get started with MAUSAM AI.</p>
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