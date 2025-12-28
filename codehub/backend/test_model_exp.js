const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    console.log("Testing gemini-2.0-flash-exp...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent("hello");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.log("Failed:", err.message);
    }
}
test();
