// frontend/src/components/RecommendationCard.jsx
import React from 'react';
import ScoreRing from './ScoreRing';
import './RecommendationCard.css';

function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const { persona, score, bestWindow, reasons, warnings } = recommendation;

  return (
    <div className="rec-card">
      {/* Score + persona live in their own block so they read as one
          glanceable answer on the left, with the full explanation on the
          right - this only pairs side-by-side on wider screens; see the
          @media rule in RecommendationCard.css for the mobile stack. */}
      <div className="rec-score-block">
        <ScoreRing score={score} size={96} strokeWidth={7} />
        <span className="rec-persona-badge">
          <span className="rec-icon">🎯</span> {persona}
        </span>
      </div>

      <div className="rec-details">
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
    </div>
  );
}

export default RecommendationCard;