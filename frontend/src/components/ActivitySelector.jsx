// frontend/src/components/ActivitySelector.jsx
import React from 'react';
import Icon from './Icon';
import './ActivitySelector.css';

const PERSONAS = [
  { name: 'Wellness', icon: 'sparkle' },
  { name: 'Fitness', icon: 'fitness' },
  { name: 'Surfer', icon: 'wind' },
  { name: 'Traveler', icon: 'plane' },
  { name: 'Family', icon: 'users' },
  { name: 'Agriculture', icon: 'leaf' },
  { name: 'Commuter', icon: 'car' },
  { name: 'Event Planner', icon: 'event' },
];

function ActivitySelector({ persona, onPersonaChange }) {
  return (
    <div className="selector">
      <span className="selector-label">What describes you?</span>
      <div className="selector-buttons">
        {PERSONAS.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            className={`selector-btn ${persona === name ? 'active' : ''}`}
            onClick={() => onPersonaChange(name)}
          >
            <Icon name={icon} size={16} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ActivitySelector;
