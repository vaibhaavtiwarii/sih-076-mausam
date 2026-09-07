// frontend/src/components/LoadingScreen.jsx
import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

const STEPS = [
  'Analyzing your persona...',
  'Fetching live weather data...',
  'Checking air quality...',
  'Ranking relevant conditions...',
  'Generating personalized insights...'
];

// Purely cosmetic pacing so each step visibly checks off instead of the
// screen jumping straight to done - the real fetch runs in parallel in
// App.jsx and this just gives the user something to watch happen instead
// of staring at a blank page for however long the network calls take.
const STEP_INTERVAL_MS = 550;

function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= STEPS.length - 1) return;
    const timer = setTimeout(() => setActiveStep((s) => s + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-steps">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`loading-step ${i < activeStep ? 'done' : ''} ${i === activeStep ? 'active' : ''}`}
          >
            <span className="loading-step-icon">
              {i < activeStep ? '✓' : i === activeStep ? '→' : '·'}
            </span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingScreen;
