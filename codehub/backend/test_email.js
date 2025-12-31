require('dotenv').config();
const emailService = require('./src/services/emailService');

console.log('--- Email Config Check ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? (process.env.EMAIL_PASS.substring(0, 3) + '******') : 'Not Set');

async function test() {
    console.log('Attempting to send test email...');
    const result = await emailService.sendOTP(process.env.EMAIL_USER, '123456');
    if (result) {
        console.log('SUCCESS: Email sent!');
    } else {
        console.log('FAILURE: Could not send email.');
    }
}

test();
