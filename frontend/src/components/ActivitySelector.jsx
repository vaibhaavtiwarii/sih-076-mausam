// frontend/src/components/ActivitySelector.jsx
import React from 'react';
import './ActivitySelector.css';

const ACTIVITIES = ['Running', 'Cycling', 'Commute', 'Outdoor Event', 'Travel', 'Farming'];
const PERSONAS = ['Fitness', 'Agriculture', 'Travel', 'Family', 'Commute', 'Events'];

function ActivitySelector({ activity, persona, onActivityChange, onPersonaChange }) {
  return (
    <div className="selector">
      <div className="selector-group">
        <label className="selector-label">Activity</label>
        <div className="selector-buttons">
          {ACTIVITIES.map((act) => (
            <button
              key={act}
              className={`selector-btn ${activity === act ? 'active' : ''}`}
              onClick={() => onActivityChange(act)}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-group">
        <label className="selector-label">Persona</label>
        <div className="selector-buttons">
          {PERSONAS.map((pers) => (
            <button
              key={pers}
              className={`selector-btn ${persona === pers ? 'active' : ''}`}
              onClick={() => onPersonaChange(pers)}
            >
              {pers}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivitySelector;