// frontend/src/components/Assistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { weatherApi } from '../api';
import './Assistant.css';

const QUICK_PROMPTS = [
  { icon: '🏃', text: 'Can I go running at 5 PM?' },
  { icon: '🌧️', text: 'Will rain affect my event?' },
  { icon: '🎒', text: 'What should I prepare for tomorrow?' }
];

function Assistant({ city, persona }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const ask = async (text) => {
    const finalQuestion = (text ?? question).trim();
    if (!finalQuestion) return;

    setQuestion(finalQuestion);
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.askAssistant({ prompt: finalQuestion, city, persona });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.reply || err.response?.data?.error || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    ask();
  };

  // Escape closes the popup, and the input auto-focuses on open.
  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setChatOpen(false); };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [chatOpen]);

  return (
    <>
      {/* Just a small icon now, sized to sit in the header row next to
          "Change location" - no reserved block on the page at all.
          Everything (chips, input, answer) lives in the popup. */}
      <button
        className="assistant-icon-btn"
        onClick={() => setChatOpen(true)}
        aria-label="Ask MAUSAM AI - your personalized weather assistant"
        title="Ask MAUSAM AI"
      >
        <span className="assistant-icon-emoji">🤖</span>
        <span className="assistant-icon-spark">✨</span>
      </button>

      {chatOpen && (
        <div className="assistant-overlay" onClick={() => setChatOpen(false)}>
          <div className="assistant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assistant-modal-header">
              <div>
                <h3>🤖 MAUSAM AI</h3>
                <span className="assistant-modal-sub">📍 {city} · {persona}</span>
              </div>
              <button className="assistant-close" onClick={() => setChatOpen(false)} aria-label="Close chat">✕</button>
            </div>

            <p className="assistant-modal-intro">
              Answers factor in your {persona.toLowerCase()} persona and {city}'s live weather - not a generic forecast.
            </p>

            <div className="quick-prompts">
              {QUICK_PROMPTS.map(({ icon, text }, idx) => (
                <button key={idx} className="quick-prompt-btn" onClick={() => ask(text)}>
                  <span>{icon}</span> {text}
                </button>
              ))}
            </div>

            <form onSubmit={handleAsk} className="assistant-form">
              <input
                ref={inputRef}
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
        </div>
      )}
    </>
  );
}

export default Assistant;
