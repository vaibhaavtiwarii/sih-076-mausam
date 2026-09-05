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
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;