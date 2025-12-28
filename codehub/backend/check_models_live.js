const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro"
];

async function testAll() {
    console.log("Testing API Key:", API_KEY ? API_KEY.substring(0, 10) + "..." : "MISSING");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hi");
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log("Response:", result.response.text());
            // If one works, we can recommend it, but let's test all to find the best/fastest.
        } catch (err) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`   Error: ${err.message.split('\n')[0]}`); // First line only
        }
    }
}

testAll();
