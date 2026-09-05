const express = require("express");
const { getWeather } = require("./services/weatherService");

const app = express();
const PORT = 5000;

app.use(express.json());

// Check if the backend is running
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MAUSAM AI backend is running",
  });
});

// Get weather data
app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city || "Bareilly";

    const weather = await getWeather(city);

    res.json(weather);
  } catch (error) {
    console.error("Weather API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch weather data",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`MAUSAM AI backend running on port ${PORT}`);
});