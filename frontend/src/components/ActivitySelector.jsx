// frontend/src/components/ActivitySelector.jsx
// (kept this filename so App.jsx doesn't need an import path change - this
// is now a single "What describes you?" persona selector, the old separate
// Activity row was removed since it duplicated the persona choice.)
import React from 'react';
import './ActivitySelector.css';

const PERSONAS = [
  'Wellness',
  'Fitness',
  'Surfer',
  'Traveler',
  'Family',
  'Agriculture',
  'Commuter',
  'Event Planner'
];

function ActivitySelector({ persona, onPersonaChange }) {
  return (
    <div className="selector">
      <label className="selector-label">What describes you?</label>
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
  );
}

export default ActivitySelector;
