'use server'

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Scrape les médicaments psychiatriques depuis medicament.ma
 * Note: Utilise fetch + parsing manuel (regex) car cheerio n'est pas installé
 */
export async function scrapePsychiatricMedicines() {
    console.log("🚀 Démarrage du scraping psychiatrique...");
    
    // Catégories cibles: Psycholeptiques et Psychoanaleptiques
    const categories = ['psycholeptiques', 'psychoanaleptiques'];
    let totalAdded = 0;

    for (const cat of categories) {
        const url = `https://medicament.ma/category/${cat}/`;
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Extraction grossière des liens de médicaments
            // Structure: <a href="https://medicament.ma/medicament/nom-du-medoc/">...</a>
            const medLinks = html.match(/https:\/\/medicament\.ma\/medicament\/[a-z0-9-]+\//g) || [];
            const uniqueLinks = Array.from(new Set(medLinks));

            console.log(`🔍 Trouvé ${uniqueLinks.length} liens pour ${cat}`);

            for (const link of uniqueLinks) {
                try {
                    const medResponse = await fetch(link);
                    const medHtml = await medResponse.text();

                    // Parsing des détails (Basé sur l'exploration du subagent)
                    const extractField = (title: string) => {
                        const regex = new RegExp(`<h4>${title}<\/h4>\\s*<p>([^<]+)<\/p>`, 'i');
                        const match = medHtml.match(regex);
                        return match ? match[1].trim() : null;
                    };

                    const name = medHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
                    if (!name) continue;

                    const dci = extractField('Composition');
                    const forme = extractField('Présentation');
                    const dosage = extractField('Dosage');
                    const classe = extractField('Classe thérapeutique');
                    const prixStr = extractField('PPV');
                    const prix = prixStr ? parseFloat(prixStr.replace(/[^0-9.]/g, '')) : null;

                    // Insertion dans Supabase
                    const { error } = await supabase
                        .from('pa_medicaments')
                        .upsert({
                            nom: name,
                            dci: dci,
                            forme: forme,
                            dosage: dosage,
                            classe: classe,
                            prix: prix,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'nom' });

                    if (!error) {
                        totalAdded++;
                        console.log(`✅ Ajouté: ${name}`);
                    }
                } catch (e) {
                    console.error(`❌ Erreur sur le lien ${link}:`, e);
                }
            }
        } catch (e) {
            console.error(`❌ Erreur sur la catégorie ${cat}:`, e);
        }
    }

    return { success: true, count: totalAdded };
}

/**
 * Recherche un médicament dans la base locale
 */
export async function searchMedicaments(query: string) {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('pa_medicaments')
        .select('*')
        .or(`nom.ilike.%${query}%,dci.ilike.%${query}%`)
        .limit(5);

    if (error) {
        console.error("Erreur recherche médicaments:", error);
        return [];
    }

    return data;
}

/**
 * Importe et enrichit une liste de médicaments fournie par l'utilisateur
 */
export async function importUserMedications(rawList: string) {
    const lines = rawList.split('\n').filter(l => l.trim().length > 5);
    let totalProcessed = 0;

    for (const line of lines) {
        // Extraction du nom (première partie avant tabulation ou gros espace)
        const query = line.split('\t')[0].trim() || line.split('  ')[0].trim();
        if (!query || query.length < 3) continue;

        try {
            // Recherche du lien direct sur le site
            const searchUrl = `https://medicament.ma/?s=${encodeURIComponent(query)}&post_type=medicament`;
            const searchRes = await fetch(searchUrl);
            const searchHtml = await searchRes.text();
            
            const linkMatch = searchHtml.match(/https:\/\/medicament\.ma\/medicament\/[a-z0-9-]+\//);
            
            let medData: any = { nom: query, updated_at: new Date().toISOString() };

            if (linkMatch) {
                const medRes = await fetch(linkMatch[0]);
                const medHtml = await medRes.text();

                const extract = (title: string) => {
                    const regex = new RegExp(`<h4>${title}<\/h4>\\s*<p>([^<]+)<\/p>`, 'i');
                    const m = medHtml.match(regex);
                    return m ? m[1].trim() : null;
                };

                medData = {
                    nom: medHtml.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim() || query,
                    dci: extract('Composition'),
                    forme: extract('Présentation'),
                    dosage: extract('Dosage'),
                    classe: extract('Classe thérapeutique'),
                    prix: extract('PPV') ? parseFloat(extract('PPV')!.replace(/[^0-9.]/g, '')) : null,
                    updated_at: new Date().toISOString()
                };
            }

            const { error } = await supabase
                .from('pa_medicaments')
                .upsert(medData, { onConflict: 'nom' });

            if (!error) totalProcessed++;
            
            // Petit délai pour ne pas saturer le site distant
            await new Promise(r => setTimeout(r, 200));

        } catch (e) {
            console.error(`Erreur import ${query}:`, e);
        }
    }

    return { success: true, count: totalProcessed };
}
