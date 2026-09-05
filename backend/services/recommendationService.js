// backend/services/recommendationService.js

// Configuration for each activity
const ACTIVITY_WEIGHTS = {
  Running: {
    temperature: { ideal: 18, range: 5, weight: 25 }, // 15-21°C ideal
    uv: { ideal: 0, max: 10, weight: 20 },
    rain: { ideal: 0, max: 100, weight: 25 },
    wind: { ideal: 5, max: 30, weight: 15 },
    humidity: { ideal: 50, max: 100, weight: 15 }
  },
  Cycling: {
    temperature: { ideal: 22, range: 8, weight: 20 },
    uv: { ideal: 0, max: 10, weight: 15 },
    rain: { ideal: 0, max: 100, weight: 30 },
    wind: { ideal: 8, max: 40, weight: 20 },
    humidity: { ideal: 55, max: 100, weight: 15 }
  },
  Commute: {
    temperature: { ideal: 25, range: 10, weight: 15 },
    uv: { ideal: 0, max: 10, weight: 10 },
    rain: { ideal: 0, max: 100, weight: 40 },
    wind: { ideal: 10, max: 50, weight: 20 },
    humidity: { ideal: 60, max: 100, weight: 15 }
  },
  'Outdoor Event': {
    temperature: { ideal: 24, range: 8, weight: 25 },
    uv: { ideal: 0, max: 10, weight: 15 },
    rain: { ideal: 0, max: 100, weight: 35 },
    wind: { ideal: 5, max: 35, weight: 15 },
    humidity: { ideal: 55, max: 100, weight: 10 }
  },
  Travel: {
    temperature: { ideal: 26, range: 12, weight: 15 },
    uv: { ideal: 0, max: 10, weight: 10 },
    rain: { ideal: 0, max: 100, weight: 40 },
    wind: { ideal: 10, max: 50, weight: 20 },
    humidity: { ideal: 60, max: 100, weight: 15 }
  },
  Farming: {
    temperature: { ideal: 28, range: 8, weight: 20 },
    uv: { ideal: 0, max: 10, weight: 10 },
    rain: { ideal: 30, max: 100, weight: 35 }, // Some rain is good for farming
    wind: { ideal: 5, max: 40, weight: 20 },
    humidity: { ideal: 65, max: 100, weight: 15 }
  }
};

// Score a single hour
function scoreHour(hour, activity) {
  const weights = ACTIVITY_WEIGHTS[activity];
  if (!weights) return { score: 50, factors: [] };

  const factors = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // Temperature
  const tempDiff = Math.abs(hour.temperature - weights.temperature.ideal);
  let tempScore = Math.max(0, 100 - (tempDiff / weights.temperature.range) * 50);
  tempScore = Math.min(100, tempScore);
  factors.push({
    factor: 'temperature',
    impact: tempScore > 60 ? 'positive' : 'negative',
    message: `Temperature is ${hour.temperature}°C. ${tempScore > 60 ? 'Good for activity.' : 'May feel uncomfortable.'}`
  });
  weightedScore += tempScore * weights.temperature.weight;
  totalWeight += weights.temperature.weight;

  // UV
  let uvScore = Math.max(0, 100 - (hour.uv / weights.uv.max) * 100);
  factors.push({
    factor: 'uv',
    impact: uvScore > 70 ? 'positive' : 'negative',
    message: `UV index is ${hour.uv}. ${uvScore > 70 ? 'Safe exposure.' : 'High UV, take precautions.'}`
  });
  weightedScore += uvScore * weights.uv.weight;
  totalWeight += weights.uv.weight;

  // Rain
  let rainScore = 0;
  if (activity === 'Farming') {
    // For farming, moderate rain is good
    const rainOptimal = weights.rain.ideal;
    const rainDiff = Math.abs(hour.rain - rainOptimal);
    rainScore = Math.max(0, 100 - (rainDiff / weights.rain.max) * 50);
  } else {
    rainScore = Math.max(0, 100 - hour.rain);
  }
  factors.push({
    factor: 'rain',
    impact: rainScore > 70 ? 'positive' : 'negative',
    message: `Rain probability is ${hour.rain}%. ${rainScore > 70 ? 'Low chance, good to go.' : 'High chance, plan accordingly.'}`
  });
  weightedScore += rainScore * weights.rain.weight;
  totalWeight += weights.rain.weight;

  // Wind
  const windDiff = Math.abs(hour.wind - weights.wind.ideal);
  let windScore = Math.max(0, 100 - (windDiff / weights.wind.max) * 50);
  windScore = Math.min(100, windScore);
  factors.push({
    factor: 'wind',
    impact: windScore > 60 ? 'positive' : 'negative',
    message: `Wind speed is ${hour.wind} km/h. ${windScore > 60 ? 'Comfortable.' : 'May be too windy.'}`
  });
  weightedScore += windScore * weights.wind.weight;
  totalWeight += weights.wind.weight;

  // Humidity
  const humidDiff = Math.abs(hour.humidity - weights.humidity.ideal);
  let humidScore = Math.max(0, 100 - (humidDiff / weights.humidity.max) * 50);
  humidScore = Math.min(100, humidScore);
  factors.push({
    factor: 'humidity',
    impact: humidScore > 60 ? 'positive' : 'negative',
    message: `Humidity is ${hour.humidity}%. ${humidScore > 60 ? 'Comfortable range.' : 'May feel sticky or dry.'}`
  });
  weightedScore += humidScore * weights.humidity.weight;
  totalWeight += weights.humidity.weight;

  const overallScore = Math.round(weightedScore / totalWeight);
  return { score: overallScore, factors };
}

// Find the best 75-minute window in the next 12 hours
function findBestWindow(hourlyData, activity) {
  const scored = hourlyData.slice(0, 12).map((hour, index) => {
    const result = scoreHour(hour, activity);
    return { ...hour, index, score: result.score, factors: result.factors };
  });

  // Find 3 consecutive hours with max average score
  let bestAvg = 0;
  let bestStart = 0;
  for (let i = 0; i <= scored.length - 3; i++) {
    const avg = (scored[i].score + scored[i + 1].score + scored[i + 2].score) / 3;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestStart = i;
    }
  }

  const windowHours = scored.slice(bestStart, bestStart + 3);
  const avgScore = Math.round(bestAvg);

  // Extract reasons from the first hour of the window
  const reasons = windowHours[0].factors
    .filter(f => f.impact === 'positive')
    .map(f => f.message);

  // Format time
  const startTime = new Date(windowHours[0].time);
  const endTime = new Date(windowHours[2].time);
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return {
    score: avgScore,
    bestWindow: `${formatTime(startTime)} – ${formatTime(endTime)}`,
    reasons: reasons.length > 0 ? reasons : ['Conditions are acceptable for this activity.'],
    detailedFactors: windowHours[0].factors
  };
}

function getRecommendation(weatherData, activity, persona) {
  // Persona slightly adjusts the activity, but we use activity as the primary driver.
  // For now, persona influences the tone of reasons, but we keep scoring based on activity.
  const result = findBestWindow(weatherData.hourly, activity);

  // Add a warning if the score is low
  let warnings = [];
  if (result.score < 50) {
    warnings.push('Conditions are not ideal for this activity.');
  }
  if (result.score < 30) {
    warnings.push('Strongly advise rescheduling this activity.');
  }

  return {
    activity: activity,
    persona: persona,
    score: result.score,
    bestWindow: result.bestWindow,
    reasons: result.reasons,
    warnings: warnings,
    detailedFactors: result.detailedFactors
  };
}

module.exports = {
  getRecommendation,
  scoreHour,
  findBestWindow
};