// frontend/src/components/Assistant.jsx
import React, { useState } from 'react';
import { weatherApi } from '../api';
import './Assistant.css';

function Assistant({ city, activity, persona }) { // We accept props, but we won't send them to the AI
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
      // New way: Send ONLY the prompt to Gemini
      const res = await weatherApi.askAssistant({
        prompt: question.trim()
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.reply || err.response?.data?.error || 'Failed to get response.');
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
        {/* Changed from "Demo Reasoning Mode" */}
        <span className="assistant-mode">Powered by Gemini AI</span> 
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
          <div className="response-question">Q: {question}</div>
          {/* Changed from response.response to response.reply */}
          <div className="response-answer">A: {response.reply}</div>
          <div className="response-meta">
            {/* Changed response.mode and response.location */}
            <span>AI Smart Assistant</span>
            <span>📍 Auto-detected by Gemini</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assistant;