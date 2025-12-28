const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-pro",
    "gemini-2.0-flash-exp"
];

async function verify() {
    console.log(`Checking Key: ${API_KEY.substring(0, 8)}...`);
    for (const m of models) {
        process.stdout.write(`Testing ${m}... `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("hi");
            console.log("✅ WORKING");
            // Found a working one, let's recommend it
            console.log(`\n>>> RECOMMENDATION: Use '${m}'`);
            process.exit(0);
        } catch (e) {
            console.log(`❌ FAIL (${e.message.split(' ')[0]})`);
        }
    }
    console.log("\nALL MODELS FAILED.");
}

verify();
