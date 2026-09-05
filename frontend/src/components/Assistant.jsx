// frontend/src/components/Assistant.jsx
import React, { useState } from 'react';
import { weatherApi } from '../api';
import './Assistant.css';

function Assistant({ city, activity, persona }) {
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
        question: question.trim(),
        city: city,
        activity: activity,
        persona: persona
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Can I go running at 5 PM?',
    'Will rain affect my event?',
    'What should I prepare for tomorrow?'
  ];

  return (
    <div className="assistant">
      <div className="assistant-header">
        <h3>🤖 Ask MAUSAM AI</h3>
        <span className="assistant-mode">Demo Reasoning Mode</span>
      </div>

      <div className="quick-prompts">
        {quickPrompts.map((prompt, idx) => (
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
            {prompt}
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
          <div className="response-question">Q: {response.question}</div>
          <div className="response-answer">A: {response.response}</div>
          <div className="response-meta">
            <span>{response.mode}</span>
            <span>📍 {response.location}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assistant;