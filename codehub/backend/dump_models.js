const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        fs.writeFileSync('models_output.json', JSON.stringify({ error: "No API Key" }));
        return;
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        fs.writeFileSync('models_output.json', JSON.stringify(data, null, 2));
        console.log("Models saved to models_output.json");

    } catch (err) {
        fs.writeFileSync('models_output.json', JSON.stringify({ error: err.message }));
    }
}

listModels();
