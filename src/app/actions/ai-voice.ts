'use server'

import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Corrige automatiquement les espaces, la grammaire et la ponctuation
 * d'un texte dicté en français médical
 */
export async function correctMedicalText(rawText: string): Promise<string> {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Tu es un correcteur médical expert en français. 
Ton rôle est de corriger UNIQUEMENT :
- Les espaces incorrects (ex: "le  pat ient" → "le patient")
- La ponctuation manquante
- Les majuscules en début de phrase
- Les fautes de frappe évidentes

IMPORTANT :
- Ne modifie PAS le vocabulaire médical
- Ne change PAS le sens
- Ne résume PAS
- Garde TOUS les détails médicaux
- Retourne UNIQUEMENT le texte corrigé, sans commentaire`
                },
                {
                    role: "user",
                    content: rawText
                }
            ],
            temperature: 0.1,
            max_tokens: 1000
        });

        return response.choices[0]?.message?.content?.trim() || rawText;
    } catch (error) {
        console.error("Erreur correction texte:", error);
        return rawText; // Retourne le texte original en cas d'erreur
    }
}

/**
 * Détecte quelle option de dropdown l'utilisateur veut sélectionner
 */
export async function detectDropdownSelection(
    transcript: string,
    options: string[]
): Promise<string | null> {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant médical. L'utilisateur dicte et mentionne un type d'antécédent.
Détecte quelle option il veut sélectionner parmi : ${options.join(', ')}

Règles :
- Si tu détectes une option, réponds UNIQUEMENT avec l'option exacte (ex: "Psychiatriques")
- Si aucune option ne correspond, réponds "NONE"
- Ne réponds RIEN d'autre`
                },
                {
                    role: "user",
                    content: transcript
                }
            ],
            temperature: 0.1,
            max_tokens: 50
        });

        const detected = response.choices[0]?.message?.content?.trim() || "NONE";
        return options.includes(detected) ? detected : null;
    } catch (error) {
        console.error("Erreur détection dropdown:", error);
        return null;
    }
}

/**
 * Route intelligemment la dictée dans la section Antécédents
 * Comprend la hiérarchie: Personnels (type + détails) vs Familiaux (détails)
 */
