require('dotenv').config();
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sender = process.env.AWS_SOURCE_EMAIL; // meet072005@gmail.com (Verified)
const target = 'mpaj1505@gmail.com'; // Your Login Email (Likely Unverified in Sandbox)

const client = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

console.log(`\n--- SANDBOX CHECK ---`);
console.log(`Sending FROM: ${sender}`);
console.log(`Sending TO:   ${target}`);

async function run() {
    try {
        await client.send(new SendEmailCommand({
            Source: sender,
            Destination: { ToAddresses: [target] },
            Message: { Subject: { Data: "Sandbox Test" }, Body: { Text: { Data: "Test" } } }
        }));
        console.log('✅ SUCCESS: Email Sent! Sandbox is NOT blocking this address.');
    } catch (err) {
        console.log('❌ FAILED: AWS Rejected the email.');
        console.log(`   Reason: ${err.message}`);
        if (err.message.includes('not verified')) {
            console.log('\n💡 DIAGNOSIS: You are in AWS SES SANDBOX MODE.');
            console.log(`   You must verify '${target}' in AWS Console to send email to it.`);
        }
    }
}

run();
