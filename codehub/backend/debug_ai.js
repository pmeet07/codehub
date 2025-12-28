const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function test() {
    if (!API_KEY) {
        console.log("No API Key found");
        return;
    }
    console.log("Testing Key:", API_KEY.substring(0, 10) + "...");
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        console.log("Attempting to list models...");
        // Note: listModels might not be available on the client directly in the same way, 
        // but getting a model and running prompt is the standard test.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("Response:", result.response.text());
        console.log("SUCCESS: gemini-1.5-flash works.");
    } catch (error) {
        console.error("ERROR directly accessing gemini-1.5-flash:", error.message);

        try {
            console.log("Trying fallback to gemini-pro...");
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result2 = await model2.generateContent("Say hello");
            console.log("Response:", result2.response.text());
            console.log("SUCCESS: gemini-pro works.");
        } catch (err2) {
            console.error("ERROR accessing gemini-pro:", err2.message);
        }
    }
}

test();
