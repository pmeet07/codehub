require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function check() {
    console.log("--- Checking API Key Setup ---");
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.log("❌ ERROR: No GEMINI_API_KEY found in .env file.");
        console.log("   Action: Open 'backend/.env' and add your key.");
        return;
    }

    if (key.includes("YOUR_API_KEY_HERE")) {
        console.log("❌ ERROR: You have not replaced the placeholder text.");
        console.log("   Action: Open 'backend/.env' and replace 'YOUR_API_KEY_HERE' with your actual key.");
        console.log("   Get a key here: https://makersuite.google.com/app/apikey");
        return;
    }

    console.log(`✅ Key found: ${key.substring(0, 5)}...`);
    console.log("   Testing connection to Google...");

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("✅ SUCCESS! The key is working.");
        console.log("⚠️ CRITICAL: You must RESTART your backend server for these changes to apply!");
        console.log("   Run: Ctrl+C then 'npm run dev'");
    } catch (err) {
        console.log("❌ ERROR: The key is invalid or Google is blocking it.");
        console.log("   Error details: " + err.message);
    }
}

check();
