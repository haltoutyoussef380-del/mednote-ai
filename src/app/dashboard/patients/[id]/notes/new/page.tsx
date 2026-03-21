'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Loader2, Save, Sparkles, FileText, Users, User, BookOpen, Stethoscope, Brain, ClipboardCheck, Activity, Heart, ChevronDown, ChevronUp, Code, Plus, Trash2, Calendar } from 'lucide-react'
import { DictationArea } from '@/components/audio/DictationArea'
import { createNote } from '@/app/dashboard/notes/actions'
import { useIntelligentVoice } from '@/hooks/useIntelligentVoice'
import { correctMedicalText, detectVoiceCommand, routeAntecedentsText, getNavigationPrompt, routeTranscriptToField } from '@/app/actions/ai-voice';
import { searchMedicaments, scrapePsychiatricMedicines } from '@/app/actions/pharma';
import { FormContext, VoicePilotAction } from '@/lib/voice-pilot';

interface Prescription {
    id: string;
    nom: string;
    dosage: string;
    frequence: string;
    duree: string;
}

const ANTECEDENT_TYPES = [
    "Psychiatriques",
    "Médicaux & Chirurgicaux",
    "Addictives",
    "Juridiques"
]

interface ObservationData {
    motif: string;
    antecedents: {
        type: string;
        details: string;
        familiaux: string;
    };
    biographie: string;
    histoire: string;
    examen: {
        presentation: string;
        contact: string;
        humeur: string;
        pensee: string;
        cognition: string;
    };
    conclusion: string;
    diagnostic: string;
    suivi: string;
    ordonnance: string;
    prochain_rdv: string;
    prescriptions: Prescription[];
}

const INITIAL_DATA: ObservationData = {
    motif: "",
    antecedents: { type: "", details: "", familiaux: "" },
    biographie: "",
    histoire: "",
    examen: {
        presentation: "",
        contact: "",
        humeur: "",
        pensee: "",
        cognition: ""
    },
    conclusion: "",
    diagnostic: "",
    suivi: "",
    ordonnance: "",
    prochain_rdv: "",
    prescriptions: []
}

