// backend/services/alertService.js

function generateAlerts(weatherData, activity, persona) {
  const alerts = [];
  const hourly = weatherData.hourly;

  // Check the next 6 hours for potential impact
  for (let i = 0; i < 6; i++) {
    const hour = hourly[i];
    if (!hour) break;

    const time = new Date(hour.time);
    const hourStr = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    // Commute alert: rain > 50% or storm
    if (activity === 'Commute' && hour.rain > 50) {
      alerts.push({
        id: `alert-commute-${i}`,
        title: '🚗 Commute at Risk',
        message: `Heavy rain (${hour.rain}%) expected during your commute around ${hourStr}.`,
        priority: 'High',
        time: hour.time
      });
      break; // One commute alert is enough
    }

    // Running/Outdoor alert: rain > 60% or high UV
    if ((activity === 'Running' || activity === 'Outdoor Event') && hour.rain > 60) {
      alerts.push({
        id: `alert-outdoor-${i}`,
        title: `🏃 ${activity} Affected`,
        message: `Rain expected (${hour.rain}%) around ${hourStr}. Consider rescheduling.`,
        priority: 'Medium',
        time: hour.time
      });
      break;
    }

    // General severe weather: thunderstorm or high wind
    // (checked by condition text rather than a numeric code, so this keeps
    // working no matter which weather provider is behind getWeatherForCity)
    if (hour.condition && /thunder/i.test(hour.condition)) {
      alerts.push({
        id: `alert-storm-${i}`,
        title: '⛈️ Severe Weather Warning',
        message: `Thunderstorm expected around ${hourStr}. Stay safe indoors.`,
        priority: 'High',
        time: hour.time
      });
      break;
    }
  }

  // If no alerts found, add a "safe" alert
  if (alerts.length === 0) {
    alerts.push({
      id: 'alert-safe',
      title: '✅ No Significant Weather Impact',
      message: 'Your plans are unlikely to be affected by weather in the next 6 hours.',
      priority: 'Low',
      time: new Date().toISOString()
    });
  }

  return alerts;
}

module.exports = {
  generateAlerts
};