// frontend/src/components/RecommendationCard.jsx
import React from 'react';
import ScoreRing from './ScoreRing';
import './RecommendationCard.css';

function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const { persona, score, bestWindow, reasons, warnings, locationMismatch } = recommendation;

  return (
    <div className="rec-card">
      <span className="spotlight-badge rec-spotlight-badge">✨ Personalized for you</span>

      {locationMismatch && (
        <div className="rec-mismatch-banner">
          <span className="rec-mismatch-icon">🚫</span>
          <div>
            <strong>This score may not be meaningful here.</strong>
            <p>{locationMismatch}</p>
          </div>
        </div>
      )}

      <div className="rec-header">
        <div className="rec-activity">
          <span className="rec-icon">🎯</span>
          <span className="rec-persona-badge">{persona}</span>
        </div>
        <div className="rec-score">
          <ScoreRing score={score} size={64} strokeWidth={5} />
        </div>
      </div>

      <div className="rec-window">
        <span className="window-label">⏱ Best Time</span>
        <span className="window-value">{bestWindow}</span>
      </div>

      <div className="rec-reasons">
        <h4>Why this window?</h4>
        <ul>
          {reasons && reasons.map((reason, idx) => (
            <li key={idx}>✅ {reason}</li>
          ))}
        </ul>
      </div>

      {warnings && warnings.length > 0 && (
        <div className="rec-warnings">
          <h4>⚠️ Warnings</h4>
          <ul>
            {warnings.map((warn, idx) => (
              <li key={idx}>⚠️ {warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RecommendationCard;