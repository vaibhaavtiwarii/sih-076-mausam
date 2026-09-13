// backend/routes/subscriberRoutes.js
const express = require('express');
const Subscriber = require('../models/Subscriber');

const router = express.Router();

// POST /api/subscribers -> register/update a phone number for SMS alerts
router.post('/', async (req, res) => {
  try {
    const { name, phone, city, persona, language } = req.body;
    if (!phone || !city) {
      return res.status(400).json({ error: 'phone and city are required.' });
    }

    const subscriber = await Subscriber.findOneAndUpdate(
      { phone: phone.trim() },
      { name, phone: phone.trim(), city, persona, language, active: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Subscribed successfully', subscriber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/subscribers/:phone -> unsubscribe
router.delete('/:phone', async (req, res) => {
  try {
    const subscriber = await Subscriber.findOneAndUpdate(
      { phone: req.params.phone },
      { active: false },
      { new: true }
    );
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found.' });
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// // TEMPORARY: manually trigger the alert check for testing
// const { checkAndNotify } = require('../services/alertScheduler');
// router.post('/test-alert-check', async (req, res) => {
//   try {
//     await checkAndNotify();
//     res.json({ message: 'Alert check triggered — check your phone and terminal.' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


module.exports = router;