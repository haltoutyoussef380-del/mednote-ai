const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'env manuellement
const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateInitial() {
    console.log("💊 Peuplement initial des médicaments psychiatriques...");

    const initialMeds = [
        { nom: "HALDOL 5 MG", dci: "HALOPERIDOL", forme: "Comprimé", dosage: "5 mg", classe: "Neuroleptique / Psycholeptique" },
        { nom: "RISPERDAL 1 MG", dci: "RISPERIDONE", forme: "Comprimé pelliculé", dosage: "1 mg", classe: "Antipsychotique" },
        { nom: "VALIUM 10 MG", dci: "DIAZEPAM", forme: "Comprimé", dosage: "10 mg", classe: "Anxiolytique / Psycholeptique" },
        { nom: "PROZAC 20 MG", dci: "FLUOXETINE", forme: "Gélule", dosage: "20 mg", classe: "Antidépresseur / Psychoanaleptique" },
        { nom: "TERCIAN 25 MG", dci: "CYAMEMAZINE", forme: "Comprimé pelliculé", dosage: "25 mg", classe: "Neuroleptique / Psycholeptique" },
        { nom: "XANAX 0.50 MG", dci: "ALPRAZOLAM", forme: "Comprimé", dosage: "0.50 mg", classe: "Anxiolytique" },
        { nom: "LAROXYL 25 MG", dci: "AMITRIPTYLINE", forme: "Comprimé", dosage: "25 mg", classe: "Antidépresseur" }
    ];

    for (const med of initialMeds) {
        const { error } = await supabase
            .from('pa_medicaments')
            .upsert(med, { onConflict: 'nom' });
        
        if (error) {
            console.error(`❌ Erreur pour ${med.nom}:`, error.message);
        } else {
            console.log(`✅ ${med.nom} ajouté.`);
        }
    }

    console.log("✨ Terminé !");
}

populateInitial();
