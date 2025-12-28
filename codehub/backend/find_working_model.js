const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName) {
    try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ SUCCESS: ${modelName} is working.`);
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${modelName} - ${err.message.split('\n')[0]}`);
        return false;
    }
}

async function findWorkingModel() {
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-2.0-flash-exp"
    ];

    for (const model of candidates) {
        if (await testModel(model)) {
            console.log(`\n>>> RECOMMENDED: Use '${model}' in your code.`);
            break;
        }
    }
}

findWorkingModel();
