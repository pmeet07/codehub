# How to Get a Google Gemini API Key

1.  **Go to Google AI Studio**:
    Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

2.  **Sign In**:
    Log in with your Google account.

3.  **Create API Key**:
    - Click on the blue **"Create API key"** button.
    - You can choose to create a key in a new project or an existing Google Cloud project.
    - Use "Create API key in new project" if you are unsure.

4.  **Copy the Key**:
    - A popup will show your new key (starts with `AIzaSy...`).
    - **Copy** this string immediately.

5.  **Update Your Project**:
    - Open `backend/.env` in your code editor.
    - Find the line `GEMINI_API_KEY=...`
    - Replace the existing text with your new key.
    - Save the file.
