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
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;