export default function NewObservationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [data, setData] = useState<ObservationData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);    const [activeField, setActiveField] = useState<string>('motif');
    const [commandFeedback, setCommandFeedback] = useState<string>("");

    // --- Autocomplete States ---
    const [medSuggestions, setMedSuggestions] = useState<any[]>([]);
    const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
    const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);

    const [navPrompt, setNavPrompt] = useState<string>('');
    const [showPrompt, setShowPrompt] = useState(false);


    // Prescription Management
    const addPrescription = (name: string = "") => {
        const newPresc: Prescription = {
            id: Math.random().toString(36).substr(2, 9),
            nom: name,
            dosage: "",
            frequence: "",
            duree: ""
        };
        setData(prev => ({ ...prev, prescriptions: [...prev.prescriptions, newPresc] }));
    };

    const updatePrescription = (id: string, updates: Partial<Prescription>) => {
        setData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
    };

    const removePrescription = (id: string) => {
        setData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter(p => p.id !== id)
        }));
    };

    // Intelligent Voice System
    const {
        isListening,
        transcript,
        isProcessing,
        startListening,
        stopListening,
        clearTranscript,
        setOnTranscript
    } = useIntelligentVoice();

    useEffect(() => {
        setHasMounted(true);
        // Charger le prompt de navigation
        getNavigationPrompt().then(setNavPrompt);
    }, []);

    // Voice Command Handler
    useEffect(() => {
        setOnTranscript(async (transcriptData) => {
            const correctedText = transcriptData.corrected;
            console.log("🎯 Processing:", correctedText);

            // STEP 1: Detect command type
            const command = await detectVoiceCommand(correctedText);
            console.log("📍 Command:", command.type, (command as unknown as Record<string, string | undefined>).target || (command as unknown as Record<string, string | undefined>).value);

            // STEP 2: Handle based on command type
            if (command.type === 'navigation') {
                const isSubField = command.target!.includes('.');

                const sectionNames: Record<string, string> = {
                    'motif': 'Motif',
                    'antecedents': 'Antécédents',
                    'antecedents.familiaux': 'Antécédents Familiaux',
                    'antecedents.details': 'Détails Antécédents',
                    'biographie': 'Biographie',
                    'histoire': 'Histoire de la Maladie',
                    'examen': 'Examen Psychiatrique',
                    'conclusion': 'Conclusion',
                    'diagnostic': 'Diagnostic',
                    'suivi': 'Suivi Médical'
                };

                setCommandFeedback(`✅ Navigation vers ${sectionNames[command.target!] || command.target}`);
                setTimeout(() => setCommandFeedback(''), 3000);

                const scrollTarget = isSubField ? command.target!.split('.')[0] : command.target!;
                const section = document.getElementById(scrollTarget);
                section?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (isSubField) {
                    setActiveField(command.target!);
                } else {
                    const fieldMap: Record<string, string> = {
                        'motif': 'motif',
                        'antecedents': 'antecedents.type',
                        'biographie': 'biographie',
                        'histoire': 'histoire',
                        'examen': 'examen.resume',
                        'examen.presentation': 'examen.presentation',
                        'examen.contact': 'examen.contact',
                        'examen.humeur': 'examen.humeur',
                        'examen.pensee': 'examen.pensee',
                        'examen.cognition': 'examen.cognition',
                        'conclusion': 'conclusion',
                        'diagnostic': 'diagnostic',
                        'suivi': 'suivi',
                        'prescriptions': 'prescriptions'
                    };
                    setActiveField(fieldMap[command.target!] || command.target!);
                }
                clearTranscript();
                return;
            }

            if (command.type === 'dropdown') {
                setCommandFeedback(`✅ Type sélectionné: ${command.value}`);
                setTimeout(() => setCommandFeedback(''), 3000);

                setData(prev => ({
                    ...prev,
                    antecedents: { ...prev.antecedents, type: command.value! }
                }));
                setActiveField('antecedents.details');
                clearTranscript();
                return;
            }

            // STEP 2.5: Field Actions (clear, correct, etc.)
            if (command.type === 'action') {
                if (command.action === 'clear') {
                    // Clear the active field
                    const parts = activeField.split('.');
                    if (parts.length === 1) {
                        setData(prev => ({ ...prev, [activeField]: '' }));
                    } else if (parts.length === 2) {
                        const [parent, child] = parts;
                        setData(prev => ({
                            ...prev,
                            [parent]: {
                                ...(prev[parent as keyof ObservationData] as Record<string, string>),
                                [child]: ''
                            }
                        }));
                    }
                    setCommandFeedback('✅ Champ vidé');
                    setTimeout(() => setCommandFeedback(''), 2000);
                    clearTranscript();
                    return;
                }

                if (command.action === 'correct') {
                    // For correction, just clear and wait for new dictation
                    setCommandFeedback('🎤 Prêt pour la correction');
                    setTimeout(() => setCommandFeedback(''), 2000);
                    clearTranscript();
                    return;
                }
            }

            // STEP 3: Dictation - fill active field
            console.log("📝 Dictation to field:", activeField);

            // INTELLIGENT ROUTING for Antécédents section
            if (activeField.startsWith('antecedents')) {
                const routing = await routeAntecedentsText(correctedText);
                console.log("🧠 AI Routing:", routing);

                if (routing.category === 'familiaux') {
                    // Antécédents familiaux
                    setData(prev => ({
                        ...prev,
                        antecedents: {
                            ...prev.antecedents,
                            familiaux: prev.antecedents.familiaux
                                ? `${prev.antecedents.familiaux} ${routing.details}`.trim()
                                : routing.details
                        }
                    }));
                    setActiveField('antecedents.familiaux');
                    setCommandFeedback('✅ Ajouté aux antécédents familiaux');
                } else {
                    // Antécédents personnels
                    if (routing.type) {
                        setData(prev => ({
                            ...prev,
                            antecedents: {
                                ...prev.antecedents,
                                type: routing.type!,
                                details: prev.antecedents.details
                                    ? `${prev.antecedents.details} ${routing.details}`.trim()
                                    : routing.details
                            }
                        }));
                        setCommandFeedback(`✅ Type: ${routing.type} - Détails ajoutés`);
                    } else {
                        setData(prev => ({
                            ...prev,
                            antecedents: {
                                ...prev.antecedents,
                                details: prev.antecedents.details
                                    ? `${prev.antecedents.details} ${routing.details}`.trim()
                                    : routing.details
                            }
                        }));
                        setCommandFeedback('✅ Détails ajoutés aux antécédents personnels');
                    }
                    setActiveField('antecedents.details');
                }

                setTimeout(() => setCommandFeedback(''), 3000);
                clearTranscript();
                return;
            }

            // STEP 3: Intelligent Routing (New logic for Prescriptions & Fields)
            const routingResult = await routeTranscriptToField(correctedText, data);
            console.log("🧠 Global Routing:", routingResult);

            if (routingResult.field === 'prescriptions' && (routingResult as unknown as Record<string, unknown>).prescription) {
                const p = (routingResult as unknown as Record<string, unknown>).prescription as Prescription;
                const newPresc: Prescription = {
                    id: Math.random().toString(36).substr(2, 9),
                    nom: p.nom || "",
                    dosage: p.dosage || "",
                    frequence: p.frequence || "",
                    duree: p.duree || ""
                };
                setData(prev => ({ ...prev, prescriptions: [...prev.prescriptions, newPresc] }));
                setCommandFeedback(`💊 Prescription ajoutée: ${p.nom}`);
                setTimeout(() => setCommandFeedback(''), 3000);
                
                // Scroll to the builder
                document.getElementById('prescription-builder')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                clearTranscript();
                return;
            }

            // --- NEXT APPOINTMENT DETECTION ---
            if ((routingResult as any).prochain_rdv) {
                setData(prev => ({ ...prev, prochain_rdv: (routingResult as any).prochain_rdv }));
                setCommandFeedback(`📅 RDV détecté: ${(routingResult as any).prochain_rdv}`);
                setTimeout(() => setCommandFeedback(''), 3000);
            }

            const parts = activeField.split('.');

            if (parts.length === 1) {
                setData(prev => ({
                    ...prev,
                    [parts[0]]: prev[parts[0] as keyof ObservationData]
                        ? `${prev[parts[0] as keyof ObservationData]} ${correctedText}`.trim()
                        : correctedText
                }));
            } else if (parts.length === 2) {
                setData(prev => {
                    const parent = (prev as unknown as Record<string, Record<string, string>>)[parts[0]];
                    const currentValue = parent[parts[1]] || '';
                    return {
                        ...prev,
                        [parts[0]]: {
                            ...parent,
                            [parts[1]]: currentValue ? `${currentValue} ${correctedText}`.trim() : correctedText
                        }
                    };
                });
            }

            setTimeout(() => clearTranscript(), 500);
        });
    }, [activeField, clearTranscript, data, setOnTranscript]);

    // Helper function for field classes with visual indicator
    const getFieldClasses = (fieldName: string) => {
        const isActive = activeField === fieldName;
        const baseClasses = "w-full rounded-xl border-2 border-gray-300 bg-gray-50 p-4 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200";
        return isActive
            ? `${baseClasses} !ring-4 !ring-blue-500 !bg-blue-100 !border-blue-600 shadow-2xl scale-[1.01] font-medium`
            : baseClasses;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('patient_id', id);
            formData.append('type', 'observation');
            formData.append('content', JSON.stringify({
                motif: data.motif,
                antecedents: {
                    type: data.antecedents.type,
                    details: data.antecedents.details,
                    familiaux: data.antecedents.familiaux
                },
                biographie: data.biographie,
                histoire: data.histoire,
                examen: data.examen,
                conclusion: data.conclusion,
                diagnostic: data.diagnostic,
                suivi: data.suivi,
                prochain_rdv: data.prochain_rdv,
                ordonnance: data.ordonnance,
                prescriptions: data.prescriptions
            }));

            await createNote(formData);
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasMounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">Nouvelle Observation Psychiatrique</h1>
                            <p className="text-indigo-100 mt-1 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Patient ID: {id}
                            </p>
                        </div>
                    </div>

                    {/* Voice Control */}
                    <div className="mt-6 flex items-center gap-4">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${isListening
                                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse ring-4 ring-red-300'
                                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                                }`}
                        >
                            <Mic className="w-5 h-5" />
                            {isListening ? 'Arrêter' : 'Dicter'}
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Sauvegarder</>
                            )}
                        </button>
                    </div>

                    {/* Live Transcript Display */}
                    {(isListening || isProcessing) && (
                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                            <div className="flex items-center gap-2 text-sm">
                                {isProcessing ? (
                                    <><Sparkles className="w-4 h-4 text-indigo-600 animate-spin" /> Correction IA en cours...</>
                                ) : (
                                    <><Mic className="w-4 h-4 text-red-500 animate-pulse" /> Écoute en cours...</>
                                )}
                            </div>
                            {transcript.corrected && (
                                <p className="mt-2 text-gray-800 font-medium">{transcript.corrected}</p>
                            )}
                        </div>
                    )}

                    {/* Command Feedback Banner */}
                    {commandFeedback && (
                        <div className="mt-3 p-4 bg-green-50 rounded-lg border-2 border-green-400 animate-pulse">
                            <div className="flex items-center gap-2 text-green-800 font-bold">
                                <span className="text-2xl">✅</span>
                                <span>{commandFeedback}</span>
                            </div>
                        </div>
                    )}

                    {/* Navigation Prompt Toggle */}
                    <div className="mt-6 border-t border-white/20 pt-6">
                        <button
                            onClick={() => setShowPrompt(!showPrompt)}
                            className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors text-sm font-medium bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
                        >
                            <Code className="w-4 h-4" />
                            {showPrompt ? "Masquer le Prompt Système" : "Voir le Prompt Système de Navigation"}
                            {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showPrompt && (
                            <div className="mt-4 p-4 bg-black/30 rounded-xl backdrop-blur-md border border-white/10 font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre-wrap">
                                {navPrompt}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Sections */}
                <div className="space-y-6">
                    {/* 1. Motif */}
                    <div id="motif" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-blue-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                Motif de Consultation
                            </h2>
                        </div>
                        <DictationArea
                            value={data.motif}
                            onChange={(v) => setData(prev => ({ ...prev, motif: v }))}
                            onFocus={() => setActiveField('motif')}
                            className={getFieldClasses('motif')}
                            placeholder="Motif de consultation..."
                            rows={4}
                        />
                    </div>

                    {/* 2. Antécédents */}
                    <div id="antecedents" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-purple-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                                Antécédents
                            </h2>
                        </div>

                        {/* Antécédents Personnels */}
                        <div className="bg-purple-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
                            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Antécédents Personnels
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                <select
                                    value={data.antecedents.type}
                                    onChange={(e) => setData(prev => ({
                                        ...prev,
                                        antecedents: { ...prev.antecedents, type: e.target.value }
                                    }))}
                                    onFocus={() => setActiveField('antecedents.type')}
                                    className={getFieldClasses('antecedents.type')}
                                >
                                    <option value="">Sélectionner...</option>
                                    {ANTECEDENT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Détails</label>
                                <DictationArea
                                    value={data.antecedents.details}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        antecedents: { ...prev.antecedents, details: v }
                                    }))}
                                    onFocus={() => setActiveField('antecedents.details')}
                                    className={getFieldClasses('antecedents.details')}
                                    placeholder="Détails des antécédents personnels..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Antécédents Familiaux */}
                        <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-200">
                            <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                Antécédents Familiaux
                            </h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Détails</label>
                                <DictationArea
                                    value={data.antecedents.familiaux}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        antecedents: { ...prev.antecedents, familiaux: v }
                                    }))}
                                    onFocus={() => setActiveField('antecedents.familiaux')}
                                    className={getFieldClasses('antecedents.familiaux')}
                                    placeholder="Antécédents familiaux..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Biographie */}
                    <div id="biographie" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-green-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                                Biographie
                            </h2>
                        </div>
                        <DictationArea
                            value={data.biographie}
                            onChange={(v) => setData(prev => ({ ...prev, biographie: v }))}
                            onFocus={() => setActiveField('biographie')}
                            className={getFieldClasses('biographie')}
                            placeholder="Biographie du patient..."
                            rows={4}
                        />
                    </div>

                    {/* 4. Histoire */}
                    <div id="histoire" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-amber-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <BookOpen className="w-6 h-6 text-amber-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                                Histoire de la Maladie
                            </h2>
                        </div>
                        <DictationArea
                            value={data.histoire}
                            onChange={(v) => setData(prev => ({ ...prev, histoire: v }))}
                            onFocus={() => setActiveField('histoire')}
                            className={getFieldClasses('histoire')}
                            placeholder="Histoire de la maladie..."
                            rows={4}
                        />
                    </div>

                    {/* 5. Examen Psychiatrique */}
                    <div id="examen" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-rose-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-rose-100 rounded-xl">
                                <Brain className="w-6 h-6 text-rose-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent">
                                Examen Psychiatrique
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Présentation</label>
                                <DictationArea
                                    value={data.examen.presentation}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        examen: { ...prev.examen, presentation: v }
                                    }))}
                                    onFocus={() => setActiveField('examen.presentation')}
                                    className={getFieldClasses('examen.presentation')}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Contact</label>
                                <DictationArea
                                    value={data.examen.contact}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        examen: { ...prev.examen, contact: v }
                                    }))}
                                    onFocus={() => setActiveField('examen.contact')}
                                    className={getFieldClasses('examen.contact')}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Humeur</label>
                                <DictationArea
                                    value={data.examen.humeur}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        examen: { ...prev.examen, humeur: v }
                                    }))}
                                    onFocus={() => setActiveField('examen.humeur')}
                                    className={getFieldClasses('examen.humeur')}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Pensée</label>
                                <DictationArea
                                    value={data.examen.pensee}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        examen: { ...prev.examen, pensee: v }
                                    }))}
                                    onFocus={() => setActiveField('examen.pensee')}
                                    className={getFieldClasses('examen.pensee')}
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary uppercase mb-1">Cognition</label>
                                <DictationArea
                                    value={data.examen.cognition}
                                    onChange={(v) => setData(prev => ({
                                        ...prev,
                                        examen: { ...prev.examen, cognition: v }
                                    }))}
                                    onFocus={() => setActiveField('examen.cognition')}
                                    className={getFieldClasses('examen.cognition')}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 6. Conclusion */}
                    <div id="conclusion" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-indigo-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <ClipboardCheck className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                Conclusion
                            </h2>
                        </div>
                        <DictationArea
                            value={data.conclusion}
                            onChange={(v) => setData(prev => ({ ...prev, conclusion: v }))}
                            onFocus={() => setActiveField('conclusion')}
                            className={getFieldClasses('conclusion')}
                            placeholder="Conclusion..."
                            rows={4}
                        />
                    </div>

                    {/* 7. Diagnostic */}
                    <div id="diagnostic" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-pink-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-pink-100 rounded-xl">
                                <Activity className="w-6 h-6 text-pink-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                                Diagnostic
                            </h2>
                        </div>
                        <DictationArea
                            value={data.diagnostic}
                            onChange={(v) => setData(prev => ({ ...prev, diagnostic: v }))}
                            onFocus={() => setActiveField('diagnostic')}
                            className={getFieldClasses('diagnostic')}
                            placeholder="Diagnostic..."
                            rows={4}
                        />
                    </div>

                    {/* 8. Suivi */}
                    <div id="suivi" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-teal-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <Heart className="w-6 h-6 text-teal-600" />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                                Suivi Médical
                            </h2>
                        </div>
                        <DictationArea
                            value={data.suivi}
                            onChange={(v) => setData(prev => ({ ...prev, suivi: v }))}
                            onFocus={() => setActiveField('suivi')}
                            className={getFieldClasses('suivi')}
                            placeholder="Plan de suivi..."
                            rows={4}
                        />

                        {/* Champ Prochain RDV Manuel/IA */}
                        <div className="mt-6 p-4 bg-teal-50 rounded-2xl border-2 border-teal-200">
                            <label className="flex items-center gap-2 text-sm font-bold text-teal-800 mb-2">
                                <Calendar className="w-4 h-4" />
                                Prochain Rendez-vous (Détecté ou Manuel)
                            </label>
                            <input
                                type="text"
                                value={data.prochain_rdv}
                                onChange={(e) => setData(prev => ({ ...prev, prochain_rdv: e.target.value }))}
                                onFocus={() => setActiveField('prochain_rdv')}
                                className={getFieldClasses('prochain_rdv')}
                                placeholder='Ex: "dans 15 jours", "le 20 juin"...'
                            />
                            <p className="text-[10px] text-teal-600 mt-2 italic">
                                * Ce champ sera transformé automatiquement en date dans votre agenda.
                            </p>
                        </div>
                    </div>

                    {/* 9. Prescription Builder (Barre Roulante) */}
                    <div id="prescription-builder" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-indigo-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                                        Prescription Interactive
                                    </h2>
                                    <p className="text-sm text-slate-500">Gérez les médicaments de manière structurée</p>
                                </div>
                                <button
                                    onClick={() => addPrescription()}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 font-semibold"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>
                        </div>

                        {data.prescriptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                    <Stethoscope className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium">Aucun médicament ajouté</p>
                                <p className="text-xs text-slate-300">Dites &quot;Prescrire Haldol&quot; ou utilisez le bouton +</p>
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                                {data.prescriptions.map((p) => (
                                    <div key={p.id} className="min-w-[300px] bg-slate-50 rounded-2xl p-5 border border-slate-200 relative group animate-in zoom-in-95 duration-200 shadow-sm hover:shadow-md transition-all">
                                        <button
                                            onClick={() => removePrescription(p.id)}
                                            className="absolute top-3 right-3 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Médicament</label>
                                                <input
                                                    type="text"
                                                    value={p.nom}
                                                    onChange={async (e) => {
                                                        const val = e.target.value;
                                                        updatePrescription(p.id, { nom: val });
                                                        
                                                        if (val.length >= 2) {
                                                            const results = await searchMedicaments(val);
                                                            setMedSuggestions(results);
                                                            setActiveSearchId(p.id);
                                                            setActiveSuggestIndex(-1);
                                                        } else {
                                                            setMedSuggestions([]);
                                                            setActiveSearchId(null);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (activeSearchId === p.id && medSuggestions.length > 0) {
                                                            if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setActiveSuggestIndex(prev => (prev + 1) % medSuggestions.length);
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setActiveSuggestIndex(prev => (prev - 1 + medSuggestions.length) % medSuggestions.length);
                                                            } else if (e.key === 'Enter' && activeSuggestIndex !== -1) {
                                                                e.preventDefault();
                                                                const selected = medSuggestions[activeSuggestIndex];
                                                                updatePrescription(p.id, { nom: selected.nom });
                                                                setMedSuggestions([]);
                                                                setActiveSearchId(null);
                                                            } else if (e.key === 'Escape') {
                                                                setMedSuggestions([]);
                                                                setActiveSearchId(null);
                                                            }
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // Delay to allow click on suggestion
                                                        setTimeout(() => {
                                                            setMedSuggestions([]);
                                                            setActiveSearchId(null);
                                                        }, 200);
                                                    }}
                                                    placeholder="Ex: Haldol"
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                                />
                                                
                                                {/* AUTOCOMPLETE DROPDOWN */}
                                                {activeSearchId === p.id && medSuggestions.length > 0 && (
                                                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {medSuggestions.map((s, idx) => (
                                                            <div
                                                                key={s.id || idx}
                                                                onClick={() => {
                                                                    updatePrescription(p.id, { nom: s.nom });
                                                                    setMedSuggestions([]);
                                                                    setActiveSearchId(null);
                                                                }}
                                                                onMouseEnter={() => setActiveSuggestIndex(idx)}
                                                                className={`px-4 py-3 cursor-pointer transition-colors flex flex-col ${
                                                                    idx === activeSuggestIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <span className="font-bold text-sm text-slate-900">{s.nom}</span>
                                                                <span className="text-[10px] text-slate-500 italic">{s.dci || 'Composition non spécifiée'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Dosage</label>
                                                    <input
                                                        type="text"
                                                        value={p.dosage}
                                                        onChange={(e) => updatePrescription(p.id, { dosage: e.target.value })}
                                                        placeholder="Ex: 5mg"
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Durée</label>
                                                    <input
                                                        type="text"
                                                        value={p.duree}
                                                        onChange={(e) => updatePrescription(p.id, { duree: e.target.value })}
                                                        placeholder="Ex: 10j"
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Fréquence / Posologie</label>
                                                <input
                                                    type="text"
                                                    value={p.frequence}
                                                    onChange={(e) => updatePrescription(p.id, { frequence: e.target.value })}
                                                    placeholder="Ex: 1-0-1 (Matin/Soir)"
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 10. Ordonnance (Note Verbatim) */}
                    <div id="ordonnance" className="bg-white rounded-3xl shadow-xl p-8 border-l-8 border-orange-500 hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Stethoscope className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                                    Ordonnance (Dictée Magique)
                                </h2>
                                <button
                                    onClick={async () => {
                                        setCommandFeedback("⏳ Scraping medicament.ma en cours...");
                                        const res = await scrapePsychiatricMedicines();
                                        setCommandFeedback(`✅ ${res.count} médicaments récupérés !`);
                                        setTimeout(() => setCommandFeedback(''), 5000);
                                    }}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors font-medium border border-slate-200"
                                >
                                    Actualiser la base Pharma
                                </button>
                            </div>
                        </div>
                        <DictationArea
                            value={data.ordonnance}
                            onChange={(v: string) => setData(prev => ({ ...prev, ordonnance: v }))}
                            onFocus={() => setActiveField('ordonnance')}
                            className={getFieldClasses('ordonnance')}
                            placeholder={'Dictez la prescription : "Je prescris Doliprane 1000mg..."'}
                            rows={6}
                        />
                    </div>

                    {/* Final Visualization / Prescription Card */}
                    {(data.ordonnance || data.prescriptions.length > 0) && (
                        <div className="mt-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center text-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 rounded-lg">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold">Aperçu de l&apos;Ordonnance A5</h3>
                                </div>
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 italic">
                                    Format Officiel
                                </span>
                            </div>
                            
                            <div className="p-4 bg-slate-100 overflow-auto max-h-[700px]">
                                <div className="bg-white shadow-lg mx-auto w-full min-h-[600px] flex flex-col relative" style={{ width: '100%', maxWidth: '148mm' }}>
                                    {/* EN-TÊTE IMAGE */}
                                    <div className="w-full">
                                        <img 
                                            src="/ordonnace entete.png" 
                                            alt="En-tête" 
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>

                                    {/* CONTENU PRINCIPAL */}
                                    <div className="px-8 py-6 flex-1 flex flex-col">
                                        <div className="flex justify-end mb-4">
                                            <p className="text-[10px] font-medium">Tanger le : <span className="border-b border-dotted border-black px-4">{new Date().toLocaleDateString('fr-FR')}</span></p>
                                        </div>

                                        <h1 className="text-center text-xl font-bold underline mb-6 tracking-widest text-slate-900">
                                            ORDONNANCE
                                        </h1>

                                        <div className="mb-6 italic text-[11px] text-slate-600">
                                            <p>Patient(e) : <span className="font-bold not-italic text-slate-900">{id ? "Psychiatre de Garde" : "Consultant"}</span></p>
                                        </div>

                                        <div className="flex-1">
                                            <div className="space-y-4 font-serif text-base">
                                                {data.prescriptions.length > 0 ? (
                                                    <ul className="space-y-4">
                                                        {data.prescriptions.map((p, idx) => (
                                                            <li key={p.id} className="border-l-2 border-slate-100 pl-3 py-1">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-sm uppercase">{p.nom}</span>
                                                                    <div className="flex gap-2 text-[10px] italic text-slate-500 mt-0.5">
                                                                        {p.dosage && <span>{p.dosage}</span>}
                                                                        {p.frequence && <span>- {p.frequence}</span>}
                                                                        {p.duree && <span>- Pendant {p.duree}</span>}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                                        {data.ordonnance}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-2 border-t border-slate-50 italic text-slate-400 text-[9px]">
                                            <p>Prochain Rendez-vous : <span className="text-slate-900 not-italic font-bold ml-1">{data.prochain_rdv || "................................................................"}</span></p>
                                        </div>
                                    </div>

                                    {/* PIED DE PAGE IMAGE */}
                                    <div className="w-full mt-auto">
                                        <img 
                                            src="/ordonnace pied.png" 
                                            alt="Pied de page" 
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
