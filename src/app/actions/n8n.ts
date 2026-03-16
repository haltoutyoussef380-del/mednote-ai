'use server'

import Groq from 'groq-sdk';

// Initialize Groq SDK
// Ensure GROQ_API_KEY is set in .env.local
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function processAudioWithN8N(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        return { error: "No file uploaded" };
    }

    try {
        console.log("🎤 Starting Server-Side Transcription with Groq...");

        // 1. Transcribe Audio directly on the Serveur (Next.js)
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            response_format: "json", // or 'verbose_json'
            temperature: 0.0,
        });

        const text = transcription.text;
        console.log("✅ Transcription Success:", text.substring(0, 50) + "...");

        // 2. Send TEXT ONLY to n8n (Reliable JSON payload)
        // No more binary upload headaches!
        const response = await fetch('http://localhost:5678/webhook/magic-dictation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data };

    } catch (error: any) {
        console.error("N8N/Groq Bridge Error:", error);
        return { error: error.message };
    }
}
