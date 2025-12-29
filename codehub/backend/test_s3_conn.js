require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function checkS3() {
    console.log('Checking S3 Connection...');
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log(`Bucket: ${process.env.AWS_BUCKET_NAME}`);

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
            MaxKeys: 1
        });
        await s3.send(command);
        console.log('✅ Success! Connected to S3 bucket.');
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        if (err.name === 'NoSuchBucket') {
            console.error('  -> The bucket does not exist. Please create it in AWS Console.');
        } else if (err.name === 'InvalidAccessKeyId' || err.name === 'SignatureDoesNotMatch') {
            console.error('  -> Invalid Credentials.');
        }
    }
}

checkS3();
