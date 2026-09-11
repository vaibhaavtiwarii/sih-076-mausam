// frontend/src/components/Assistant.jsx
import React, { useState } from 'react';
import { weatherApi } from '../api';
import './Assistant.css';

function Assistant({ city, persona }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.askAssistant({
        prompt: question.trim(),
        city,
        persona
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.reply || err.response?.data?.error || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { icon: '🏃', text: 'Can I go running at 5 PM?' },
    { icon: '🌧️', text: 'Will rain affect my event?' },
    { icon: '🎒', text: 'What should I prepare for tomorrow?' }
  ];

  return (
    <div className="assistant">
      <div className="assistant-header">
        <h3>🤖 Ask MAUSAM AI</h3>
        <span className="spotlight-badge">✨ Personalized for you</span>
      </div>
      <p className="assistant-subtitle">
        Answers factor in your {persona.toLowerCase()} persona and {city}'s live weather - not a generic forecast.
      </p>

      <div className="quick-prompts">
        {quickPrompts.map(({ icon, text: prompt }, idx) => (
          <button
            key={idx}
            className="quick-prompt-btn"
            onClick={() => {
              setQuestion(prompt);
              // Auto-submit after a tiny delay
              setTimeout(() => {
                const form = document.querySelector('.assistant-form');
                if (form) form.dispatchEvent(new Event('submit'));
              }, 100);
            }}
          >
            <span>{icon}</span> {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={handleAsk} className="assistant-form">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about the weather for your plans..."
          className="assistant-input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <div className="assistant-error">{error}</div>}

      {response && (
        <div className="assistant-response">
          <div className="response-question">Q: {question}</div>
          <div className="response-answer">A: {response.reply}</div>
          <div className="response-meta">
            <span>AI Smart Assistant</span>
            <span>📍 {city} · {persona}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assistant;