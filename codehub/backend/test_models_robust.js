const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // For some SDK versions, listModels might be under the client or a specific manager
        // But usually it involves making a request. 
        // Since the SDK structure can vary, let's try a direct approach if the SDK version allows
        // or just try a few known valid ones.

        // Actually, the error message says "Call ListModels". 
        // In the node SDK, it's often not directly exposed in a simple way in older versions, 
        // but let's try to assume we can just test a few standard ones.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        for (const modelName of modelsToTest) {
            console.log(`\nTesting: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test");
                console.log(`✅ ${modelName} IS WORKING!`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
