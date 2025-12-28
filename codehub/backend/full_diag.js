const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function fullDiag() {
    console.log("Full Diagnostic for Key:", API_KEY ? API_KEY.slice(0, 5) + "..." : "MISSING");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("test");
        console.log("gemini-1.5-flash: OK");
    } catch (e) {
        console.log("gemini-1.5-flash ERROR:", e.message);
    }
}
fullDiag();
