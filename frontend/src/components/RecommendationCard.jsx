// frontend/src/components/RecommendationCard.jsx
import React from 'react';
import './RecommendationCard.css';

function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const { activity, persona, score, bestWindow, reasons, warnings } = recommendation;

  const getScoreColor = (s) => {
    if (s >= 80) return '#2dd4bf';
    if (s >= 60) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-activity">
          <span className="rec-icon">🏃</span>
          <span>{activity}</span>
          <span className="rec-persona-badge">{persona}</span>
        </div>
        <div className="rec-score">
          <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
            <span className="score-number">{score}</span>
            <span className="score-label">/100</span>
          </div>
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