// backend/services/weatherService.js
const axios = require('axios');

// Open-Meteo Geocoding API
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await axios.get(url);
  if (!response.data.results || response.data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }
  const result = response.data.results[0];
  return {
    name: result.name,
    country: result.country,
    admin1: result.admin1, // state/province
    latitude: result.latitude,
    longitude: result.longitude
  };
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
  const response = await axios.get(url);
  const data = response.data;

  const current = data.current_weather;
  const hourly = data.hourly;

  // Build hourly forecast array (next 24 hours)
  const hourlyForecast = [];
  const now = new Date();
  const currentHour = now.getHours();

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
    humidity: current.relativehumidity || 0, // might be undefined in current_weather, fallback
    wind: Math.round(current.windspeed),
    uv: Math.round(current.uv_index || 0),
    rain: 0, // current rain probability isn't directly provided, we can use the first hourly value
    hourly: hourlyForecast
  };
}

// Main function to get weather for a city
async function getWeatherForCity(city) {
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
  return weatherData;
}

module.exports = {
  getWeatherForCity,
  geocodeCity,
  fetchWeather
};