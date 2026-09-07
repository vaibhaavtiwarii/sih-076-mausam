// backend/routes/personaRoutes.js
const express = require('express');
const { getWeatherForCity } = require('../services/weatherService');
const { buildPersonaInsights } = require('../services/personaInsightsService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Bareilly';
    const persona = req.query.persona || 'Fitness';

    const weatherData = await getWeatherForCity(city);
    const insights = await buildPersonaInsights(weatherData, persona);

    res.json({
      location: weatherData.location,
      persona,
      insights
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      return res.status(429).json({
        error: 'Weather service is busy right now (rate limited). Please wait a few seconds and try again.'
      });
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
