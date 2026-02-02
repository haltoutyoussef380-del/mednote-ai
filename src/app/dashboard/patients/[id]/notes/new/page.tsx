'use client'

import { useState, use, useEffect, useRef } from 'react'
import { createNote } from '@/app/dashboard/notes/actions'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { DictationArea } from '@/components/audio/DictationArea'

// --- STRUCTURE DE DONNÉES ---
interface ObservationData {
    // 1. Motif
    motif: string;

    // 2. Antécédents
    antecedents: {
        personnels: string[]; // (Legacy/Unused)
        familiaux: string;    // Zone de texte
        type: string;         // Select (Médicaux, Chirurgicaux...)
        details: string;      // Zone de texte
    };

    // 3. Biographie
    biographie: string;

    // 4. Histoire Maladie
    histoire: string;

    // 5. Examen Psychiatrique (9 sous-titres)
    examen: {
        presentation: string;
        langage: string;
        perception: string;
        affect: string;
        comportement: string;
        instinct: string;
        jugement: string;
        cognition: string; // Attention, mémoire...
        physique: string;
    };

    // 6. Conclusion
    conclusion: string;

    // 7. Diagnostic
    diagnostic: string;

    // 8. Suivi
    suivi: string;
}

const INITIAL_DATA: ObservationData = {
    motif: '',
    antecedents: {
        personnels: [],
        familiaux: '',
        type: 'Médicaux & Chirurgicaux',
        details: ''
    },
    biographie: '',
    histoire: '',
    examen: {
        presentation: '',
        langage: '',
        perception: '',
        affect: '',
        comportement: '',
        instinct: '',
        jugement: '',
        cognition: '',
        physique: ''
    },
    conclusion: '',
    diagnostic: '',
    suivi: ''
};

// --- OPTIONS POUR STEP 2 ---
// --- OPTIONS POUR STEP 2 ---
const ANTECEDENT_TYPES = ['Médicaux & Chirurgicaux', 'Psychiatriques', 'Addictives', 'Juridiques'];
// const CHECKBOX_OPTIONS_FAM = ['Schizophrénie', 'Troubles Bipolaires', 'Suicide', 'Addictions', 'Dépression']; // REMOVED

const EXAMEN_FIELDS = [
    'presentation', 'langage', 'perception', 'affect',
    'comportement', 'instinct', 'jugement', 'cognition', 'physique'
] as const;

