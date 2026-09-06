// backend/services/weatherService.js
const axios = require('axios');

// ---------------------------------------------------------------------------
// Why this file changed:
// The frontend loads 3 things in parallel for every page view (weather,
// recommendation, alerts). Each of those hits this service, and each call
// used to independently geocode the city AND fetch the forecast from
// Open-Meteo — so ONE page load fired 6 outbound requests. Open-Meteo's free
// tier rate-limits by IP, and hosting platforms (Render/Vercel) often share
// IPs across many apps, so it doesn't take much to get a 429.
//
// Fix: (1) cache results for a short time so repeat lookups of the same city
// don't hit the API again, (2) "coalesce" simultaneous requests for the same
// city into a single outbound call instead of 3, and (3) retry automatically
// (with backoff) if Open-Meteo returns a 429/503, instead of immediately
// failing the whole page.
// ---------------------------------------------------------------------------

const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // geocoding rarely changes - cache 6h
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;   // weather changes - cache 10m

const geoCache = new Map();        // key -> { data, expiresAt }
const weatherCache = new Map();    // key -> { data, expiresAt }
const inFlightGeo = new Map();     // key -> Promise (de-dupe concurrent requests)
const inFlightWeather = new Map(); // key -> Promise

function cacheKey(str) {
  return str.trim().toLowerCase();
}

function getFromCache(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(cache, key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// GET with automatic retry/backoff on 429 (rate limited) and 503 (overloaded).
// Respects a Retry-After header if the API sends one.
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
      const backoffMs = retryAfterMs || 500 * Math.pow(2, attempt); // 500ms, 1s, 2s...
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

// Open-Meteo Geocoding API (cached + de-duped)
async function geocodeCity(city) {
  const key = cacheKey(city);

  const cached = getFromCache(geoCache, key);
  if (cached) return cached;

  if (inFlightGeo.has(key)) {
    return inFlightGeo.get(key);
  }

  const promise = (async () => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const response = await getWithRetry(url);
    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`City not found: ${city}`);
    }
    const result = response.data.results[0];
    const location = {
      name: result.name,
      country: result.country,
      admin1: result.admin1, // state/province
      latitude: result.latitude,
      longitude: result.longitude
    };
    setCache(geoCache, key, location, GEO_CACHE_TTL_MS);
    return location;
  })();

  inFlightGeo.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightGeo.delete(key);
  }
}

// Map WMO weather codes to human-readable conditions
function mapWeatherCode(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown';
}

// Fetch current weather and 24-hour forecast from Open-Meteo
async function fetchWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m,uv_index&timezone=auto&forecast_days=1`;
  const response = await getWithRetry(url);
  const data = response.data;

  const current = data.current_weather;
  const hourly = data.hourly;

  // current_weather has no humidity or uv_index field — find the hourly
  // index matching the current timestamp and read those values from there.
  let currentHourIndex = hourly.time.findIndex(t => t === current.time);
  if (currentHourIndex === -1) currentHourIndex = 0;
  const currentHumidity = hourly.relativehumidity_2m[currentHourIndex] ?? 0;

  // Build hourly forecast array (next 24 hours)
  const hourlyForecast = [];

  for (let i = 0; i < 24; i++) {
    const time = new Date(hourly.time[i]);
    hourlyForecast.push({
      time: time.toISOString(),
      temperature: Math.round(hourly.temperature_2m[i]),
      apparentTemperature: Math.round(hourly.apparent_temperature[i]),
      humidity: hourly.relativehumidity_2m[i],
      rain: hourly.precipitation_probability[i],
      wind: Math.round(hourly.windspeed_10m[i]),
      uv: Math.round(hourly.uv_index[i] * 10) / 10,
      weatherCode: hourly.weathercode[i],
      condition: mapWeatherCode(hourly.weathercode[i])
    });
  }

  // Build the clean MAUSAM format
  return {
    location: null, // will be filled by the caller
    latitude: latitude,
    longitude: longitude,
    temperature: Math.round(current.temperature),
    condition: mapWeatherCode(current.weathercode),
    feelsLike: Math.round(current.apparent_temperature || current.temperature),
    humidity: currentHumidity,
    wind: Math.round(current.windspeed),
    uv: Math.round((hourly.uv_index[currentHourIndex] || 0) * 10) / 10,
    rain: 0, // current rain probability isn't directly provided, we can use the first hourly value
    hourly: hourlyForecast
  };
}

// Main function to get weather for a city (cached + de-duped).
// This is the function every route calls, so caching it here means
// weather/recommend/alerts (which all call this) automatically share
// one cached/coalesced result instead of hitting Open-Meteo 3x per page load.
async function getWeatherForCity(city) {
  const key = cacheKey(city);

  const cached = getFromCache(weatherCache, key);
  if (cached) return cached;

  if (inFlightWeather.has(key)) {
    return inFlightWeather.get(key);
  }

  const promise = (async () => {
    const location = await geocodeCity(city);
    const weatherData = await fetchWeather(location.latitude, location.longitude);
    // Attach location string
    let locationString = location.name;
    if (location.admin1) locationString += `, ${location.admin1}`;
    if (location.country) locationString += `, ${location.country}`;
    weatherData.location = locationString;
    // Add rain probability from first hourly entry
    if (weatherData.hourly && weatherData.hourly.length > 0) {
      weatherData.rain = weatherData.hourly[0].rain || 0;
    }
    setCache(weatherCache, key, weatherData, WEATHER_CACHE_TTL_MS);
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
  getWeatherForCity,
  geocodeCity,
  fetchWeather
};
