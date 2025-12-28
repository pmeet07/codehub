# AI Code Explanation Feature Implementation Plan

## 1. Overview
This document outlines the architecture and implementation strategy for the AI-powered "Code Explain" feature in CodeHub. The goal is to provide developer-level, human-friendly code explanations in multiple languages (English, Hindi, Gujarati) using Google's Gemini 2.0 Flash model.

## 2. Architecture

### Backend (Node.js/Express)
- **Controller**: `aiController.js`
  - Handles `/api/ai/explain` endpoint.
  - Manages API key security (Environment variables).
  - Constructs the prompt for Gemini.
  - Handles error states and fallbacks (Offline mode).
- **Service**: Google Generative AI SDK (`@google/generative-ai`).
- **Model**: `gemini-2.0-flash`.
  - **Reasoning**: Chosen for its massive 1M token context window (eliminating the need for complex chunking for single files) and high speed/low latency.

### Frontend (React/Vite)
- **Component**: `FileViewer.jsx`
  - Integrates the "Explain" button.
  - Manages state: `loading`, `explanation` (markdown), `language` (selection).
  - Displays the explanation in a split-pane view alongside the code.
- **Rendering**: `react-markdown` with syntax highlighting for code snippets within the explanation.

## 3. Prompt Engineering Strategy

We will use a **System Instruction** approach with a structured user prompt to ensure consistent high-quality output.

### Role Definition
"You are a Senior Staff Software Engineer and Technical Educator. Your goal is to explain code to junior developers clearly, accurately, and without jargon."

### Prompt Structure
1.  **Input Context**: "Language: [Target Language]", "File Content: [Code]".
2.  **Output Guidelines**:
    - **No Hallucinations**: strict adherence to provided code.
    - **Tone**: Professional, encouraging, and educational.
    - **Formatting**: GitHub-flavored Markdown.

### Specific Language Instructions
- **English**: Standard technical English.
- **Hindi**: Hinglish (Tech terms in English, grammar/explanation in Hindi) or Formal Technical Hindi. *Decision: Technical Hindi with English keywords for clarity (e.g., "Function call ho raha hai...").*
- **Gujarati**: Formal Gujarati with preserved English technical terms.

## 4. Implementation Steps

1.  **Backend Upgrade**:
    - Update `aiController` to use `gemini-2.0-flash`.
    - Implement the robust prompt template.
    - specialized handling for "Hindi" and "Gujarati" to ensuring technical terms remain in English (e.g., variable, loop, function) while the explanation logic is translated.

2.  **Frontend Polish**:
    - Ensure `FileViewer.jsx` correctly handles the streaming-like feel (even if not streaming yet) by showing a skeleton or loading state.
    - Verify Markdown rendering of code blocks.

## 5. Future Improvements (Post-MVP)
- **Streaming Response**: Use Gemini's stream capabilities for instant feedback.
- **Chat with Code**: Allow follow-up questions.
- **Repository Context**: Send related files (imported modules) using the 1M token window.

