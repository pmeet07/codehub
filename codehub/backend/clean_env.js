const fs = require('fs');

const envPath = '.env';

try {
    const rawArgs = fs.readFileSync(envPath, 'utf8');

    // Naive parse: split by newline, but handle lines that might have been concatenated
    // e.g. KEY=VALKEY2=VAL2
    // We can regex for common keys to insert newlines before them
    let clean = rawArgs;
    const keys = [
        'PORT', 'JWT_SECRET', 'GEMINI_API_KEY', 'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME',
        'GOOGLE_CLIENT_ID', 'EMAIL_USER', 'EMAIL_PASS'
    ];

    keys.forEach(key => {
        // Insert newline before key if not preceded by newline
        const regex = new RegExp(`(?<!\\n)${key}=`, 'g');
        clean = clean.replace(regex, `\n${key}=`);
    });

    // Split and Deduplicate
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l);
    const uniqueMap = new Map();

    // Priority: Keep the LAST usage if valid, or first?
    // Usually duplicates at bottom are user edits. Let's keep last.
    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const k = match[1].trim();
            const v = match[2].trim();
            uniqueMap.set(k, v);
        }
    });

    let newContent = '';
    uniqueMap.forEach((v, k) => {
        newContent += `${k}=${v}\n`;
    });

    fs.writeFileSync(envPath, newContent);
    console.log('Successfully cleaned .env file!');
    console.log('--- Current Values (sensitive info hidden) ---');
    uniqueMap.forEach((v, k) => {
        const display = (k.includes('PASS') || k.includes('SECRET') || k.includes('KEY')) ? v.substring(0, 4) + '...' : v;
        console.log(`${k}=${display}`);
    });

} catch (e) {
    console.error('Error cleaning env:', e.message);
}
