const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

console.log("🔍 DIAGNOSTIC MEDNOTE AI : Connexion Google Gemini");
console.log("-----------------------------------------------");

// 1. Chargement de la clé API
let apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            const match = envConfig.match(/GOOGLE_API_KEY=(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim().replace(/^["']|["']$/g, '');
            }
        }
    } catch (e) { }
}

if (!apiKey) {
    console.error("❌ ERREUR : Clé API introuvable dans .env.local");
    process.exit(1);
}

console.log(`🔑 Clé API détectée : ${apiKey.substring(0, 4)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    process.stdout.write(`⏳ Test du modèle '${modelName}'... `);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Test");
        console.log("✅ OK");
        return true;
    } catch (error) {
        console.log("❌ ÉCHEC");
        if (error.message.includes("404")) {
            console.error(`   -> Erreur 404 : Le modèle n'est pas activé ou indisponible pour cette clé.`);
        } else if (error.message.includes("400") || error.message.includes("API key")) {
            console.error(`   -> Erreur 400 : Clé API invalide.`);
        } else {
            console.error(`   -> Erreur : ${error.message}`);
        }
        return false;
    }
}

async function run() {
    const pro = await testModel("gemini-pro");
    const flash = await testModel("gemini-1.5-flash");

    console.log("\n-----------------------------------------------");
    if (!pro && !flash) {
        console.log("🚫 DIAGNOSTIC : ACCÈS REFUSÉ (404)");
        console.log("Votre code est bon, mais Google bloque l'accès.");
        console.log("\nSOLUTIONS :");
        console.log("1. Allez sur : https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
        console.log("   👉 Vérifiez que 'Generative Language API' est ACTIVÉE.");
        console.log("2. Si vous êtes en Europe, activez un compte de facturation (même gratuit) sur votre projet.");
        console.log("3. Générez une nouvelle clé API sur : https://aistudio.google.com/app/apikey");
    } else {
        console.log("✅ TOUT FONCTIONNE ! Vous pouvez utiliser l'application.");
    }
}

run();
