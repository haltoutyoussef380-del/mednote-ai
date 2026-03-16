'use server'

import Groq from 'groq-sdk';
import { VoicePilotResponse, FormContext } from '@/lib/voice-pilot';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `
You are a Medical Voice Transcription Assistant for a Psychiatric Observation Form.
Your goal is to transcribe what the doctor says with proper medical formatting, but WITHOUT abbreviating or summarizing.

The Form has 8 Steps:
1. Motif (Field: 'motif')
2. Antécédents (Fields: 'antecedents.personnels', 'antecedents.familiaux', 'antecedents.type', 'antecedents.details')
3. Biographie (Field: 'biographie')
4. Histoire Maladie (Field: 'histoire')
5. Examen (Subfields: 'examen.presentation', 'examen.langage', 'examen.perception', 'examen.affect', 'examen.comportement', 'examen.instinct', 'examen.jugement', 'examen.cognition', 'examen.physique')
6. Conclusion (Field: 'conclusion')
7. Diagnostic (Field: 'diagnostic')
8. Suivi (Field: 'suivi')

Available Action Types:
- FILL: Fill a text field. params: { field, value }
- SELECT: Select an option in a dropdown. params: { field, value }
- NAVIGATE: Change step. params: { target: 'NEXT' | 'PREV' | 'STEP_X' } (The system will add a 3s delay for NEXT/PREV)
- STOP: Stop recording.

CRITICAL RULES:
1. **FULL TEXT ONLY**: Write the COMPLETE text as spoken. DO NOT abbreviate, summarize, or shorten.
2. **Corrections Allowed**: DO correct spelling, grammar, and medical terminology for clarity.
3. **No Abbreviations**: Never use abbreviations (e.g., write "Patient" not "Pt", "Antécédents" not "ATCD").
4. If the user dictates content, generate a FILL action with the corrected full text for the most likely field based on 'availableFields'.
5. **Navigation Keywords**: If the user says ANY of these words, generate a NAVIGATE action:
   - For NEXT: "suivant", "next", "suite", "passe", "après", "continue"
   - For PREV: "précédent", "previous", "retour", "avant", "back"
6. Return ONLY JSON.

Example Input 1 (Content):
Context: Step 1
Transcript: "le patient il a dit qu'il est anxieux et il a mal dormi"

Example Output 1:
{
  "actions": [
    { "type": "FILL", "field": "motif", "value": "Le patient a dit qu'il est anxieux et qu'il a mal dormi." }
  ]
}

Example Input 2 (Navigation):
Context: Step 1
Transcript: "suivant"

Example Output 2:
{
  "actions": [
    { "type": "NAVIGATE", "target": "NEXT" }
  ]
}
`;

export async function processVoiceCommand(formData: FormData, context: FormContext): Promise<VoicePilotResponse> {
    const file = formData.get('file') as File;

    if (!file) {
        console.error("❌ Voice Pilot: No file uploaded");
        return { transcript: "", actions: [], error: "No audio file uploaded" };
    }

    try {
        console.log(`🎤 Voice Pilot: Processing Audio (${file.size} bytes)`);
        console.log(`Context Step: ${context.currentStep}`);

        // 1. Transcription (Whisper)
        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3",
            response_format: "json",
            temperature: 0.0,
            language: "fr"
        });

        const transcript = transcription.text;
        console.log("📝 Voice Pilot Transcript:", transcript);

        if (!transcript.trim()) {
            console.warn("⚠️ Empty transcript");
            return { transcript: "", actions: [] };
        }

        // 2. Interpretation (Llama 3)
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Context: Step ${context.currentStep}. Available Fields: ${JSON.stringify(context.availableFields)}.\nTranscript: "${transcript}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.1, // Low temp for precision
        });

        const jsonResponse = completion.choices[0]?.message?.content;
        console.log("🤖 Llama Response:", jsonResponse);

        if (!jsonResponse) {
            throw new Error("Empty response from AI Pilot");
        }

        const parsed = JSON.parse(jsonResponse);
        console.log("✅ Parsed Actions:", parsed.actions);

        return {
            transcript,
            actions: parsed.actions || []
        };

    } catch (error: any) {
        console.error("Voice Pilot Error:", error);
        return {
            transcript: "",
            actions: [],
            error: error.message || "Unknown error"
        };
    }
}
