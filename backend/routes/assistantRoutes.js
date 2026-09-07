// backend/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const { getWeatherForCity } = require('../services/weatherService');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// A stable, fast, free-tier-friendly Groq model. Groq (like Gemini) does
// retire model names occasionally - if you ever see a 400/404 mentioning
// "model not found" or "decommissioned", check console.groq.com/docs/models
// for the current recommended replacement and swap it in here.
const MODEL = 'openai/gpt-oss-120b';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Calls Groq's chat completions endpoint (OpenAI-compatible format).
// Automatically retries a couple of times on transient 429 (rate limited)
// or 503 (overloaded) responses before giving up.
async function callGroq(messages, extraOptions = {}, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                ...extraOptions
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        }

        const isRetryable = response.status === 429 || response.status === 503;
        const isLastAttempt = attempt === retries;

        if (!isRetryable || isLastAttempt) {
            const errorBody = await response.text();
            throw new Error(`Groq API error ${response.status}: ${errorBody}`);
        }

        await sleep(800 * (attempt + 1)); // 0.8s, then 1.6s
    }
}

// Builds a small weather-context object for the AI using the SAME shared
// weatherService the rest of the app uses (instead of calling Open-Meteo
// directly and independently, which used to cause extra 429s).
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

        // Step 1: Ask the model to pull out a city name from the user's message, if any.
        const extractRaw = await callGroq(
            [
                {
                    role: 'system',
                    content: 'Extract the city name the user is asking about, if any is mentioned or clearly implied. Respond ONLY with JSON in this exact shape: {"city": "CityName"} or {"city": null} if no city is mentioned.'
                },
                { role: 'user', content: prompt }
            ],
            { response_format: { type: 'json_object' } }
        );

        let city = null;
        try {
            const parsed = JSON.parse(extractRaw);
            city = parsed.city || null;
        } catch (parseErr) {
            city = null; // if parsing fails, just proceed without weather context
        }

        let messages;
        if (city) {
            const weatherData = await getWeatherContext(city);
            messages = [
                { role: 'system', content: 'You are MAUSAM AI, a helpful weather assistant. Answer in a friendly, concise way (2-4 sentences), using the provided weather data.' },
                { role: 'user', content: `Live weather data for ${city}: ${JSON.stringify(weatherData)}\n\nUser question: "${prompt}"` }
            ];
        } else {
            messages = [
                { role: 'system', content: 'You are MAUSAM AI, a helpful weather assistant. If the user has not mentioned a city, politely ask which city they mean.' },
                { role: 'user', content: prompt }
            ];
        }

        // Step 2: Get the actual answer.
        const reply = await callGroq(messages);
        res.json({ reply });

    } catch (error) {
        console.error('Assistant Error:', error);
        const isOverloaded = /429|503/.test(error.message || '');
        const message = isOverloaded
            ? "The AI is under heavy load right now. Please wait a few seconds and try again."
            : "Sorry, I had trouble connecting to the AI right now.";
        res.status(500).json({ reply: message });
    }
});

module.exports = router;