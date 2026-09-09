// frontend/src/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://mausam-ai-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const weatherApi = {
  getWeather: (city) => api.get(`/api/weather?city=${encodeURIComponent(city)}`),
  getRecommendation: (data) => api.post('/api/recommend', data), // { city, persona }
  getAlerts: (city, persona) =>
    api.get(`/api/alerts?city=${encodeURIComponent(city)}&persona=${encodeURIComponent(persona)}`),
  getPersonaInsights: (city, persona) =>
    api.get(`/api/persona?city=${encodeURIComponent(city)}&persona=${encodeURIComponent(persona)}`),
  askAssistant: (data) => api.post('/api/assistant', data),
  getZone: (lat, lng, persona) =>
    api.get(`/api/zone?lat=${lat}&lng=${lng}&persona=${encodeURIComponent(persona)}`)
};

export default api;
