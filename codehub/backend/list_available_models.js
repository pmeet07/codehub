const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function checkModels() {
    if (!API_KEY) {
        console.log("No API Key found");
        return;
    }

    // Test fetching models via REST API since SDK method might vary
    try {
        console.log("Fetching models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (!data.models) {
            console.log("No models found in response.");
            return;
        }

        console.log("\n--- Available Models ---");
        const textModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));

        textModels.forEach(m => {
            console.log(`Name: ${m.name}`);
            console.log(`Description: ${m.description}`);
            console.log(`Version: ${m.version}`);
            console.log("-------------------------");
        });

        if (textModels.length === 0) {
            console.log("No models found that support 'generateContent'.");
            console.log("All models:", data.models.map(m => m.name));
        }

    } catch (err) {
        console.error("Network/Script Error:", err.message);
    }
}

checkModels();
