const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function list() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            fs.writeFileSync('models_list.json', JSON.stringify(data, null, 2));
        } else {
            fs.writeFileSync('models_list.json', JSON.stringify(data.models, null, 2));
        }

    } catch (err) {
        fs.writeFileSync('models_list.json', JSON.stringify({ error: err.message }));
    }
}
list();
