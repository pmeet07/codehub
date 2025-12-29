const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const newKey = 'AIzaSyB2hHpUAobcjhSXDy3qI1lORl1dzMf-0fg';

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${newKey}`);
    } else {
        content += `\nGEMINI_API_KEY=${newKey}\n`;
    }

    fs.writeFileSync(envPath, content);
    console.log('Updated .env with new API Key');
} catch (err) {
    console.error('Failed to update .env:', err);
}
