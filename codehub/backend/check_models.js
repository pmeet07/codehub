const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('No GEMINI_API_KEY found in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(key);

    try {
        // There isn't a direct listModels method on the client instance in some versions, 
        // but we can try to use a known working model or just catch the error.
        // Actually, the error message told us to call ListModels, which is a REST API call.
        // The SDK might expose it via the ModelManager or similar.
        // Let's try to just test a few common ones.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash-exp",
            "gemini-pro"
        ];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you there?");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName}`);
                return; // We found one!
            } catch (err) {
                console.log(`❌ FAILED: ${modelName} - ${err.message.split(':')[0]}`);
            }
        }

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

listModels();
