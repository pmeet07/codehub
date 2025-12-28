const https = require('https');

const API_KEY = "AIzaSyAt3o6wIPq1zj2Rqu54NSGOav8TRZN-j7w";
const MODEL = "gemini-pro";

const data = JSON.stringify({
    contents: [{
        parts: [{ text: "Explain this code: console.log('hello')" }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Testing REST API...");

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log("BODY:", body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
