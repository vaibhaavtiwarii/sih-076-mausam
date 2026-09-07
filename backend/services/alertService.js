// backend/services/alertService.js

function generateAlerts(weatherData, persona) {
  const alerts = [];
  const hourly = weatherData.hourly;

  // Check the next 6 hours for potential impact
  for (let i = 0; i < 6; i++) {
    const hour = hourly[i];
    if (!hour) break;

    const time = new Date(hour.time);
    const hourStr = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    // Commuter alert: rain > 50%
    if (persona === 'Commuter' && hour.rain > 50) {
      alerts.push({
        id: `alert-commute-${i}`,
        title: '🚗 Commute at Risk',
        message: `Heavy rain (${hour.rain}%) expected around ${hourStr}. Allow extra travel time.`,
        priority: 'High',
        time: hour.time
      });
      break;
    }

    // Commuter fog/visibility alert
    if (persona === 'Commuter' && hour.condition && /fog|mist/i.test(hour.condition)) {
      alerts.push({
        id: `alert-fog-${i}`,
        title: '🌫️ Low Visibility Warning',
        message: `${hour.condition} expected around ${hourStr}${hour.visibility != null ? ` (visibility ~${hour.visibility} km)` : ''}. Drive carefully.`,
        priority: 'Medium',
        time: hour.time
      });
      break;
    }

    // Outdoor-plan personas: rain > 60%
    if (['Fitness', 'Family', 'Event Planner', 'Traveler'].includes(persona) && hour.rain > 60) {
      alerts.push({
        id: `alert-outdoor-${i}`,
        title: `☔ Plans May Be Affected`,
        message: `Rain expected (${hour.rain}%) around ${hourStr}. Consider rescheduling outdoor plans.`,
        priority: 'Medium',
        time: hour.time
      });
      break;
    }

    // Heat alert: Wellness / Fitness personas
    if (['Wellness', 'Fitness'].includes(persona) && hour.temperature >= 38) {
      alerts.push({
        id: `alert-heat-${i}`,
        title: '🥵 Heat Alert',
        message: `Temperatures reaching ${hour.temperature}°C around ${hourStr}. Stay hydrated and avoid peak sun hours.`,
        priority: 'High',
        time: hour.time
      });
      break;
    }

    // General severe weather: thunderstorm (checked by condition text so it
    // works no matter which weather provider is behind getWeatherForCity)
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

  // Frost alert for Agriculture (looks at the 3-day daily forecast, not hourly)
  if (persona === 'Agriculture' && weatherData.daily) {
    const frostDay = weatherData.daily.find(d => d.minTemp <= 4);
    if (frostDay) {
      alerts.push({
        id: 'alert-frost',
        title: '❄️ Frost Risk',
        message: `Minimum temperature of ${frostDay.minTemp}°C expected on ${frostDay.date}. Protect sensitive crops.`,
        priority: frostDay.minTemp <= 2 ? 'High' : 'Medium',
        time: frostDay.date
      });
    }
  }

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
