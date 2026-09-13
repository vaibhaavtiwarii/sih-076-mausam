// backend/services/smsService.js
const axios = require('axios');

async function sendSMS(toPhone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  Fast2SMS not configured — skipping send. Would have sent:', message);
    return { skipped: true };
  }

  // Fast2SMS expects a bare 10-digit Indian number — strip +91 and any non-digits
  const numbers = toPhone.replace('+91', '').replace(/\D/g, '');

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to send SMS to ${toPhone}:`, err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendSMS };