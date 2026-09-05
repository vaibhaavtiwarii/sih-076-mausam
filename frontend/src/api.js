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
  getWeather: (city) => api.get(`/api/weather?city=${city}`),
  getRecommendation: (data) => api.post('/api/recommend', data),
  getAlerts: (city, activity, persona) => 
    api.get(`/api/alerts?city=${city}&activity=${activity}&persona=${persona}`),
  askAssistant: (data) => api.post('/api/assistant', data)
};

export default api;