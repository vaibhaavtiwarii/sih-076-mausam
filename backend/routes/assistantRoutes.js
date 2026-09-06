// backend/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model used to figure out which city (if any) the user is asking about.
// responseMimeType forces Gemini to return valid, parseable JSON.
const extractorModel = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: { responseMimeType: "application/json" }
});

// Model used to actually answer the user, with weather data (if any)
// given as plain text context instead of via native function calling.
// This avoids the native tool-calling handshake entirely (the old SDK
// sends function results back with role "function", which newer Gemini
// models reject with a 400 "Role 'function' is not supported" error).
const answerModel = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

// Small delay helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Google's shared/free-tier models occasionally return 503 "high demand" errors.
// These are transient - retrying a couple of times with a short delay usually
// succeeds. This wraps any generateContent call with that retry behaviour.
async function generateWithRetry(model, prompt, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            const is503 = error?.status === 503 || /503|overloaded|high demand/i.test(error?.message || '');
            const isLastAttempt = attempt === retries;
            if (!is503 || isLastAttempt) {
                throw error; // not a transient error, or we've run out of retries - bubble up
            }
            // Wait a bit before retrying (0.8s, then 1.6s, etc.)
            await sleep(800 * (attempt + 1));
        }
    }
}

// A helper function to call Open-Meteo (FREE and NO LIMITS)
async function getWeatherData(city) {
    // Simple geocoding to get lat/lon (using Open-Meteo's free API)
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
        return { error: `City '${city}' not found.` };
    }

    const { latitude, longitude, name } = geoData.results[0];

    // Fetch actual weather from Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,weathercode&timezone=auto`);
    const weatherData = await weatherRes.json();

    // current_weather has no humidity field - look up the hourly value
    // for the timestamp that matches current_weather.time instead.
    const hourly = weatherData.hourly;
    let currentHourIndex = hourly.time.findIndex(t => t === weatherData.current_weather.time);
    if (currentHourIndex === -1) currentHourIndex = 0;

    return {
        city: name,
        temperature: weatherData.current_weather.temperature,
        humidity: hourly.relativehumidity_2m[currentHourIndex],
        wind_speed: weatherData.current_weather.windspeed,
        condition: weatherData.current_weather.weathercode,
        // Trim the hourly payload - we only need the next few hours as context,
        // not all 24, to keep the prompt small and fast.
        hourly: hourly.time.slice(0, 12).map((t, i) => ({
            time: t,
            temperature: hourly.temperature_2m[i],
            humidity: hourly.relativehumidity_2m[i]
        }))
    };
}

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Step 1: Ask Gemini to pull out a city name from the user's message, if any.
        const extractResult = await generateWithRetry(
            extractorModel,
            `Extract the city name the user is asking about, if any is mentioned or clearly implied. ` +
            `Respond ONLY with JSON in this exact shape: {"city": "CityName"} or {"city": null} if no city is mentioned. ` +
            `User message: "${prompt}"`
        );

        let city = null;
        try {
            const parsed = JSON.parse(extractResult.response.text());
            city = parsed.city || null;
        } catch (parseErr) {
            city = null; // if parsing fails, just proceed without weather context
        }

        let finalPrompt = prompt;

        if (city) {
            const weatherData = await getWeatherData(city);
            finalPrompt =
                `You are MAUSAM AI, a helpful weather assistant. ` +
                `Here is live weather data for ${city}: ${JSON.stringify(weatherData)}. ` +
                `Using this data, answer the user's question in a friendly, concise way (2-4 sentences). ` +
                `User question: "${prompt}"`;
        }

        // Step 2: Get the actual answer as a single plain-text request.
        // No chat history, no function calling - just one request, one response.
        const result = await generateWithRetry(answerModel, finalPrompt);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Gemini Error:", error);
        const is503 = error?.status === 503 || /503|overloaded|high demand/i.test(error?.message || '');
        const message = is503
            ? "The AI is under heavy load right now. Please wait a few seconds and try again."
            : "Sorry, I had trouble connecting to the AI right now.";
        res.status(500).json({ reply: message });
    }
});

module.exports = router;