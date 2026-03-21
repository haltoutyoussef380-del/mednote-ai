'use server'

import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

/**
 * Fonction RAG : Interroge l'IA avec le contexte du patient
 */
export async function chatWithPatientData(patientId: string, question: string) {
    const supabase = await createClient()

    // 1. Verification Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Non authentifié")

    // 2. Récupération Données Patient
    const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

    if (!patient) throw new Error("Patient introuvable")

    // 3. Récupération Historique Notes (Limité aux 10 dernières pour le contexte)
    const { data: notes } = await supabase
        .from('notes')
        .select('created_at, content, type')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10)

// 4. Helper pour formater le contenu des notes (Gère JSON et Texte)
    const formatNoteContent = (content: any): string => {
        if (!content) return "Pas de contenu.";
        if (typeof content === 'string') return content;
        
        // Si c'est le nouveau format structuré (ObservationData)
        try {
            const parts = [];
            if (content.motif) parts.push(`Motif: ${content.motif}`);
            if (content.antecedents) {
                const ant = content.antecedents;
                if (ant.details || ant.familiaux) {
                    parts.push(`Antécédents: ${ant.details || ''} ${ant.familiaux ? '(Famille: ' + ant.familiaux + ')' : ''}`);
                }
            }
            if (content.histoire) parts.push(`Histoire: ${content.histoire}`);
            if (content.conclusion) parts.push(`Conclusion: ${content.conclusion}`);
            if (content.diagnostic) parts.push(`Diagnostic: ${content.diagnostic}`);
            if (content.prochain_rdv) parts.push(`Prochain RDV: ${content.prochain_rdv}`);
            
            if (content.prescriptions && Array.isArray(content.prescriptions)) {
                const meds = content.prescriptions.map((p: any) => `- ${p.nom} ${p.dosage || ''} (${p.frequence || ''})`).join('\n');
                if (meds) parts.push(`Prescriptions:\n${meds}`);
            }

            return parts.length > 0 ? parts.join('\n') : JSON.stringify(content);
        } catch (e) {
            return typeof content === 'object' ? JSON.stringify(content) : String(content);
        }
    };

    // 5. Construction du Contexte
    const contextString = `
    PATIENT: ${patient.first_name} ${patient.last_name} (${patient.gender}, né le ${patient.birth_date})
    MATRICULE: ${patient.matricule || 'N/A'}
    CINE: ${patient.cine || 'N/A'}
    VILLE: ${patient.city || 'N/A'}
    
    HISTORIQUE MEDICAL (Du plus récent au plus ancien) :
    ${notes?.map(n => {
        const date = new Date(n.created_at).toLocaleDateString();
        const formattedContent = formatNoteContent(n.content);
        return `- [${date}] (${n.type}) :\n${formattedContent}`;
    }).join('\n\n') || "Aucune note disponible."}
    `

    // 5. Appel LLM
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es un Assistant Médical Intelligent intégré au dossier du Dr.
                    Ton objectif est d'aider le médecin en répondant à ses questions sur LE PATIENT ACTUEL uniquement.
                    
                    RÈGLES:
                    - Base tes réponses STRICTEMENT sur le contexte fourni ci-dessous.
                    - Si l'info n'est pas dans le contexte, dis "Je ne trouve pas cette information dans le dossier."
                    - Sois synthétique, professionnel et précis (style médical).
                    - Si on te demande un résumé, fais une synthèse chronologique.
                    
                    CONTEXTE DOSSIER PATIENT :
                    ${contextString}`
                },
                {
                    role: "user",
                    content: question
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Très factuel pour éviter les hallucinations
        })

        return {
            success: true,
            response: completion.choices[0]?.message?.content || "Pas de réponse."
        }

    } catch (error: any) {
        console.error("Erreur Chat RAG:", error)
        return { success: false, error: "Erreur IA: " + error.message }
    }
}
