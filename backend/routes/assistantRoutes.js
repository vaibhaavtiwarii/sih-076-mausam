// backend/routes/assistantRoutes.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    // Define the tools (function calling) so Gemini knows how to get weather
    tools: [{
        functionDeclarations: [{
            name: "get_weather",
            description: "Get the current weather, humidity, and hourly forecast for a specific city.",
            parameters: {
                type: "OBJECT",
                properties: {
                    city: { type: "STRING", description: "The name of the city, e.g., 'Bareilly'" }
                },
                required: ["city"]
            }
        }]
    }]
});

// A helper function to call Open-Meteo (FREE and NO LIMITS)
async function getWeatherData(city) {
    // Simple geocoding to get lat/lon (using Open-Meteo's free API)
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
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
        hourly: weatherData.hourly
    };
}

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Start the chat session
        const chat = model.startChat({
            history: [],
            // If Gemini doesn't get tools, it might hallucinate, so we force it to use tools
            toolConfig: { functionCallingConfig: { mode: "AUTO" } }
        });

        // Send the user's prompt to Gemini
        let result = await chat.sendMessage(prompt);
        let response = result.response;

        // Loop in case Gemini wants to call the function
        for (let i = 0; i < 5; i++) {
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                // Gemini wants to call get_weather
                const weatherData = await getWeatherData(functionCalls[0].args.city);
                
                // Send the data BACK to Gemini
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: "get_weather",
                        response: weatherData
                    }
                }]);
                response = result.response;
            } else {
                break; // Gemini is done and has a text response
            }
        }

        res.json({ reply: response.text() });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "Sorry, I had trouble connecting to the AI right now." });
    }
});

module.exports = router;