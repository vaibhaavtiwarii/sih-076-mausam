// frontend/src/components/ScoreRing.jsx
import React from 'react';
import './ScoreRing.css';

// Same thresholds RecommendationCard already used for its flat circle,
// kept here so the ring and any future score displays agree on color.
function getScoreColor(score) {
  if (score >= 80) return '#2dd4bf';
  if (score >= 60) return '#fbbf24';
  return '#f87171';
}

function ScoreRing({ score, size = 64, strokeWidth = 5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = getScoreColor(score);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15, 23, 42, 0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="score-ring-progress"
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-number">{score}</span>
        <span className="score-ring-unit">/100</span>
      </div>
    </div>
  );
}

export default ScoreRing;