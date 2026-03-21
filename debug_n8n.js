const fs = require('fs');
const path = require('path');

// Create dummy file
const filePath = path.join(__dirname, 'test_audio.webm');
fs.writeFileSync(filePath, 'fake audio data');

async function test() {
    console.log("Sending request to n8n Webhook...");
    try {
        // Construct body manually for max compatibility if native FormData is missing in older Node
        // But assuming Node 18+ given Next.js
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const body =
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="patient_dictation.webm"\r\n` +
            `Content-Type: audio/webm\r\n\r\n` +
            `fake audio data\r\n` +
            `--${boundary}--`;

        const res = await fetch('http://localhost:5678/webhook/magic-dictation', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });

        console.log("Response Status:", res.status);
        const text = await res.text();
        console.log("Response Body:", text);

    } catch (e) {
        console.error("Connection Error:", e.cause || e);
    }
}

test();