export default function NewObservationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [step, setStep] = useState(1);
    const [activeSubField, setActiveSubField] = useState<string>('presentation'); // Pour l'étape 5
    const [data, setData] = useState<ObservationData>(INITIAL_DATA);

    // Voix (Global Control)
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();
    const [lastProcessedLength, setLastProcessedLength] = useState(0);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const nextStep = () => {
        setStep(s => Math.min(s + 1, 8));
        // Reset subfield si on arrive sur l'étape 5
        if (step === 4) setActiveSubField('presentation');
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    // --- REF PERMETTANT D'ACCÉDER À DATA DANS L'EFFECT SANS LE DÉCLENCHER ---
    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    // --- LOGIQUE MAINS-LIBRES ---
    useEffect(() => {
        // 1. Gestion du Reset du Transcript
        if (transcript.length < lastProcessedLength) {
            setLastProcessedLength(0);
        }

        if (!isListening || !transcript) return;

        const newPart = transcript.slice(lastProcessedLength);
        if (!newPart) return;

        const lowerPart = newPart.toLowerCase().replace(/[.,;:!?]/g, "").trim();
        if (!lowerPart) return;

        // --- 1. GESTION DES COMMANDES ---

        // STOP / PAUSE
        if (lowerPart.endsWith("stop") || lowerPart.endsWith("arrête") || lowerPart.endsWith("pause")) {
            stopListening();
            setLastProcessedLength(transcript.length);
            return;
        }

        // SAUVEGARDER / TERMINER
        if (lowerPart.includes("enregistrer") || lowerPart.includes("sauvegarder") || lowerPart.includes("terminer la note")) {
            stopListening();
            // Création FormData pour server action
            const formData = new FormData();
            formData.append('patient_id', id);
            formData.append('content', JSON.stringify(dataRef.current));
            formData.append('type', 'Observation Psychiatrique');

            // Appel Server Action (Redirection gérée par le serveur)
            createNote(formData);
            return;
        }

        // EFFACER (Tout le champ)
        if (lowerPart.endsWith("effacer") || lowerPart.endsWith("effacer tout") || lowerPart.endsWith("recommencer")) {
            // Identifier le champ actif pour le vider
            let fieldToClear = '';
            if (step === 1) fieldToClear = 'motif';
            if (step === 2) fieldToClear = 'antecedents.details';
            if (step === 3) fieldToClear = 'biographie';
            if (step === 4) fieldToClear = 'histoire';
            if (step === 5) fieldToClear = `examen.${activeSubField}`;
            if (step === 6) fieldToClear = 'conclusion';
            if (step === 7) fieldToClear = 'diagnostic';
            if (step === 8) fieldToClear = 'suivi';

            if (fieldToClear) {
                if (fieldToClear.includes('.')) {
                    const [parent, child] = fieldToClear.split('.');
                    // @ts-ignore
                    setData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: "" } }));
                } else {
                    // @ts-ignore
                    setData(prev => ({ ...prev, [fieldToClear]: "" }));
                }
            }

            setLastProcessedLength(transcript.length);
            return;
        }

        // NAVIGATION : SUIVANT
        if (lowerPart.endsWith("suivant") || lowerPart.endsWith("question suivante") || lowerPart.endsWith("prochaine")) {
            // Cas particulier Étape 5 : On cycle dans les sous-champs
            if (step === 5) {
                const currentIndex = EXAMEN_FIELDS.indexOf(activeSubField as any);
                if (currentIndex < EXAMEN_FIELDS.length - 1) {
                    setActiveSubField(EXAMEN_FIELDS[currentIndex + 1]);
                } else {
                    nextStep();
                }
            } else {
                nextStep();
            }

            setLastProcessedLength(transcript.length);
            // setTimeout(resetTranscript, 100); // REMOVED to prevent history loop
            return;
        }

        // NAVIGATION : PRÉCÉDENT
        if (lowerPart.endsWith("précédent") || lowerPart.endsWith("retour") || lowerPart.endsWith("revenir")) {
            if (step === 5) {
                const currentIndex = EXAMEN_FIELDS.indexOf(activeSubField as any);
                if (currentIndex > 0) {
                    setActiveSubField(EXAMEN_FIELDS[currentIndex - 1]);
                } else {
                    prevStep();
                }
            } else {
                prevStep();
            }
            setLastProcessedLength(transcript.length);
            // setTimeout(resetTranscript, 100);
            return;
        }

        // STEP 5 SPECIFIC COMMANDS (Navigation directe)
        if (step === 5) {
            if (lowerPart.includes("présentation") || lowerPart.includes("contact")) { setActiveSubField('presentation'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("langage") || lowerPart.includes("parole")) { setActiveSubField('langage'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("cœur") || lowerPart.includes("humeur") || lowerPart.includes("affect")) { setActiveSubField('affect'); setLastProcessedLength(transcript.length); return; } // "cœur" catch "humeur" often
            if (lowerPart.includes("perception")) { setActiveSubField('perception'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("comportement")) { setActiveSubField('comportement'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("instinct") || lowerPart.includes("sommeil") || lowerPart.includes("appétit")) { setActiveSubField('instinct'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("jugement")) { setActiveSubField('jugement'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("cognition") || lowerPart.includes("mémoire")) { setActiveSubField('cognition'); setLastProcessedLength(transcript.length); return; }
            if (lowerPart.includes("physique") || lowerPart.includes("somatique")) { setActiveSubField('physique'); setLastProcessedLength(transcript.length); return; }
        }

        // --- 2. ROUTING DU TEXTE ---

        let targetField = '';
        if (step === 1) targetField = 'motif';
        if (step === 2) targetField = 'antecedents.details';
        if (step === 3) targetField = 'biographie';
        if (step === 4) targetField = 'histoire';
        if (step === 5) targetField = `examen.${activeSubField}`;
        if (step === 6) targetField = 'conclusion';
        if (step === 7) targetField = 'diagnostic';
        if (step === 8) targetField = 'suivi';

        if (targetField) {
            if (targetField.includes('.')) {
                const [parent, child] = targetField.split('.');
                // @ts-ignore
                setData(prev => {
                    // @ts-ignore
                    const parentObj = prev[parent];
                    const currentVal = parentObj[child] || "";
                    return { ...prev, [parent]: { ...parentObj, [child]: currentVal + " " + newPart } };
                });
            } else {
                // @ts-ignore
                setData(prev => ({ ...prev, [targetField]: (prev[targetField] || "") + " " + newPart }));
            }
            setLastProcessedLength(transcript.length);
        }

    }, [transcript, isListening, lastProcessedLength, step, activeSubField]);




    // Fonctions de sauvegarde manuelle (Réutilisée Header + Footer)
    const handleManualSave = async () => {
        console.log('--- Manual Save Triggered (Async) ---');
        stopListening();

        console.log('Preparing data for Patient:', id);

        const formData = new FormData();
        formData.append('patient_id', id);
        formData.append('content', JSON.stringify(data));
        formData.append('type', 'Observation Psychiatrique');

        console.log('FormData created. Submitting to Server Action...');
        try {
            // @ts-ignore
            const result = await createNote(formData);
            if (result?.error) {
                alert("ERREUR D'ENREGISTREMENT : " + result.error);
            }
        } catch (e) {
            console.log("Navigation en cours (ou erreur redirect)...", e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-6">

            {/* EN-TÊTE & PROGRESSION */}
            <div className="mb-8">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-primary">Nouvelle Observation Psychiatrique</h1>

                    {/* BOUTON ASSISTANT VOCAL */}
                    {hasMounted && hasSupport && (
                        <div className="flex space-x-3">
                            <button
                                onClick={handleManualSave}
                                className="flex items-center space-x-2 px-4 py-2 rounded-full font-bold bg-green-600 text-white hover:bg-green-700 shadow-md transition-all"
                            >
                                <span>💾</span>
                                <span>Enregistrer</span>
                            </button>

                            <button
                                onClick={isListening ? stopListening : startListening}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold transition-all shadow-md ${isListening
                                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                                    : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                            >
                                <span className="text-xl">{isListening ? '⏹' : '🎙️'}</span>
                                <span>{isListening ? 'Arrêter Assistant' : 'Mode Mains-Libres'}</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(step / 8) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 font-medium">
                    <span>Étape {step} / 8</span>
                    <span>
                        {step === 1 && "Motif"}
                        {step === 2 && "Antécédents"}
                        {step === 3 && "Biographie"}
                        {step === 4 && "Histoire"}
                        {step === 5 && "Examen"}
                        {step === 6 && "Conclusion"}
                        {step === 7 && "Diagnostic"}
                        {step === 8 && "Suivi"}
                    </span>
                </div>
            </div>

            <div className="bg-white shadow-lg ring-1 ring-black/5 rounded-xl p-6 min-h-[500px] flex flex-col">

                {/* --- STEPS --- */}

                {/* STEP 1: MOTIF */}
                {step === 1 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">1. Motif de Consultation / Hospitalisation</h2>
                        <DictationArea
                            className={`w-full h-64 p-4 rounded-lg border-2 border-dashed border-gray-300 focus:border-primary focus:ring-0 text-lg bg-gray-50 ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                            placeholder="Pourquoi le patient est-il ici aujourd'hui ?"
                            value={data.motif}
                            onChange={v => setData({ ...data, motif: v })}
                        />
                    </div>
                )}

                {/* STEP 2: ANTÉCÉDENTS */}
                {step === 2 && (
                    <div className="flex-1 space-y-6">
                        <h2 className="text-xl font-semibold text-primary">2. Antécédents</h2>
                        {/* PARTIE 1 : ANTÉCÉDENTS PERSONNELS */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-primary uppercase border-b pb-2">Antécédents personnels :</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Menu déroulant</label>
                                    <select
                                        className="w-full rounded-md border-gray-300"
                                        value={data.antecedents.type}
                                        onChange={e => setData({ ...data, antecedents: { ...data.antecedents, type: e.target.value } })}
                                    >
                                        {ANTECEDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Détails (Personnels)</label>
                                    <DictationArea
                                        className={`w-full rounded-md border-gray-300 h-24 ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                                        placeholder="Précisions sur les antécédents personnels..."
                                        value={data.antecedents.details}
                                        onChange={v => setData({ ...data, antecedents: { ...data.antecedents, details: v } })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PARTIE 2 : ANTÉCÉDENTS FAMILIAUX */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-primary uppercase border-b pb-2">Antécédents familiaux :</h3>

                            <div className="w-full">
                                <label className="block text-sm font-medium mb-1">Zone de texte</label>
                                <DictationArea
                                    className={`w-full h-32 p-4 rounded-lg border-gray-300 focus:border-primary ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                                    placeholder="Décrivez les antécédents familiaux..."
                                    value={data.antecedents.familiaux}
                                    onChange={v => setData({ ...data, antecedents: { ...data.antecedents, familiaux: v } })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: BIOGRAPHIE */}
                {step === 3 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">3. Biographie</h2>
                        <DictationArea
                            className={`w-full h-80 p-4 rounded-lg border-gray-300 focus:border-primary text-base ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                            placeholder="Histoire de vie, enfance, scolarité, situation familiale et professionnelle..."
                            value={data.biographie}
                            onChange={v => setData({ ...data, biographie: v })}
                        />
                    </div>
                )}

                {/* STEP 4: HISTOIRE MALADIE */}
                {step === 4 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">4. Histoire de la Maladie</h2>
                        <DictationArea
                            className={`w-full h-80 p-4 rounded-lg border-gray-300 focus:border-primary text-base ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                            placeholder="Début des troubles, évolution, facteurs déclenchants..."
                            value={data.histoire}
                            onChange={v => setData({ ...data, histoire: v })}
                        />
                    </div>
                )}

                {/* STEP 5: EXAMEN PSYCHIATRIQUE */}
                {step === 5 && (
                    <div className="flex-1 space-y-6 overflow-y-auto max-h-[60vh] pr-2">
                        <h2 className="text-xl font-semibold text-primary sticky top-0 bg-white pb-2 border-b z-10">5. Examen Psychiatrique</h2>

                        <div className="space-y-4">
                            {EXAMEN_FIELDS.map((subField, idx) => {
                                const labels: Record<string, string> = {
                                    presentation: '5.1 Présentation et contact',
                                    langage: '5.2 Langage et pensée',
                                    perception: '5.3 Perception',
                                    affect: '5.4 Affect et humeur',
                                    comportement: '5.5 Comportement',
                                    instinct: '5.6 Fonctions instinctuelles',
                                    jugement: '5.7 Jugement et conscience',
                                    cognition: '5.8 Cognition (Mémoire, Attention)',
                                    physique: '5.9 Examen physique'
                                };
                                const isActive = activeSubField === subField && isListening;

                                return (
                                    <div key={subField}
                                        className={`transition-all duration-300 rounded-lg ${isActive ? 'ring-2 ring-red-400 p-1 bg-red-50' : ''}`}
                                        onClick={() => setActiveSubField(subField)}
                                    >
                                        <DictationArea
                                            label={labels[subField]}
                                            value={data.examen[subField]}
                                            onChange={v => setData({ ...data, examen: { ...data.examen, [subField]: v } })}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 6: CONCLUSION */}
                {step === 6 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">6. Conclusion</h2>
                        <DictationArea
                            className={`w-full h-64 p-4 rounded-lg border-gray-300 focus:border-primary ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                            placeholder="Synthèse clinique..."
                            value={data.conclusion}
                            onChange={v => setData({ ...data, conclusion: v })}
                        />
                    </div>
                )}

                {/* STEP 7: DIAGNOSTIC */}
                {step === 7 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">7. Diagnostic à évoquer</h2>
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                            <DictationArea
                                className={`w-full h-32 bg-transparent border-0 focus:ring-0 text-lg font-medium text-gray-800 placeholder-primary/50 ${isListening ? 'ring-2 ring-red-400 border-red-400 rounded-lg bg-red-50/50' : ''}`}
                                placeholder="Diagnostic principal..."
                                value={data.diagnostic}
                                onChange={v => setData({ ...data, diagnostic: v })}
                            />
                        </div>
                    </div>
                )}

                {/* STEP 8: SUIVI */}
                {step === 8 && (
                    <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-semibold text-primary">8. Suivi Médical</h2>
                        <DictationArea
                            className={`w-full h-64 p-4 rounded-lg border-gray-300 focus:border-primary ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                            placeholder="Conduite à tenir, traitement, prochain rendez-vous..."
                            value={data.suivi}
                            onChange={v => setData({ ...data, suivi: v })}
                        />
                    </div>
                )}


                {/* BOUTONS DE NAVIGATION */}
                <div className="mt-8 pt-4 border-t flex justify-between items-center bg-white sticky bottom-0">
                    <button
                        onClick={prevStep}
                        disabled={step === 1}
                        className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                    >
                        ← Précédent
                    </button>

                    {step < 8 ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                        >
                            Suivant →
                        </button>
                    ) : (
                        <button
                            onClick={handleManualSave}
                            className="px-8 py-3 rounded-lg bg-green-600 text-white font-bold shadow-lg hover:bg-green-500 animate-pulse-slow flex items-center gap-2"
                        >
                            <span>💾</span>
                            <span>TERMINER ET ENREGISTRER</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

// --- SUBSIDIARY COMPONENT REMOVED (Imported instead) ---
