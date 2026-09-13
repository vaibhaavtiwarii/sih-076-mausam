// backend/models/Subscriber.js
const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, unique: true, trim: true }, // E.164 format: +91XXXXXXXXXX
  city: { type: String, required: true, trim: true },
  persona: { type: String, default: 'Fitness' },
  language: { type: String, default: 'en' },
  active: { type: Boolean, default: true },
  lastAlertSentAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);