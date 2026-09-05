/* frontend/src/App.css */
:root {
  --navy: #0b1124;
  --navy-light: #141d3a;
  --cyan: #06b6d4;
  --cyan-dark: #0891b2;
  --teal: #2dd4bf;
  --blue: #3b82f6;
  --text-primary: #f0f4ff;
  --text-secondary: #94a3b8;
  --card-bg: rgba(20, 29, 58, 0.65);
  --border-subtle: rgba(6, 182, 212, 0.20);
  --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 40px rgba(6, 182, 212, 0.10);
}

.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === HEADER === */
.app-header {
  padding: 16px 0 24px 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 28px;
  backdrop-filter: blur(12px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.brand h1 {
  font-size: 30px;
  font-weight: 900;
  background: linear-gradient(135deg, #06b6d4 0%, #2dd4bf 50%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 0 40px rgba(6, 182, 212, 0.15);
}

.brand .tagline {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  -webkit-text-fill-color: var(--text-secondary);
  background: none;
  padding-left: 4px;
  letter-spacing: 0.3px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.city-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.city-input {
  padding: 10px 18px;
  border-radius: 40px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 14px;
  width: 200px;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.city-input:focus {
  outline: none;
  border-color: var(--cyan);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 25px rgba(6, 182, 212, 0.10);
}

.city-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--cyan), var(--cyan-dark));
  color: #fff;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 30px rgba(6, 182, 212, 0.35);
}

.last-updated {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
  font-weight: 400;
}

/* === MAIN === */
.app-main {
  flex: 1;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  padding: 14px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  backdrop-filter: blur(8px);
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
  font-size: 18px;
  font-weight: 500;
  animation: pulse-text 1.8s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: var(--text-secondary);
  font-size: 20px;
  font-weight: 400;
}

/* === DASHBOARD GRID === */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 32px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* === HOURLY FORECAST === */
.hourly-forecast {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow), var(--shadow-glow);
  transition: all 0.3s ease;
}

.hourly-forecast:hover {
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: var(--shadow), 0 0 50px rgba(6, 182, 212, 0.08);
}

.hourly-forecast h3 {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 18px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hourly-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 6px 2px 12px 2px;
  scrollbar-width: thin;
  scrollbar-color: var(--cyan) transparent;
}

.hourly-scroll::-webkit-scrollbar {
  height: 4px;
}
.hourly-scroll::-webkit-scrollbar-thumb {
  background: var(--cyan);
  border-radius: 10px;
}

.hour-item {
  flex: 0 0 80px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 14px 10px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.hour-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--border-subtle);
  transform: translateY(-4px);
}

.hour-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.hour-temp {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.hour-icon {
  font-size: 18px;
  margin: 6px 0 4px 0;
}
.hour-rain {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(255,255,255,0.04);
  padding: 2px 8px;
  border-radius: 20px;
  display: inline-block;
}

/* === ASSISTANT === */
.assistant-section {
  margin-top: 8px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
  padding: 24px;
  box-shadow: var(--shadow), var(--shadow-glow);
  transition: all 0.3s ease;
}

.assistant-section:hover {
  border-color: rgba(6, 182, 212, 0.30);
}

/* === FOOTER === */
.app-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.app-footer .footer-sub {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.5;
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .app {
    padding: 16px 12px;
  }
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  .brand h1 {
    font-size: 26px;
  }
  .brand .tagline {
    font-size: 13px;
  }
  .city-form {
    width: 100%;
  }
  .city-input {
    flex: 1;
    width: auto;
  }
  .header-controls {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .hour-item {
    flex: 0 0 70px;
    padding: 10px 6px;
  }
  .hour-temp {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .brand h1 {
    font-size: 22px;
  }
  .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  .last-updated {
    font-size: 10px;
  }
}