// backend/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getWeatherForCity } = require('../services/weatherService');

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

// Builds a small weather-context object for Gemini using the SAME cached,
// rate-limit-safe weatherService the rest of the app uses (previously this
// route called Open-Meteo directly and independently, which meant the
// assistant could still trigger 429s even after the dashboard was fixed).
async function getWeatherContext(city) {
    const weatherData = await getWeatherForCity(city);
    return {
        city: weatherData.location,
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        wind_speed: weatherData.wind,
        condition: weatherData.condition,
        hourly: weatherData.hourly.slice(0, 12).map(h => ({
            time: h.time,
            temperature: h.temperature,
            humidity: h.humidity
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
            const weatherData = await getWeatherContext(city);
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
        console.error("Assistant Error:", error);
        const is503 = error?.status === 503 || /503|overloaded|high demand/i.test(error?.message || '');
        const is429 = error.response?.status === 429;
        let message = "Sorry, I had trouble connecting to the AI right now.";
        if (is503) message = "The AI is under heavy load right now. Please wait a few seconds and try again.";
        if (is429) message = "Weather service is busy right now (rate limited). Please wait a few seconds and try again.";
        res.status(500).json({ reply: message });
    }
});

module.exports = router;
