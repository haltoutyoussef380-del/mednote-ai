'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Loader2, Save, Sparkles, FileText, Users, User, BookOpen, Stethoscope, Brain, ClipboardCheck, Activity, Heart } from 'lucide-react'
import { DictationArea } from '@/components/audio/DictationArea'
import { createNote } from '@/app/dashboard/notes/actions'
import { useIntelligentVoice } from '@/hooks/useIntelligentVoice'
import { detectVoiceCommand, detectDropdownSelection, routeAntecedentsText } from '@/app/actions/ai-voice'

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
    suivi: ""
}

export default function NewObservationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [data, setData] = useState<ObservationData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [activeField, setActiveField] = useState<string>('motif');
    const [commandFeedback, setCommandFeedback] = useState<string>('');

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
    }, []);

    // Voice Command Handler
    useEffect(() => {
        setOnTranscript(async (transcriptData) => {
            const correctedText = transcriptData.corrected;
            console.log("🎯 Processing:", correctedText);

            // STEP 1: Detect command type
            const command = await detectVoiceCommand(correctedText);
            console.log("📍 Command:", command.type, command.target || command.value);

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
                        'examen': 'examen.presentation',
                        'conclusion': 'conclusion',
                        'diagnostic': 'diagnostic',
                        'suivi': 'suivi'
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
                        setData(prev => ({
                            ...prev,
                            [parts[0]]: { ...prev[parts[0] as keyof typeof prev], [parts[1]]: '' }
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
                    const parent = (prev as any)[parts[0]];
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
    }, [activeField]);

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
                suivi: data.suivi
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
                    </div>
                </div>
            </div>
        </div>
    );
}
