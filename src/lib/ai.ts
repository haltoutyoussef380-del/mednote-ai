import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateMedicalSummary(text: string): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant expert en psychiatrie.
      Ta tâche est de structurer une dictée médicale brute en un dossier psychiatrique complet au format JSON STRICT.
      
      Champs requis (JSON) :
      {
        "chief_complaint": "Motif de consultation (court)",
        "history": "Histoire de la maladie / Antécédents évoqués",
        "mse": {
            "appearance": "Apparence, hygiène, contact",
            "mood": "Humeur et Affect",
            "thought": "Cours et contenu de la pensée (délire ?)",
            "perception": "Hallucinations/Illusions",
            "cognition": "Orientation, Mémoire, Jugement",
            "insight": "Conscience des troubles"
        },
        "diagnosis": "Hypothèses diagnostiques (DSM-5)",
        "plan": "Traitement et Conduite à tenir"
      }
      
      Si une info est manquante, mets "Non renseigné" ou infère-la prudemment du contexte. Rester factuel.`
                },
                {
                    role: "user",
                    content: `Voici la dictée brute : "${text}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Lower temp for JSON consistency
            response_format: { type: "json_object" }
        });

        // Return the JSON string directly (UI will parse it)
        return completion.choices[0]?.message?.content || "{}";
    } catch (error) {
        console.error("Error generating summary:", error);
        return JSON.stringify({ error: "Erreur IA", raw_text: text });
    }
}

export async function extractPatientInfo(text: string): Promise<{ success: boolean, data?: any, error?: string, raw?: string }> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es un expert en extraction de données médicales à partir de dictées orales bruitées.
      Ton but est d'extraire les infos patient en JSON strict.
      
      Règles de correction :
      - "Sète" / "Set" -> 7
      - "H a l t o i t" -> "Haltoit"
      - "Hanthat" / "Hant" -> "hotmail"
      - "A toute" / "Toute" -> "Atout" (Nom de famille)
      - Si conflit Genre/Nom, priorité au bon sens.

      Format de sortie attendu (JSON uniquement) :
      {
        "first_name": "string",
        "last_name": "string",
        "birth_date": "YYYY-MM-DD",
        "gender": "M" | "F",
        "email": "string",
        "phone": "string"
      }`
                },
                {
                    role: "user",
                    content: `Voici la dictée : "${text}"`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Low temp for extraction precision
            response_format: { type: "json_object" } // Force JSON mode if supported (Llama 3 usually respects it well)
        });

        const textResponse = completion.choices[0]?.message?.content || "";
        console.log("Groq Raw Response:", textResponse);

        // Regex fallback just in case Llama chats a bit
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return { success: false, error: "No JSON found in response", raw: textResponse };
        }

        const jsonString = jsonMatch[0];
        try {
            const data = JSON.parse(jsonString);
            return { success: true, data };
        } catch (parseError: any) {
            return { success: false, error: "JSON Parse Error: " + parseError.message, raw: jsonString };
        }

    } catch (error: any) {
        console.error("Error extracting info:", error);
        return { success: false, error: "Groq Error: " + error.message };
    }
}
