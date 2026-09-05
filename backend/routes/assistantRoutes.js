// backend/routes/assistantRoutes.js
const express = require('express');
const { getWeatherForCity } = require('../services/weatherService');
const { getRecommendation } = require('../services/recommendationService');

const router = express.Router();

// Simple deterministic response generator
function generateAssistantResponse(question, weatherData, activity, persona) {
  const lower = question.toLowerCase();
  const recommendation = getRecommendation(weatherData, activity || 'Running', persona || 'Fitness');

  // Check for specific time mentions
  const timeMatch = question.match(/(\d{1,2})\s*(am|pm)/i);
  let specificHour = null;
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const meridiem = timeMatch[2].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    specificHour = hour;
  }

  if (lower.includes('running') || lower.includes('run')) {
    if (specificHour !== null) {
      // Check that specific hour in weather data
      const targetHour = weatherData.hourly.find(h => new Date(h.time).getHours() === specificHour);
      if (targetHour) {
        if (targetHour.rain > 60) {
          return `I see you want to run at ${timeMatch[0]}. Rain probability is ${targetHour.rain}% at that time. ${recommendation.bestWindow} is a better window with lower rain risk.`;
        } else if (targetHour.uv > 6) {
          return `At ${timeMatch[0]}, UV index is ${targetHour.uv}. That's quite high. Consider running during ${recommendation.bestWindow} when UV is lower.`;
        } else {
          return `At ${timeMatch[0]}, conditions look decent (temp: ${targetHour.temperature}°C, rain: ${targetHour.rain}%). However, the optimal window is ${recommendation.bestWindow} with a score of ${recommendation.score}/100.`;
        }
      }
    }
    return `Based on today's forecast, the best time to run is ${recommendation.bestWindow} (score: ${recommendation.score}/100). ${recommendation.reasons.join(' ')}`;
  }

  if (lower.includes('event') || lower.includes('outdoor')) {
    if (weatherData.rain > 50) {
      return `Your outdoor event may be affected. Rain probability is ${weatherData.rain}%. I'll alert you if plans need to change. The best window today is ${recommendation.bestWindow}.`;
    }
    return `Weather looks favorable for your event. Temperature: ${weatherData.temperature}°C, rain: ${weatherData.rain}%. Enjoy!`;
  }

  if (lower.includes('commute') || lower.includes('travel')) {
    if (weatherData.rain > 60) {
      return `Heavy rain (${weatherData.rain}%) may affect your commute. Allow extra travel time and carry an umbrella.`;
    }
    return `Your commute looks clear. No significant weather disruptions expected.`;
  }

  if (lower.includes('prepare') || lower.includes('tomorrow')) {
    const tomorrow = weatherData.hourly.slice(12, 24);
    const avgRain = tomorrow.reduce((sum, h) => sum + h.rain, 0) / tomorrow.length;
    if (avgRain > 50) {
      return `For tomorrow, carry an umbrella. Rain is likely throughout the day (avg ${Math.round(avgRain)}% probability).`;
    }
    return `Tomorrow looks pleasant. Temperatures around ${Math.round(tomorrow.reduce((s,h) => s + h.temperature, 0)/tomorrow.length)}°C. No major rain expected.`;
  }

  // Default fallback using recommendation
  return `I'm here to help with your weather decisions. ${recommendation.bestWindow} is a great window for ${activity} (score: ${recommendation.score}/100). ${recommendation.reasons.join(' ')} Ask me about running, events, or commuting!`;
}

router.post('/', async (req, res) => {
  try {
    const { question, city, activity, persona } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const location = city || 'Bareilly';
    const weatherData = await getWeatherForCity(location);
    const response = generateAssistantResponse(question, weatherData, activity, persona);

    res.json({
      question: question,
      response: response,
      mode: 'Demo Reasoning Mode (deterministic)',
      location: weatherData.location
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;