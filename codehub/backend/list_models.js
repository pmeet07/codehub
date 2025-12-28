const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function list() {
    console.log("Listing models...");
    try {
        // Accessing the model directly to list (hacky via internal or if available)
        // Actually standard SDK didn't expose listModels easily in v1, but let's try via direct fetch if SDK fails.
        // Or check if the SDK has it. The error message implies it is possible.
        // It seems newer SDKs do support it or we can use REST.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.log("Error listing models:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:");
            (data.models || []).forEach(m => console.log(`- ${m.name}`));
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}
list();
