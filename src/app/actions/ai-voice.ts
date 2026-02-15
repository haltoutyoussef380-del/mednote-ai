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
                    content: `Tu es un assistant médical intelligent pour un formulaire d'observation psychiatrique.

Le formulaire a ces champs :
1. motif - Motif de consultation
2. antecedents.type - Type (Psychiatriques, Médicaux & Chirurgicaux, Addictives, Juridiques)
3. antecedents.details - Détails antécédents personnels
4. antecedents.familiaux - Antécédents familiaux
5. biographie - Histoire de vie
6. histoire - Histoire de la maladie
7. examen.* - Examen psychiatrique (presentation, langage, perception, affect, comportement, instinct, jugement, cognition, physique)
8. conclusion - Synthèse clinique
9. diagnostic - Diagnostic principal
10. suivi - Suivi médical

Analyse la dictée et détermine :
1. Dans quel champ mettre le texte
2. Si c'est une sélection de dropdown (antecedents.type)
3. Le texte corrigé (espaces, ponctuation)

Réponds UNIQUEMENT en JSON valide :
{
  "field": "nom_du_champ",
  "value": "texte corrigé",
  "dropdownSelection": "option" (optionnel)
}`
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
            'conclusion': 'conclusion',
            'diagnostic': 'diagnostic',
            'suivi': 'suivi'
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
