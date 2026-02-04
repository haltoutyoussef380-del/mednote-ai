'use server'

import { generateMedicalSummary } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function structureNoteWithAI(rawText: string) {
    return await generateMedicalSummary(rawText)
}

/**
 * STRUCTURE SOIN INFIRMIER VIA AI (Magic Dictée)
 */
export async function structureNurseCareWithAI(rawText: string) {
    if (!rawText) return null

    try {
        const { default: Groq } = await import('groq-sdk')
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es une IA experte en structuration de soins infirmiers.
                    Transforme la dictée vocale en objet JSON strict pour le formulaire.
                    
                    SCHEMA JSON ATTENDU:
                    {
                        "constantes": {
                            "tension": "string (ex: 12/8) ou vide",
                            "pouls": "string (ex: 72) ou vide",
                            "temperature": "string (ex: 37.5) ou vide",
                            "saturation": "string (ex: 98) ou vide",
                            "poids": "string (ex: 70) ou vide"
                        },
                        "traitement": {
                            "distribution": boolean (true si "traitement donné/pris"),
                            "refus": boolean (true si "refus de soin/traitement"),
                            "si_besoin": "string (ex: doliprane donné) ou vide"
                        },
                        "observation": "string (résumé de l'observation) ou vide",
                        "incident": boolean (true si mention d'agitation, violence, fugue...)
                    }
                    
                    RÉPOND UNIQUEMENT LE JSON.`
                },
                {
                    role: "user",
                    content: rawText
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" }
        })

        return JSON.parse(completion.choices[0].message.content || "{}")
    } catch (error) {
        console.error("AI Structure Error:", error)
        return null
    }
}

export async function createNote(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log('--- createNote Server Action Started ---');

    if (!user) {
        console.log('Error: No user found');
        redirect('/login')
    }
    console.log('User ID:', user.id);

    // Verify Profile Exists (Fix for FK Violation if trigger failed)
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (!profile) {
        console.warn('Profile missing for user. Attempting self-repair...');
        // Note: This might fail if RLS for INSERT is not enabled for users, but it's worth a try.
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User'
        });
        if (profileError) console.error('Profile Repair Failed:', profileError);
    }

    const patientId = formData.get('patient_id') as string
    const contentText = formData.get('content') as string

    console.log('Patient ID:', patientId);
    console.log('Content Raw (First 50 chars):', contentText?.substring(0, 50));

    // Dans le nouveau workflow, le texte reçu ici EST DÉJÀ structuré et validé par le médecin/l'utilisateur.
    // On ne rappelle pas l'IA pour générer un résumé. On stocke le résultat validé.

    let contentJson;
    try {
        contentJson = JSON.parse(contentText);
        console.log('JSON Parse Success');
    } catch (e) {
        console.error('JSON Parse Error:', e);
        // Fallback for legacy text notes
        contentJson = { text: contentText };
    }

    const rawData = {
        patient_id: patientId,
        user_id: user.id,
        type: formData.get('type') as string,
        content: contentJson, // Storing real JSON object
        ai_summary: contentJson.diagnostic || contentJson.diagnosis || null, // Corrected key and fallback
    }

    const { error } = await supabase.from('notes').insert(rawData)

    if (error) {
        console.error('Supabase Insert Error:', error);
    } else {
        console.log('Supabase Insert Success');
    }

    if (!error) {
        // Simulation envoi email
        const { sendEmailSimulation } = await import('@/lib/email')
        await sendEmailSimulation(
            user.email || 'doctor@mednote.ai',
            `Nouvelle note structurée (Patient ${patientId})`,
            `La note a été validée et enregistrée.\nDébut du contenu: ${contentText.substring(0, 100)}...`
        )
    }

    if (error) {
        console.error('Error creating note:', error)
        return { error: error.message, status: 'error' }
    }

    revalidatePath(`/dashboard/patients/${patientId}`)
    redirect(`/dashboard/patients/${patientId}`)
}
