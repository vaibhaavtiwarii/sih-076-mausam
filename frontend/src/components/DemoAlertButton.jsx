// frontend/src/components/DemoAlertButton.jsx
import React, { useState } from 'react';
import { weatherApi } from '../api';
import './DemoAlertButton.css';

function DemoAlertButton({ city, persona }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValidPhone = (p) => /^\+?\d{10,13}$/.test(p.replace(/\s/g, ''));

  const handleDemoAlert = async () => {
    if (!isValidPhone(phone)) {
      setStatus({ type: 'error', text: 'Enter a valid phone number, e.g. +919876543210' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await weatherApi.sendDemoAlert({ phone, city, persona });
      setStatus({ type: 'success', text: `Sent: "${res.data.alert.title}" — check the phone!` });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to send demo alert.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-alert-card">
      <h3>🧪 SMS Alert Demo</h3>
      <p className="demo-alert-subtext">
        Show this live: enter any phone number and get a real, weather-based SMS for {city} in seconds.
      </p>
      <div className="demo-alert-row">
        <input
          type="tel"
          placeholder="+919876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="button" onClick={handleDemoAlert} disabled={loading}>
          {loading ? 'Sending...' : 'Send Now'}
        </button>
      </div>
      {status && <p className={`demo-alert-status ${status.type}`}>{status.text}</p>}
    </div>
  );
}

export default DemoAlertButton;