// backend/routes/zoneRoutes.js
const express = require('express');
const router = express.Router();
const { getWeatherForCity } = require('../services/weatherService');
const { scoreHour } = require('../services/recommendationService');

// How the zone overlay works: WeatherAPI only gives us ONE reading per exact
// coordinate - there's no free dense pollution-sensor grid to draw a true
// citywide heatmap from. So instead we sample a small grid of points around
// the selected city (each is a real live API call, not fake data) and score
// each one with the SAME persona-weighted formula the recommendation card
// already uses (scoreHour), just applied to "right now" instead of the next
// 24 hours. That turns "is this a good spot for a Wellness walk?" into an
// actual number per point, which the frontend then colors green->red.
//
// This is a genuine approximation, not a claim of block-by-block sensor
// data - worth saying so plainly if asked, rather than overselling it.

const GRID_SIZE = 3; // 3x3 = 9 points total
const GRID_SPACING_DEG = 0.12; // ~13km at the equator, closer near the poles

function buildGridPoints(centerLat, centerLng) {
  const points = [];
  const offset = Math.floor(GRID_SIZE / 2);
  for (let row = -offset; row <= offset; row++) {
    for (let col = -offset; col <= offset; col++) {
      points.push({
        lat: Math.round((centerLat + row * GRID_SPACING_DEG) * 10000) / 10000,
        lng: Math.round((centerLng + col * GRID_SPACING_DEG) * 10000) / 10000
      });
    }
  }
  return points;
}

// Bands the 0-100 persona score into a human label, matching the same
// green/yellow/orange/red language used elsewhere in the app (AirQualityCard,
// ScoreRing) so the map doesn't introduce a fourth different color scheme.
function categorize(score) {
  if (score >= 75) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 35) return 'Poor';
  return 'Unhealthy';
}

router.get('/', async (req, res) => {
  try {
    const { lat, lng, persona } = req.query;
    if (!lat || !lng || !persona) {
      return res.status(400).json({ error: 'lat, lng, and persona are all required.' });
    }

    const centerLat = parseFloat(lat);
    const centerLng = parseFloat(lng);
    const points = buildGridPoints(centerLat, centerLng);

    const results = await Promise.all(
      points.map(async (point) => {
        try {
          // WeatherAPI's q param accepts "lat,lon" directly - this reuses
          // the exact same fetch + 10-minute cache as the main weather
          // route, just keyed by coordinates instead of a city name.
          const weatherData = await getWeatherForCity(`${point.lat},${point.lng}`);
          const { score } = scoreHour(weatherData, persona);
          return { lat: point.lat, lng: point.lng, score, category: categorize(score) };
        } catch (pointErr) {
          // One grid point failing (rate limit, transient error) shouldn't
          // take down the whole overlay - just omit that point.
          return null;
        }
      })
    );

    res.json({ persona, points: results.filter(Boolean) });
  } catch (err) {
    console.error('Zone route error:', err.message);
    res.status(500).json({ error: 'Could not compute zone data.' });
  }
});

module.exports = router;