export async function routeAntecedentsText(transcript: string): Promise<{
    category: 'personnels' | 'familiaux';
    type?: string;
    details: string;
}> {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant médical expert. Le médecin dicte des antécédents.

STRUCTURE:
1. Antécédents PERSONNELS → Type (Psychiatriques/Médicaux & Chirurgicaux/Addictives/Juridiques) + Détails
2. Antécédents FAMILIAUX → Détails uniquement

RÈGLES DE DÉTECTION:

Si le médecin mentionne:
- "psychiatrique", "dépression", "anxiété", "schizophrénie", "bipolaire", "psychose" → PERSONNELS type Psychiatriques
- "médical", "chirurgical", "diabète", "hypertension", "opération", "cancer", "cardiaque" → PERSONNELS type Médicaux & Chirurgicaux
- "addiction", "alcool", "drogue", "tabac", "dépendance", "toxicomanie" → PERSONNELS type Addictives
- "juridique", "légal", "judiciaire", "prison", "condamnation" → PERSONNELS type Juridiques
- "familial", "famille", "père", "mère", "frère", "soeur", "parent", "grand-père", "oncle", "tante" → FAMILIAUX

RÉPONSE FORMAT JSON:
{
    "category": "personnels" | "familiaux",
    "type": "Psychiatriques" | "Médicaux & Chirurgicaux" | "Addictives" | "Juridiques" | null,
    "details": "texte complet de la dictée"
}

EXEMPLES:

Input: "Antécédents psychiatriques, dépression depuis 2020"
Output: {"category": "personnels", "type": "Psychiatriques", "details": "Dépression depuis 2020"}

Input: "Le père a eu un cancer"
Output: {"category": "familiaux", "type": null, "details": "Le père a eu un cancer"}

Input: "Diabète type 2, opération de l'appendicite en 2015"
Output: {"category": "personnels", "type": "Médicaux & Chirurgicaux", "details": "Diabète type 2, opération de l'appendicite en 2015"}

RÉPONDS UNIQUEMENT LE JSON.`
                },
                {
                    role: "user",
                    content: transcript
                }
            ],
            temperature: 0.2,
            max_tokens: 200,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0]?.message?.content || '{"category": "personnels", "details": ""}');

        return {
            category: result.category || 'personnels',
            type: result.type,
            details: result.details || transcript
        };
    } catch (error) {
        console.error("Erreur routing antécédents:", error);
        return {
            category: 'personnels',
            details: transcript
        };
    }
}

const NAVIGATION_PROMPT = `Tu es un assistant médical intelligent pour un formulaire d'observation psychiatrique.

Le formulaire a ces champs :
10. suivi - Suivi médical
11. prescriptions - Prescription structurée (Médicament, Dosage, Fréquence, Durée)
12. prochain_rdv - Date ou délai du prochain rendez-vous
13. examen.presentation - Présentation du patient
14. examen.contact - Qualité du contact (Facile, Familier, Réticent, Méfiant, Oppositionnel)
15. examen.humeur - Humeur et affect (Euthymique, Dépressive, Expansive, Irritable, Anxieuse)
16. examen.pensee - Cours et contenu de la pensée (Fluide, Ralentie, Accélérée, Logorrhée, Délirante)
17. examen.cognition - Fonctions cognitives (Vigilance normale, Obnubilation, Désorienté, Attention diminuée)
18. examen - Examen psychiatrique (Résumé général)

Analyse la dictée et détermine :
1. Dans quel champ mettre le texte
2. Si c'est une sélection de dropdown (antecedents.type)
3. Le texte corrigé (espaces, ponctuation)
4. EXCLUSIF : Si l'utilisateur mentionne un prochain rendez-vous (ex: "prochain RDV dans 15 jours", "à revoir le 20 mai", "RDV le mois prochain"), extrais cette information.

Règles pour prescriptions :
- Si le médecin dit "Prescription", "Ordonnance", "Je prescris", "Prendre", utilise le champ "prescriptions".
- Tente d'extraire les détails : nom, dosage, frequence, duree.
- Si des détails manquent, laisse-les vides.

Réponds UNIQUEMENT en JSON valide :
{
  "field": "nom_du_champ",
  "value": "texte corrigé pour affichage général",
  "dropdownSelection": "option" (optionnel),
  "prochain_rdv": "date ou délai extrait" (optionnel),
  "prescription": {
    "nom": "string",
    "dosage": "string",
    "frequence": "string",
    "duree": "string"
  } (seulement si le champ est 'prescriptions')
}`;

/**
 * Récupère le prompt de navigation pour l'affichage
 */
export async function getNavigationPrompt() {
    return NAVIGATION_PROMPT;
}

/**
 * Route intelligemment le texte dicté vers le bon champ
 */
export async function routeTranscriptToField(
    transcript: string,
    currentData: any
): Promise<{
    field: string;
    value: string;
    dropdownSelection?: string;
}> {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: NAVIGATION_PROMPT
                },
                {
                    role: "user",
                    content: `Dictée: "${transcript}"\n\nDonnées actuelles:\n${JSON.stringify(currentData, null, 2)}`
                }
            ],
            temperature: 0.2,
            max_tokens: 500
        });

        const content = response.choices[0]?.message?.content?.trim() || "";

        // Extraire le JSON de la réponse
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // Fallback : retourner le texte dans le champ motif par défaut
        return {
            field: "motif",
            value: transcript
        };
    } catch (error) {
        console.error("Erreur routage intelligent:", error);
        return {
            field: "motif",
            value: transcript
        };
    }
}

/**
 * Détecte le type de commande vocale et extrait les informations pertinentes
 */
export async function detectVoiceCommand(transcript: string): Promise<{
    type: 'navigation' | 'dropdown' | 'action' | 'dictation';
    target?: string;
    value?: string;
    action?: 'clear' | 'correct' | 'delete';
}> {
    const lowerTranscript = transcript.toLowerCase().trim();

    // ACTIONS ON FIELDS - Check first for field manipulation commands
    if (lowerTranscript.includes('vider') ||
        lowerTranscript.includes('effacer') ||
        lowerTranscript.includes('supprimer')) {
        return { type: 'action', action: 'clear' };
    }

    if (lowerTranscript.includes('correction') ||
        lowerTranscript.includes('corriger')) {
        return { type: 'action', action: 'correct' };
    }

    // NAVIGATION - Only trigger if keyword is used as a command, not in dictation
    // Check for navigation phrases like "passer à", "aller à", "retour à", or standalone section names
    const isNavigationCommand =
        lowerTranscript.startsWith('passer') ||
        lowerTranscript.startsWith('aller') ||
        lowerTranscript.startsWith('retour') ||
        lowerTranscript.startsWith('section') ||
        lowerTranscript.includes('passer à') ||
        lowerTranscript.includes('passer au') ||
        lowerTranscript.includes('passer aux') ||
        lowerTranscript.includes('aller à') ||
        lowerTranscript.includes('aller au') ||
        lowerTranscript.includes('aller aux') ||
        lowerTranscript.includes('retour à') ||
        lowerTranscript.includes('retour au') ||
        lowerTranscript.includes('retour aux');

    if (isNavigationCommand) {
        // Check for sub-field navigation first (more specific)
        if (lowerTranscript.includes('familiaux') || lowerTranscript.includes('familial')) {
            return { type: 'navigation', target: 'antecedents.familiaux' };
        }
        if (lowerTranscript.includes('détails') && lowerTranscript.includes('antécédent')) {
            return { type: 'navigation', target: 'antecedents.details' };
        }

        const navMap: Record<string, string> = {
            'motif': 'motif',
            'antécédent': 'antecedents',
            'biographie': 'biographie',
            'histoire': 'histoire',
            'examen': 'examen',
            'présentation': 'examen.presentation',
            'contact': 'examen.contact',
            'humeur': 'examen.humeur',
            'pensée': 'examen.pensee',
            'cognition': 'examen.cognition',
            'conclusion': 'conclusion',
            'diagnostic': 'diagnostic',
            'suivi': 'suivi',
            'prescriptions': 'prescriptions',
            'ordonnance': 'prescriptions',
            'prescription': 'prescriptions'
        };

        for (const [keyword, target] of Object.entries(navMap)) {
            if (lowerTranscript.includes(keyword)) {
                return { type: 'navigation', target };
            }
        }
    }

    // DROPDOWN
    if (lowerTranscript.includes('type') || lowerTranscript.includes('psychiatrique') || lowerTranscript.includes('médical')) {
        const dropMap: Record<string, string> = {
            'psychiatrique': 'Psychiatriques',
            'médical': 'Médicaux & Chirurgicaux',
            'addictif': 'Addictives',
            'juridique': 'Juridiques'
        };

        for (const [keyword, value] of Object.entries(dropMap)) {
            if (lowerTranscript.includes(keyword)) {
                return { type: 'dropdown', target: 'antecedents.type', value };
            }
        }
    }

    return { type: 'dictation', value: transcript };
}

/**
 * Convertit un texte de délai (ex: "dans 15 jours", "le 20 mai") en date ISO YYYY-MM-DD
 */
export async function parseRelativeDate(text: string): Promise<string | null> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `Tu es un expert en traitement de dates. 
                    Aujourd'hui nous sommes le ${today}.
                    Convertis le texte suivant en une date au format YYYY-MM-DD.
                    
                    Règles :
                    - Réponds UNIQUEMENT avec la date au format YYYY-MM-DD.
                    - Si le texte est vague (ex: "prochainement"), estime une date logique (ex: dans 1 mois).
                    - Si aucune date n'est trouvable, réponds "NULL".`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0,
            max_tokens: 20
        });

        const result = response.choices[0]?.message?.content?.trim() || "NULL";
        return result === "NULL" ? null : result;
    } catch (error) {
        console.error("Erreur parsing date:", error);
        return null;
    }
}
