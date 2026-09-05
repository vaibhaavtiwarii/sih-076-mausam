const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

function getWeatherCondition(weatherCode) {
  if (weatherCode === 0) return "Clear Sky";
  if ([1, 2, 3].includes(weatherCode)) return "Partly Cloudy";
  if ([45, 48].includes(weatherCode)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(weatherCode)) return "Rain";
  if ([71, 73, 75, 77].includes(weatherCode)) return "Snow";
  if ([80, 81, 82].includes(weatherCode)) return "Rain Showers";
  if ([85, 86].includes(weatherCode)) return "Snow Showers";
  if ([95, 96, 99].includes(weatherCode)) return "Thunderstorm";

  return "Unknown";
}

async function getWeather(city) {
  // 1. Find the city's coordinates
  const locationResponse = await fetch(
    `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );

  if (!locationResponse.ok) {
    throw new Error("Unable to find the location");
  }

  const locationData = await locationResponse.json();

  if (!locationData.results || locationData.results.length === 0) {
    throw new Error(`Location not found: ${city}`);
  }

  const location = locationData.results[0];

  // 2. Get weather using the coordinates
  const weatherResponse = await fetch(
    `${WEATHER_URL}?latitude=${location.latitude}&longitude=${location.longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=uv_index_max` +
      `&timezone=auto`
  );

  if (!weatherResponse.ok) {
    throw new Error("Unable to fetch weather data");
  }

  const weatherData = await weatherResponse.json();

  const currentHour = new Date();
currentHour.setMinutes(0, 0, 0);

const currentHourIndex = weatherData.hourly.time.findIndex((time) => {
  return new Date(time).getTime() === currentHour.getTime();
});

const safeCurrentHourIndex = currentHourIndex >= 0 ? currentHourIndex : 0;

const hourlyForecast = weatherData.hourly.time
  .slice(safeCurrentHourIndex, safeCurrentHourIndex + 24)
  .map((time, index) => {
    const dataIndex = safeCurrentHourIndex + index;

    return {
      time,
      temperature: weatherData.hourly.temperature_2m[dataIndex],
      rain: weatherData.hourly.precipitation_probability[dataIndex],
      humidity: weatherData.hourly.relative_humidity_2m[dataIndex],
      wind: weatherData.hourly.wind_speed_10m[dataIndex],
      weatherCode: weatherData.hourly.weather_code[dataIndex],
    };
  });

  return {
    location: `${location.name}, ${location.admin1 || location.country}`,
    latitude: location.latitude,
    longitude: location.longitude,

    temperature: weatherData.current.temperature_2m,
    condition: getWeatherCondition(weatherData.current.weather_code),
    feelsLike: weatherData.current.apparent_temperature,
    humidity: weatherData.current.relative_humidity_2m,
    wind: weatherData.current.wind_speed_10m,

    uv: weatherData.daily.uv_index_max[0],
    rain: weatherData.hourly.precipitation_probability[safeCurrentHourIndex],

    weatherCode: weatherData.current.weather_code,
    hourly: hourlyForecast,
  };
}

module.exports = {
  getWeather,
};