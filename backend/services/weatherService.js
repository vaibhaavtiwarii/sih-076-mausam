// backend/services/weatherService.js
const axios = require('axios');

// ---------------------------------------------------------------------------
// NOTE ON PROVIDER: This now uses WeatherAPI.com instead of Open-Meteo.
//
// Why: Open-Meteo's free tier requires no key, but is rate-limited PER IP
// ADDRESS (not per app) - 600/min, 5,000/hour, 10,000/day. Render's free
// hosting tier shares outbound IPs across many unrelated apps, so other
// people's traffic on the same IP was exhausting our quota too, which is
// what caused the repeated 429 errors. Open-Meteo does not offer a free
// per-account API key for non-commercial use (their "API key" tier is a
// paid commercial subscription).
//
// WeatherAPI.com's free tier (https://www.weatherapi.com/pricing.aspx) gives
// 100,000 calls/month tied to YOUR OWN account/key, so it's no longer
// affected by what anyone else on Render's shared IP is doing. It also
// returns geocoding + current + hourly forecast in a SINGLE call (Open-Meteo
// needed two calls: one to geocode, one for weather), which further cuts
// our request volume in half.
//
// We still cache + de-dupe concurrent requests on top of this, both to stay
// well under the generous free quota and to keep the app fast.
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

// Map a WeatherAPI hourly entry into our app's internal shape
function mapHour(h) {
  return {
    time: h.time.replace(' ', 'T'),
    temperature: Math.round(h.temp_c),
    apparentTemperature: Math.round(h.feelslike_c),
    humidity: h.humidity,
    rain: h.chance_of_rain,
    wind: Math.round(h.wind_kph),
    uv: Math.round((h.uv || 0) * 10) / 10,
    weatherCode: h.condition?.code,
    condition: h.condition?.text || 'Unknown'
  };
}

// Fetch geocode + current + hourly forecast for a city in ONE call, then
// build the same clean shape the rest of the app already expects.
async function fetchFromWeatherApi(city) {
  if (!WEATHERAPI_KEY) {
    throw new Error(
      'WEATHERAPI_KEY is not set. Add it to your backend .env file (and to your Render environment variables).'
    );
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(city)}&days=2&aqi=no&alerts=no`;
  const response = await getWithRetry(url);
  const data = response.data;

  if (!data.location) {
    throw new Error(`City not found: ${city}`);
  }

  // Combine today + tomorrow's hourly arrays, then slice the next 24 hours
  // starting from the current hour, so the forecast is always "from now",
  // not just "today from midnight".
  const days = data.forecast?.forecastday || [];
  const allHours = days.flatMap(d => d.hour || []);

  const currentTime = data.current.time; // e.g. "2026-09-06 18:45"
  const currentHourStr = `${currentTime.slice(0, 13)}:00`; // "2026-09-06 18:00"
  let startIndex = allHours.findIndex(h => h.time === currentHourStr);
  if (startIndex === -1) startIndex = 0;

  const next24 = allHours.slice(startIndex, startIndex + 24).map(mapHour);

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
    rain: next24.length > 0 ? next24[0].rain : 0,
    hourly: next24
  };

  return weatherData;
}

// Main function to get weather for a city (cached + de-duped).
// This is the function every route calls, so caching it here means
// weather/recommend/alerts (which all call this) automatically share
// one cached/coalesced result instead of hitting the API multiple times
// per page load.
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
