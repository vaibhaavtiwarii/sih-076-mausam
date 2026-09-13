// backend/routes/subscriberRoutes.js
const express = require('express');
const Subscriber = require('../models/Subscriber');
const { getWeatherForCity } = require('../services/weatherService');   // NEW
const { generateAlerts } = require('../services/alertService');         // NEW
const { sendSMS } = require('../services/smsService');                  // NEW

const router = express.Router();

// ... keep your existing POST '/' and DELETE '/:phone' routes exactly as they are ...

// POST /api/subscribers/demo-alert -> sends ONE real, weather-based alert
// SMS to a single phone number, right now. Safe for a live judge demo:
// it doesn't touch the subscriber list or send to anyone else.
router.post('/demo-alert', async (req, res) => {
  try {
    const { phone, city, persona } = req.body;
    if (!phone || !city || !persona) {
      return res.status(400).json({ error: 'phone, city and persona are required.' });
    }

    const weatherData = await getWeatherForCity(city);
    const alerts = generateAlerts(weatherData, persona); // unfiltered — always returns at least one
    const top = alerts[0];

    const message = `MAUSAM AI Alert (${city}): ${top.title.replace(/[^\w\s]/gi, '').trim()} - ${top.message}`;
    await sendSMS(phone, message);

    res.json({ message: 'Demo alert sent!', alert: top });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;