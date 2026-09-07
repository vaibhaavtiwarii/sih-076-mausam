// backend/services/personaInsightsService.js
//
// Builds the persona-specific panel shown on the dashboard. Most of this
// comes straight from the WeatherAPI data we already fetched (see
// weatherService.js). Two personas need one extra, free, keyless call to
// Open-Meteo (which has no daily/rate-limit issues for this low a volume):
//   - Surfer: wave height/period + sea temperature (Open-Meteo Marine API)
//   - Agriculture: soil moisture (Open-Meteo Forecast API)

const axios = require('axios');
const { findBestWindow } = require('./recommendationService');

const EXTRA_CACHE_TTL_MS = 15 * 60 * 1000;
const extraCache = new Map();

function cacheKey(prefix, lat, lon) {
  return `${prefix}:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function getCached(key) {
  const entry = extraCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    extraCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  extraCache.set(key, { data, expiresAt: Date.now() + EXTRA_CACHE_TTL_MS });
}

// ---- Surfer: marine data (wave height, wave period, sea temperature) ----
async function getMarineData(lat, lon) {
  const key = cacheKey('marine', lat, lon);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_period,sea_surface_temperature&timezone=auto&forecast_days=1`;
    const response = await axios.get(url, { timeout: 10000 });
    const hourly = response.data.hourly;

    if (!hourly || !hourly.wave_height || hourly.wave_height[0] == null) {
      // Open-Meteo returns nulls for inland coordinates - no marine data here
      const result = { available: false };
      setCached(key, result);
      return result;
    }

    const result = {
      available: true,
      waveHeight: hourly.wave_height[0],
      wavePeriod: hourly.wave_period[0],
      seaTemp: hourly.sea_surface_temperature[0]
    };
    setCached(key, result);
    return result;
  } catch (err) {
    return { available: false };
  }
}

function surfRating(waveHeight) {
  if (waveHeight < 0.5) return { level: 'Flat', note: 'Too small to surf.' };
  if (waveHeight < 1) return { level: 'Small', note: 'Okay for beginners.' };
  if (waveHeight < 2) return { level: 'Good', note: 'Solid conditions for most surfers.' };
  if (waveHeight < 3) return { level: 'Strong', note: 'Best for experienced surfers.' };
  return { level: 'Extreme', note: 'Dangerous - experts only, or stay out.' };
}

