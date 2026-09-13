// frontend/src/components/SubscribeForm.jsx
import React, { useState } from 'react';
import { weatherApi } from '../api';
import './SubscribeForm.css';

function SubscribeForm({ city, persona }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const isValidPhone = (p) => /^\+?\d{10,13}$/.test(p.replace(/\s/g, ''));

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setStatus({ type: 'error', text: 'Enter a valid phone number, e.g. +919876543210' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await weatherApi.subscribeToAlerts({ name, phone, city, persona });
      setStatus({ type: 'success', text: `Subscribed! You'll get SMS alerts for ${city}.` });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAlert = async () => {
    if (!isValidPhone(phone)) {
      setStatus({ type: 'error', text: 'Enter a valid phone number first.' });
      return;
    }
    setDemoLoading(true);
    setStatus(null);
    try {
      const res = await weatherApi.sendDemoAlert({ phone, city, persona });
      setStatus({ type: 'success', text: `Sent: "${res.data.alert.title}" — check your phone!` });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to send demo alert.' });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="subscribe-card">
      <div className="subscribe-header">
        <h3>📲 SMS Weather Alerts</h3>
      </div>
      <p className="subscribe-subtext">
        No smartphone needed — get critical weather alerts for {city} straight to your phone via SMS.
      </p>

      <form onSubmit={handleSubscribe} className="subscribe-form">
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone number, e.g. +919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <div className="subscribe-actions">
          <button type="submit" className="subscribe-btn" disabled={loading}>
            {loading ? 'Subscribing...' : 'Subscribe to Alerts'}
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={handleDemoAlert}
            disabled={demoLoading}
          >
            {demoLoading ? 'Sending...' : '🧪 Send Live Demo Alert'}
          </button>
        </div>
      </form>

      {status && (
        <p className={`subscribe-status ${status.type}`}>{status.text}</p>
      )}
    </div>
  );
}

export default SubscribeForm;