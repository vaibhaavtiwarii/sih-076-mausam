// frontend/src/components/AlertList.jsx
import React from 'react';
import './AlertList.css';

function AlertList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-list">
        <h3>🔔 Smart Alerts</h3>
        <p className="no-alerts">No alerts at this time.</p>
      </div>
    );
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  return (
    <div className="alert-list">
      <h3>🔔 Smart Alerts</h3>
      <div className="alert-items">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item ${getPriorityClass(alert.priority)}`}>
            <div className="alert-title">{alert.title}</div>
            <div className="alert-message">{alert.message}</div>
            <div className="alert-priority">{alert.priority} Priority</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertList;