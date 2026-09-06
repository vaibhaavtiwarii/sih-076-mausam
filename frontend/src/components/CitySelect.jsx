// frontend/src/components/CitySelect.jsx
import React, { useState } from 'react';
import { WiDaySunny } from 'react-icons/wi';
import { FiMapPin } from 'react-icons/fi';
import './CitySelect.css';

const QUICK_CITIES = ['Delhi', 'Mumbai', 'Bareilly', 'Bengaluru', 'Kolkata', 'Chennai'];

function CitySelect({ onContinue }) {
  const [cityInput, setCityInput] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      onContinue(cityInput.trim());
    }
  };

  const handleQuickPick = (city) => {
    onContinue(city);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location detection. Please type your city instead.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Free, no-API-key reverse geocoding service - converts lat/lon into a city name.
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const detectedCity = data.city || data.locality || data.principalSubdivision;

          if (detectedCity) {
            onContinue(detectedCity);
          } else {
            setGeoError("Couldn't figure out your city from your location. Please type it manually.");
          }
        } catch (err) {
          setGeoError("Something went wrong detecting your location. Please type your city manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        // User denied permission, or the browser couldn't get a location
        setGeoError('Location permission denied. Please type your city manually.');
        setGeoLoading(false);
      }
    );
  };

  return (
    <div className="city-select-screen">
      <div className="city-select-card">
        <div className="city-select-brand">
          <WiDaySunny size={54} color="#0ea5e9" />
          <h1>MAUSAM AI</h1>
        </div>
        <p className="city-select-tagline">Know what the weather means for you.</p>

        <form onSubmit={handleSubmit} className="city-select-form">
          <div className="city-select-input-wrap">
            <FiMapPin className="city-select-input-icon" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter your city..."
              className="city-select-input"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary city-select-submit" disabled={!cityInput.trim()}>
            Continue
          </button>
        </form>

        <button
          type="button"
          className="city-select-location-btn"
          onClick={handleUseLocation}
          disabled={geoLoading}
        >
          {geoLoading ? 'Detecting your location...' : '📍 Use my current location'}
        </button>

        {geoError && <p className="city-select-error">{geoError}</p>}

        <div className="city-select-divider">
          <span>or pick a city</span>
        </div>

        <div className="city-select-quick-picks">
          {QUICK_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              className="city-select-chip"
              onClick={() => handleQuickPick(city)}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <p className="city-select-footer">MAUSAM AI · Personalized Weather Intelligence · SIH 2026</p>
    </div>
  );
}

export default CitySelect;