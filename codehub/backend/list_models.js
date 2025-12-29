const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Script to list all available models for this specific API Key
async function listAvailableModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('❌ Error: GEMINI_API_KEY is missing in .env');
        return;
    }

    // Direct REST call because the SDK wrapper might be hiding the listModels method
    // or we just want raw output.
    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('\n✅ AVAILABLE MODELS FOR YOUR KEY:');
            console.log('-----------------------------------');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`Model: ${m.name.replace('models/', '')}`);
                }
            });
            console.log('-----------------------------------\n');
        } else {
            console.log('❌ No models found or Error:', data);
        }

    } catch (err) {
        console.error('Fatal error listing models:', err);
    }
}

listAvailableModels();