// ---- Agriculture: soil moisture ----
async function getSoilData(lat, lon) {
  const key = cacheKey('soil', lat, lon);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=soil_moisture_0_to_1cm&timezone=auto&forecast_days=1`;
    const response = await axios.get(url, { timeout: 10000 });
    const value = response.data.hourly?.soil_moisture_0_to_1cm?.[0];

    if (value == null) {
      const result = { available: false };
      setCached(key, result);
      return result;
    }

    let note;
    if (value < 0.15) note = 'Dry - irrigation likely needed soon.';
    else if (value < 0.30) note = 'Moderate moisture levels.';
    else note = 'Well saturated.';

    const result = { available: true, value: Math.round(value * 1000) / 1000, note };
    setCached(key, result);
    return result;
  } catch (err) {
    return { available: false };
  }
}

// ---- Small rule-based helpers (no external API needed) ----

function pollenEstimate(weatherData) {
  // No reliable free pollen source covers India, so this is a rough,
  // clearly-labeled estimate from humidity + wind, not real sensor data.
  const { humidity, wind } = weatherData;
  let level = 'Moderate';
  if (humidity < 40 && wind > 10) level = 'High';
  else if (humidity > 70) level = 'Low';
  return { level, note: 'Estimated from humidity/wind - not a direct pollen measurement.' };
}

function packingList(weatherData) {
  const items = [];
  const maxTemp = Math.max(...weatherData.daily.map(d => d.maxTemp));
  const minTemp = Math.min(...weatherData.daily.map(d => d.minTemp));
  const willRain = weatherData.daily.some(d => d.chanceOfRain > 40);
  const maxUv = Math.max(...weatherData.daily.map(d => d.uv || 0));

  if (maxTemp >= 30) items.push('Light, breathable clothing');
  if (minTemp <= 15) items.push('A warm layer/jacket for cooler hours');
  if (willRain) items.push('Umbrella or rain jacket');
  if (maxUv >= 6) items.push('Sunscreen and sunglasses');
  if (weatherData.humidity >= 70) items.push('Moisture-wicking fabrics');
  items.push('Comfortable walking shoes');
  return items;
}

function schoolWindowInsight(weatherData, startHour, endHour) {
  const hours = weatherData.hourly.filter(h => {
    const hr = new Date(h.time).getHours();
    return hr >= startHour && hr < endHour;
  });
  if (hours.length === 0) return { condition: 'No data', advice: '' };

  const maxRain = Math.max(...hours.map(h => h.rain));
  const condition = hours[0].condition;

  let advice = 'Should be a clear commute.';
  if (maxRain > 60) advice = 'High chance of rain - send an umbrella / raincoat.';
  else if (maxRain > 30) advice = 'Some chance of rain - pack a light rain cover just in case.';

  return { condition, maxRain, advice };
}

function plantingTip() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) {
    return 'Kharif season (Jun–Sep): good window for rice, maize, cotton and pulses, provided monsoon rainfall is on track.';
  }
  if (month >= 10 && month <= 12 || month === 1) {
    return 'Rabi season (Oct–Mar): good window for wheat, mustard, gram and barley.';
  }
  return 'Zaid season (Mar–Jun): consider short-duration crops like watermelon, cucumber and moong, with irrigation support.';
}

function lightningRisk(weatherData) {
  const daysWithThunder = weatherData.daily.filter(d => /thunder/i.test(d.condition));
  const hoursWithThunder = weatherData.hourly.filter(h => /thunder/i.test(h.condition));
  if (hoursWithThunder.length > 0 || daysWithThunder.length > 1) {
    return { level: 'High', note: 'Thunderstorms forecast - have an indoor backup plan ready.' };
  }
  if (daysWithThunder.length === 1) {
    return { level: 'Moderate', note: 'Isolated thunderstorm risk on one of the next 3 days.' };
  }
  return { level: 'Low', note: 'No thunderstorm activity currently forecast.' };
}

function peakHeatHour(weatherData) {
  if (!weatherData.hourly.length) return null;
  const peak = weatherData.hourly.reduce((max, h) => (h.temperature > max.temperature ? h : max), weatherData.hourly[0]);
  return { time: peak.time, temperature: peak.temperature };
}

// ---- Main entry point ----
async function buildPersonaInsights(weatherData, persona) {
  switch (persona) {
    case 'Wellness': {
      return {
        persona,
        airQuality: weatherData.airQuality,
        uv: weatherData.uv,
        uvAdvice: weatherData.uv >= 6 ? 'High UV - wear sunscreen and limit midday sun exposure.' : 'UV levels are manageable today.',
        humidity: weatherData.humidity,
        humidityAdvice: weatherData.humidity >= 70
          ? 'High humidity - may aggravate asthma or trigger skin irritation for sensitive users.'
          : weatherData.humidity <= 30
            ? 'Low humidity - may cause dry skin/airways, consider a moisturizer or humidifier.'
            : 'Humidity is in a comfortable range.',
        pollen: pollenEstimate(weatherData)
      };
    }

    case 'Fitness': {
      const bestWindow = findBestWindow(weatherData.hourly, 'Fitness');
      const heatHour = weatherData.hourly.slice(0, 12).find(h => h.temperature >= 35);
      return {
        persona,
        sunrise: weatherData.sunrise,
        sunset: weatherData.sunset,
        bestWindow,
        heatAlert: heatHour
          ? `Temperatures reaching ${heatHour.temperature}°C - avoid intense exercise during peak heat.`
          : null
      };
    }

    case 'Surfer': {
      const marine = await getMarineData(weatherData.latitude, weatherData.longitude);
      if (!marine.available) {
        return {
          persona,
          available: false,
          note: 'No marine/wave data available for this location - it may not be a coastal spot.'
        };
      }
      return {
        persona,
        available: true,
        waveHeight: marine.waveHeight,
        wavePeriod: marine.wavePeriod,
        seaTemp: marine.seaTemp,
        rating: surfRating(marine.waveHeight),
        note: 'Live tide times aren\u2019t available on our current free data plan - wave height/period are shown instead.'
      };
    }

    case 'Traveler': {
      const willRain = weatherData.daily.some(d => d.chanceOfRain > 50);
      const foggyOrStormy = weatherData.hourly.slice(0, 24).some(h => /fog|thunder|storm/i.test(h.condition));
      return {
        persona,
        packingList: packingList(weatherData),
        destinationRisk: foggyOrStormy
          ? 'Fog/storm conditions possible in the next 24h - check for flight delays before heading to the airport.'
          : willRain
            ? 'Rain likely at some point in the next 3 days - keep plans flexible.'
            : null
      };
    }

    case 'Family': {
      const morning = schoolWindowInsight(weatherData, 7, 9);
      const afternoon = schoolWindowInsight(weatherData, 15, 17);
      const rainAlert = weatherData.daily[0]?.chanceOfRain > 60
        ? `High chance of rain today (${weatherData.daily[0].chanceOfRain}%) - plan indoor activities.`
        : null;
      return {
        persona,
        schoolMorning: morning,
        schoolAfternoon: afternoon,
        rainAlert,
        activityTip: weatherData.daily[0]?.maxTemp >= 35
          ? 'Very hot today - keep outdoor playtime short and hydrate often.'
          : 'Good day for outdoor family activities if rain holds off.'
      };
    }

    case 'Agriculture': {
      const soil = await getSoilData(weatherData.latitude, weatherData.longitude);
      const frostDay = weatherData.daily.find(d => d.minTemp <= 4);
      const totalRain3Day = weatherData.daily.reduce((sum, d) => sum + (d.totalPrecipMm || 0), 0);
      return {
        persona,
        frost: frostDay
          ? { risk: true, minTemp: frostDay.minTemp, date: frostDay.date }
          : { risk: false },
        rainfall3Day: {
          totalMm: Math.round(totalRain3Day * 10) / 10,
          chanceOfRain: Math.max(...weatherData.daily.map(d => d.chanceOfRain))
        },
        soilMoisture: soil.available ? soil : null,
        plantingTip: plantingTip()
      };
    }

    case 'Commuter': {
      const fogSoon = weatherData.hourly.slice(0, 6).find(h => /fog|mist/i.test(h.condition));
      const stormSoon = weatherData.hourly.slice(0, 6).find(h => /thunder|storm/i.test(h.condition));
      return {
        persona,
        visibility: weatherData.visibility,
        visibilityAdvice: weatherData.visibility != null && weatherData.visibility < 4
          ? 'Reduced visibility - drive with caution and use fog lights if needed.'
          : 'Visibility is good.',
        fogAlert: fogSoon ? `${fogSoon.condition} expected soon - allow extra travel time.` : null,
        stormAlert: stormSoon ? `${stormSoon.condition} expected soon - watch for waterlogging/delays.` : null,
        trafficNote: 'Live traffic data isn\u2019t included yet - treat rain/fog windows above as extra-delay risk.'
      };
    }

    case 'Event Planner': {
      return {
        persona,
        threeDayForecast: weatherData.daily,
        peakHeatHour: peakHeatHour(weatherData),
        lightningRisk: lightningRisk(weatherData)
      };
    }

    default:
      return { persona, note: 'No specific insights configured for this persona yet.' };
  }
}

module.exports = {
  buildPersonaInsights
};
