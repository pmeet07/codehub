const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testWithBackoff(modelName) {
    console.log(`Testing ${modelName} with backoff...`);
    // Wait 2 seconds before testing to avoid immediate rate limit if previous calls spammed
    await new Promise(r => setTimeout(r, 2000));

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        console.log(`SUCCESS: ${modelName}`);
        return true;
    } catch (err) {
        console.log(`Failed ${modelName}: ${err.message.substring(0, 100)}`);
        return false;
    }
}

async function findOne() {
    // gemini-2.0-flash-exp seems to exist but is rate limited.
    // gemini-1.5-flash is 404.
    // Let's try gemini-2.0-flash-lite-preview-02-05 (newest lite)

    const candidates = [
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-pro"
    ];

    for (const c of candidates) {
        if (await testWithBackoff(c)) {
            console.log(`FOUND WORKING MODEL: ${c}`);
            process.exit(0);
        }
    }
    console.log("ALL FAILED");
}

findOne();
