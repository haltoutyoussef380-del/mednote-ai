'use server'

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error("No file uploaded");
    }

    try {
        console.log(`Transcribing audio file: ${file.name}, type: ${file.type}, size: ${file.size}`);

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            prompt: "Contexte médical: cardiologie, psychiatrie, médicaments, constantes vitales. Langue française.",
            response_format: "json",
            language: "fr",
            temperature: 0.0
        });

        return { text: transcription.text };
    } catch (error: any) {
        console.error("Transcription error:", error);
        return { error: error.message };
    }
}
