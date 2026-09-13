// backend/services/alertScheduler.js
const cron = require('node-cron');
const Subscriber = require('../models/Subscriber');
const { getWeatherForCity } = require('./weatherService');
const { generateAlerts } = require('./alertService');
const { sendSMS } = require('./smsService');

function isWorthTexting(alert) {
  return alert.priority === 'High' || alert.priority === 'Medium';
}

async function checkAndNotify() {
  console.log('🔔 Running scheduled alert check for subscribers...');

  let subscribers;
  try {
    subscribers = await Subscriber.find({ active: true });
  } catch (err) {
    console.error('❌ Could not load subscribers:', err.message);
    return;
  }

  // Group by city so we call the weather API once per city, not once per person
  const byCity = {};
  for (const sub of subscribers) {
    (byCity[sub.city] ||= []).push(sub);
  }

  for (const [city, subs] of Object.entries(byCity)) {
    try {
      const weatherData = await getWeatherForCity(city);
           for (const sub of subs) {
        // TEMPORARY TEST OVERRIDE — remove after confirming SMS works
        const alerts = generateAlerts(weatherData, sub.persona).filter(isWorthTexting); if (alerts.length === 0) continue;

        const top = alerts[0];
        const message = `MAUSAM AI Alert (${city}): ${top.title.replace(/[^\w\s]/gi, '').trim()} - ${top.message}`;

        await sendSMS(sub.phone, message);
        sub.lastAlertSentAt = new Date();
        await sub.save();
      }
    } catch (err) {
      console.error(`❌ Failed processing alerts for ${city}:`, err.message);
    }
  }
}

function startAlertScheduler() {
  cron.schedule('*/30 * * * *', checkAndNotify); // every 30 min — tune for your demo
  console.log('⏰ SMS alert scheduler started (every 30 minutes)');
}

module.exports = { startAlertScheduler, checkAndNotify };