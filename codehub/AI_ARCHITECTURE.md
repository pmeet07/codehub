# AI Architecture & Implementation Guide

## 1. Overview
The CodeHub project implements an **AI-Code Explanation** feature that allows users to get line-by-line explanations of code snippets. The system is designed with a **Hybrid Architecture** that ensures functionality even without an active internet connection or valid API key.

## 2. Technology Stack
- **AI Model:** Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Backend:** Node.js / Express
- **Fallback Engine:** Custom Heuristic-based Offline Generator
- **Supported Languages:** English, Hindi, Gujarati

## 3. Workflow
The AI Controller (`aiController.js`) handles the logic using the following flow:

### Step 1: Request Reception
The client sends a POST request to `/api/ai/explain` with:
- `code`: The code snippet to explain.
- `language`: The target language for the explanation (default: English).

### Step 2: API Key Validation
The systems checks for the `GEMINI_API_KEY` environment variable.
- **If Key is Present:** Proceed to Online Mode (Step 3).
- **If Key is Missing:** Fallback to Offline Mode (Step 4).

### Step 3: Online Mode (Gemini API)
- The system initializes the `GoogleGenerativeAI` client.
- It selects the `gemini-1.5-flash` model for low latency.
- A structured prompt is sent to the model:
  > "You are an expert software engineer. Explain the following code Line-by-Line in [Language]. Make it beginner friendly."
- **Failure Handling:** If the API call fails (network error, quota exceeded), the system catches the error and automatically triggers **Offline Mode**.

### Step 4: Offline Mode (Heuristic Engine)
This is a custom-built rule engine that functions without external APIs.
1.  **Token Analysis:** The code is split line-by-line.
2.  **Keyword Matching:** Each line is checked against a dictionary of common programming patterns:
    - **HTML:** `<div`, `<script`, `<body`, `<!DOCTYPE`
    - **JavaScript:** `import`, `const/let/var`, `function`, `console.log`, `if/else`, `loops`
3.  **Multi-Language Support:** The definitions for these patterns are stored in a translation map (`t`) for English, Hindi, and Gujarati.
4.  **Formatting:** The engine constructs a markdown response that mimics the AI's output format.

## 4. Key Files

### `backend/src/controllers/aiController.js`
This is the core file containing all AI logic.

```javascript
// Simplified Logic View
exports.explainCode = async (req, res) => {
    // 1. Try Gemini API
    try {
        const result = await gemini.generateContent(prompt);
        return res.json({ explanation: result.text });
    } catch (err) {
        // 2. Fallback to Offline
        const offlineExplanation = generateOfflineExplanation(code, language);
        return res.json({ explanation: offlineExplanation });
    }
};
```

## 5. Frontend Integration

The user interface is built with React and provides a seamless split-screen experience.

### `frontend/src/components/repo/FileViewer.jsx`
- **UI Layout:** A split-view modal showing the **Monaco Editor** (Left) and **AI Explanation Panel** (Right).
- **Triggers:** The explanation is fetched only when the user clicks the "Explain" button.
- **Components used:**
  - `@monaco-editor/react`: Displays the code with syntax highlighting.
  - `react-markdown`: Renders the AI's markdown response into rich styled HTML.
- **States:**
  - `loading`: Shows a "Thinking in [Language]..." pulse animation.
  - `language`: Dropdown to select English, Hindi, or Gujarati.
  - `error`: displays a retry button if the fetch fails.

## 6. Setup & Configuration

To enable the Online AI mode, you must configure the environment variable.

1.  Get an API Key from [Google AI Studio](https://aistudio.google.com/).
2.  Create or Edit your `.env` file in the `backend/` directory.
3.  Add the key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

## 7. Supported Features
| Feature | Online (Gemini) | Offline (Fallback) |
| :--- | :--- | :--- |
| **Accuracy** | High (Context Aware) | Basic (Pattern Matching) |
| **Custom Language** | Excellent | Limited (Eng, Hin, Guj only) |
| **Logic Analysis** | Yes | No (Line-by-line definitions only) |
| **Speed** | ~1-2 Seconds | Instant (<10ms) |

## 8. Future Improvements
- Add syntax checking before sending to AI.
- Cache common explanations in Redis to save API costs.
- Parse Abstract Syntax Trees (AST) for better offline accuracy.
