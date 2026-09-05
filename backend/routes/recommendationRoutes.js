// backend/routes/recommendationRoutes.js
const express = require('express');
const { getWeatherForCity } = require('../services/weatherService');
const { getRecommendation } = require('../services/recommendationService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { city, activity, persona } = req.body;
    if (!city) return res.status(400).json({ error: 'City is required' });
    if (!activity) return res.status(400).json({ error: 'Activity is required' });

    const weatherData = await getWeatherForCity(city);
    const recommendation = getRecommendation(weatherData, activity, persona || 'General');

    res.json({
      location: weatherData.location,
      weather: {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        feelsLike: weatherData.feelsLike,
        humidity: weatherData.humidity,
        wind: weatherData.wind,
        uv: weatherData.uv,
        rain: weatherData.rain
      },
      recommendation: recommendation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;