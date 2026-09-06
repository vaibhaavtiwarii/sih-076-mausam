// backend/routes/alertRoutes.js
const express = require('express');
const { getWeatherForCity } = require('../services/weatherService');
const { generateAlerts } = require('../services/alertService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Bareilly';
    const activity = req.query.activity || 'Commute';
    const persona = req.query.persona || 'General';

    const weatherData = await getWeatherForCity(city);
    const alerts = generateAlerts(weatherData, activity, persona);

    res.json({
      location: weatherData.location,
      alerts: alerts
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
