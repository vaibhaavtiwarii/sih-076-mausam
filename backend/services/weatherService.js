// backend/services/weatherService.js
const axios = require('axios');

// ---------------------------------------------------------------------------
// Uses WeatherAPI.com (see WEATHERAPI_KEY in .env). Free tier: 100,000
// calls/month tied to your own key - not shared with strangers on the same
// hosting IP like Open-Meteo's free tier was.
//
// This file now also pulls: air quality (AQI), astronomy (sunrise/sunset),
// visibility, and a 3-day daily forecast - all included free with the same
// single API call - to power the persona-specific dashboard panels.
// ---------------------------------------------------------------------------

const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const weatherCache = new Map();    // key -> { data, expiresAt }
const inFlightWeather = new Map(); // key -> Promise (de-dupe concurrent requests)

function cacheKey(str) {
  return str.trim().toLowerCase();
}

function getFromCache(key) {
  const entry = weatherCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    weatherCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  weatherCache.set(key, { data, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
}

// GET with automatic retry/backoff on 429 (rate limited) and 503 (overloaded).
async function getWithRetry(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, { timeout: 10000 });
    } catch (error) {
      const status = error.response?.status;
      const isRetryable = status === 429 || status === 503;
      const isLastAttempt = attempt === retries;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      const backoffMs = retryAfterMs || 500 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

function mapHour(h) {
  return {
    time: h.time.replace(' ', 'T'),
    temperature: Math.round(h.temp_c),
    apparentTemperature: Math.round(h.feelslike_c),
    humidity: h.humidity,
    rain: h.chance_of_rain,
    wind: Math.round(h.wind_kph),
    uv: Math.round((h.uv || 0) * 10) / 10,
    visibility: h.vis_km,
    weatherCode: h.condition?.code,
    condition: h.condition?.text || 'Unknown'
  };
}

// US-EPA air quality index (1-6) -> human-readable category
function epaCategory(index) {
  const map = {
    1: 'Good',
    2: 'Moderate',
    3: 'Unhealthy for Sensitive Groups',
    4: 'Unhealthy',
    5: 'Very Unhealthy',
    6: 'Hazardous'
  };
  return map[index] || 'Unknown';
}

async function fetchFromWeatherApi(city) {
  if (!WEATHERAPI_KEY) {
    throw new Error(
      'WEATHERAPI_KEY is not set. Add it to your backend .env file (and to your Render environment variables).'
    );
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=yes&alerts=no`;
  const response = await getWithRetry(url);
  const data = response.data;

  if (!data.location) {
    throw new Error(`City not found: ${city}`);
  }

  const days = data.forecast?.forecastday || [];
  const allHours = days.flatMap(d => d.hour || []);

  const currentTime = data.current.last_updated; // e.g. "2026-09-06 18:45"
  const currentHourStr = `${currentTime.slice(0, 13)}:00`;
  let startIndex = allHours.findIndex(h => h.time === currentHourStr);
  if (startIndex === -1) startIndex = 0;

  const next24 = allHours.slice(startIndex, startIndex + 24).map(mapHour);

  // 3-day daily summary (for Event Planners, Agriculture frost/rainfall, etc.)
  const daily = days.map(d => ({
    date: d.date,
    maxTemp: Math.round(d.day.maxtemp_c),
    minTemp: Math.round(d.day.mintemp_c),
    avgHumidity: Math.round(d.day.avghumidity),
    totalPrecipMm: d.day.totalprecip_mm,
    chanceOfRain: d.day.daily_chance_of_rain,
    condition: d.day.condition?.text || 'Unknown',
    uv: d.day.uv,
    sunrise: d.astro?.sunrise,
    sunset: d.astro?.sunset
  }));

  // Air quality (WeatherAPI free tier includes a limited version of this)
  let airQuality = null;
  const aq = data.current.air_quality;
  if (aq) {
    const epaIndex = aq['us-epa-index'];
    airQuality = {
      index: epaIndex,
      category: epaCategory(epaIndex),
      pm2_5: aq.pm2_5 != null ? Math.round(aq.pm2_5) : null,
      pm10: aq.pm10 != null ? Math.round(aq.pm10) : null
    };
  }

  let locationString = data.location.name;
  if (data.location.region && data.location.region !== data.location.name) {
    locationString += `, ${data.location.region}`;
  }
  if (data.location.country) locationString += `, ${data.location.country}`;

  const weatherData = {
    location: locationString,
    latitude: data.location.lat,
    longitude: data.location.lon,
    temperature: Math.round(data.current.temp_c),
    condition: data.current.condition?.text || 'Unknown',
    feelsLike: Math.round(data.current.feelslike_c),
    humidity: data.current.humidity,
    wind: Math.round(data.current.wind_kph),
    uv: Math.round((data.current.uv || 0) * 10) / 10,
    visibility: data.current.vis_km,
    rain: next24.length > 0 ? next24[0].rain : 0,
    sunrise: daily[0]?.sunrise || null,
    sunset: daily[0]?.sunset || null,
    airQuality,
    daily,
    hourly: next24
  };

  return weatherData;
}

async function getWeatherForCity(city) {
  const key = cacheKey(city);

  const cached = getFromCache(key);
  if (cached) return cached;

  if (inFlightWeather.has(key)) {
    return inFlightWeather.get(key);
  }

  const promise = (async () => {
    const weatherData = await fetchFromWeatherApi(city);
    setCache(key, weatherData);
    return weatherData;
  })();

  inFlightWeather.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightWeather.delete(key);
  }
}

module.exports = {
  getWeatherForCity
};
