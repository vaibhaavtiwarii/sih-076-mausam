// backend/routes/weatherRoutes.js
const express = require('express');
const { getWeatherForCity } = require('../services/weatherService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Bareilly';
    const data = await getWeatherForCity(city);
    res.json(data);
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
