// frontend/src/components/SavedLocationsCard.jsx
import React, { useEffect, useState } from 'react';
import './SavedLocationsCard.css';

const SAVED_LOCATIONS_KEY = 'mausam_saved_locations';

function loadSavedLocations() {
  try {
    const raw = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedLocations(list) {
  try {
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (e.g. private browsing) - fail silently
  }
}

function SavedLocationsCard({ city, onSelectCity }) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(loadSavedLocations());
  }, []);

  const isCurrentSaved = city && saved.some(s => s.toLowerCase() === city.toLowerCase());

  const handleSaveCurrent = () => {
    if (!city || isCurrentSaved) return;
    const updated = [...saved, city];
    setSaved(updated);
    persistSavedLocations(updated);
  };

  const handleRemove = (name) => {
    const updated = saved.filter(s => s !== name);
    setSaved(updated);
    persistSavedLocations(updated);
  };

  return (
    <div className="saved-locations-card">
      <div className="saved-locations-header">
        <h3>Saved Locations</h3>
        <button
          type="button"
          className="save-current-btn"
          onClick={handleSaveCurrent}
          disabled={!city || isCurrentSaved}
        >
          + Save current
        </button>
      </div>
      {saved.length === 0 ? (
        <p className="no-saved-locations">No saved locations yet.</p>
      ) : (
        <div className="saved-locations-list">
          {saved.map((name) => (
            <div key={name} className="saved-location-item">
              <button
                type="button"
                className="saved-location-name"
                onClick={() => onSelectCity(name)}
              >
                📍 {name}
              </button>
              <button
                type="button"
                className="saved-location-remove"
                onClick={() => handleRemove(name)}
                aria-label={`Remove ${name}`}
              >
                🔖
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedLocationsCard;
