const express = require("express");

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
app.get("/api/weather", (req, res) => {
  res.json({
    location: "Bengaluru, Karnataka",
    temperature: 28,
    condition: "Partly Cloudy",
    feelsLike: 30,
    humidity: 80,
    wind: 8,
    uvIndex: 7,
    rainProbability: 15,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`MAUSAM AI backend running on port ${PORT}`);
});