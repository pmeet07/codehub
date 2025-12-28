const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    let logBuffer = "";
    const log = (msg) => {
        console.log(msg);
        logBuffer += msg + "\n";
    };

    try {
        log("Starting Tests...");

        const modelsToTest = [
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        for (const modelName of modelsToTest) {
            log(`\n-------------------\nTesting: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                log(`✅ SUCCESS: ${modelName}`);
            } catch (e) {
                log(`❌ FAILED: ${modelName}`);
                log(`Error: ${e.message}`);
            }
        }

    } catch (error) {
        log(`Fatal Error: ${error.message}`);
    } finally {
        fs.writeFileSync('model_results.txt', logBuffer);
        log("Done. Results saved to model_results.txt");
    }
}

listModels();
