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
        // Use the working model: gemini-2.5-flash (since 1.5 is 404)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

        const result = await model.generateContent(prompt);
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
        // Use standard 2.5-flash model as it is listed as available
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log("AI Debug Response (Raw):", text); // Log raw output for debugging

        // Cleanup if the model wraps in markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

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
        return res.json({
            bugs: [],
            error: "Failed to analyze code. " + (err.message || "Unknown error")
        });
    }
};
