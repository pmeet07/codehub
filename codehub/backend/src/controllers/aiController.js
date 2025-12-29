const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
// Explicitly load .env from the backend root just in case
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Lazy getter for GenAI to ensure we catch the environment variable even if loaded late
const getGenAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.length > 20) {
        return new GoogleGenerativeAI(key);
    }
    return null;
};

// Simple offline message for Missing Key only
const getMissingKeyMsg = () => {
    return `### ⚠️ API Key Missing
Please add your Gemini API Key to \`backend/.env\` to enable AI features.`;
};

// Helper for retry logic
async function generateWithRetry(model, prompt, retries = 5, delay = 4000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (err) {
            // If it's not a rate limit error (429) or Service Unavailable (503), throw immediately
            if (!err.message.includes("429") && !err.message.includes("503")) throw err;

            // If it IS a rate limit, and we have retries left, wait and continue
            if (i < retries - 1) {
                console.log(`Busy (429/503). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay += 3000; // Linear backoff + 3s
            } else {
                throw err; // Out of retries
            }
        }
    }
}

/**
 * Main AI Explanation Controller
 */
exports.explainCode = async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: "Code content is required" });

    const selectedLanguage = language || 'English';
    const genAI = getGenAI();

    if (!genAI) {
        return res.json({ explanation: getMissingKeyMsg() });
    }

    try {
        // Use gemini-flash-latest for best availability
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
You are an expert software engineer.
Explain the following code Line-by-Line in ${selectedLanguage}.
Make it beginner friendly.

Format:
### 1. Overview
[Summary]
### 2. Line-by-Line
**Line X:** \`[Code]\`
- [Explanation]

Code:
\`\`\`
${code}
\`\`\`
`;

        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        return res.json({ explanation: response.text() });

    } catch (err) {
        console.error("AI Error:", err.message);

        // Handle Rate Limit (429) specifically
        if (err.message.includes("429")) {
            return res.json({
                explanation: `### ⏳ AI is Busy (Rate Limit)
The AI model is currently experiencing high traffic. 
Please **wait a few moments** and try again.` });
        }

        // Handle Invalid or Leaked Key (400/403)
        if (err.message.includes("API_KEY_INVALID") || err.message.includes("leaked") || err.message.includes("403") || err.message.includes("400")) {
            return res.json({
                explanation: `### 🔒 API Key Invalid or Blocked
**Your Google Gemini API Key is invalid or has been disabled.**

**To Fix:**
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Generate a **NEW** API Key.
3. Update your \`backend/.env\` file with the new key.
4. Restart the backend server.`
            });
        }

        // Handle 404 (Model not found) or others
        return res.json({
            explanation: `### ❌ AI Error
Failed to connect to Gemini.
Error: ${err.message}`
        });
    }
};

/**
 * AI Code Debugger & Fixer
 */
exports.debugCode = async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code content is required" });

    const genAI = getGenAI();
    if (!genAI) {
        return res.json({
            bugs: [],
            error: "API Key Missing. Add GEMINI_API_KEY to backend/.env"
        });
    }

    try {
        // Use gemini-flash-latest
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
You are an expert code reviewer and debugger.
Analyze the following code for:
1. Syntax Errors
2. Runtime Risks
3. Logical Flaws
4. Security Vulnerabilities
5. Performance Issues

Return the result as a raw JSON Array (no markdown formatting, no \`\`\`json wrappers).
Format:
[
  {
    "line": <number>,
    "severity": "High" | "Medium" | "Low",
    "type": "Security" | "Logic" | "Performance" | "Syntax",
    "message": "<short description>",
    "fix": "<suggested code fix for that line/block>",
    "explanation": "<why this is an issue>"
  }
]

If no bugs are found, return [].

Code:
${code}
`;

        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        let text = response.text();

        console.log("AI Debug Response (Raw):", text); // Log raw output for debugging

        // Robust JSON Extraction
        // 1. Remove markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '');

        // 2. Find the first '[' and last ']' to isolate the JSON array
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');

        if (start !== -1 && end !== -1) {
            text = text.substring(start, end + 1);
        } else {
            // Fallback if no array found, try to assume it's valid JSON or return empty
            console.warn("No JSON array found in AI response");
        }

        try {
            const bugs = JSON.parse(text);
            return res.json({ bugs });
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr.message, "Raw Text:", text);
            return res.json({
                bugs: [],
                error: "AI Response Parse Failed: " + parseErr.message
            });
        }

    } catch (err) {
        console.error("AI Debug Error:", err.message);

        if (err.message.includes("API_KEY_INVALID") || err.message.includes("leaked") || err.message.includes("403") || err.message.includes("400")) {
            return res.json({
                bugs: [],
                error: "API Key Invalid or Blocked. Please check backend/.env"
            });
        }

        return res.json({
            bugs: [],
            error: "Failed to analyze code. " + (err.message || "Unknown error")
        });
    }
};
