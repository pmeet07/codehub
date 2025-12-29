const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs-extra');
const path = require('path');

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'codehub-storage';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 Client
// If AWS credentials are in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY), SDK picks them up automatically.
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Uploads a buffer to S3
 * @param {string} key - The S3 key (path)
 * @param {Buffer|string} body - The content
 * @param {string} contentType - Mime type
 */
exports.uploadFile = async (key, body, contentType = 'application/octet-stream') => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType
    });
    return s3Client.send(command);
};

/**
 * Checks if a file exists in S3
 * @param {string} key 
 */
exports.fileExists = async (key) => {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        if (error.name === 'NotFound') return false;
        // Ignore other errors
        return false;
    }
};

/**
 * Downloads a file from S3 and returns Buffer
 * @param {string} key 
 */
exports.downloadFile = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    const response = await s3Client.send(command);

    // Stream to Buffer
    return new Promise((resolve, reject) => {
        const chunks = [];
        response.Body.on('data', (chunk) => chunks.push(chunk));
        response.Body.on('error', reject);
        response.Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
};

/**
 * Get a readable stream for a file (for piping to response)
 * @param {string} key 
 */
exports.getFileStream = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    const response = await s3Client.send(command);
    return response.Body;
};

/**
 * Hybrid Helper: Read content from S3 (Primary) or Local Disk (Fallback for legacy data)
 * @param {string} repoId 
 * @param {string} hash 
 */
exports.readObject = async (repoId, hash) => {
    const s3Key = `repos/${repoId}/objects/${hash}`;

    // Try S3 first
    try {
        const buffer = await exports.downloadFile(s3Key);
        return buffer;
    } catch (e) {
        // Fallback to local disk (Legacy support)
        const localPathObjects = path.join(__dirname, '../../storage', repoId.toString(), 'objects', hash);
        const localPathLegacy = path.join(__dirname, '../../storage', repoId.toString(), hash);

        if (await fs.pathExists(localPathObjects)) {
            return fs.readFile(localPathObjects);
        } else if (await fs.pathExists(localPathLegacy)) {
            return fs.readFile(localPathLegacy);
        }

        throw new Error('Object not found in S3 or local storage');
    }
};

/**
 * Hybrid Helper: Write object to S3
 * @param {string} repoId 
 * @param {string} hash 
 * @param {Buffer} content 
 */
exports.writeObject = async (repoId, hash, content) => {
    const key = `repos/${repoId}/objects/${hash}`;
    await exports.uploadFile(key, content);
};

module.exports = exports;
