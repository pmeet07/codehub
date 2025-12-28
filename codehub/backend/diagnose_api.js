const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function diagnose() {
    const candidates = [
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-pro"
    ];

    let log = `Diagnostic Report for Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'MISSING'}\n`;
    log += `Time: ${new Date().toISOString()}\n\n`;

    for (const modelName of candidates) {
        log += `Testing ${modelName}...\n`;
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            log += `✅ PASSED.\n`;
        } catch (err) {
            log += `❌ FAILED: ${err.message}\n`;
        }
        log += "--------------------------------------------------\n";
    }

    fs.writeFileSync('diagnostic_report.txt', log);
    console.log("Report generated.");
}

diagnose();
