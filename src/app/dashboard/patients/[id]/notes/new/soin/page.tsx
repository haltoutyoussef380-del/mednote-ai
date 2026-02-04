'use client'

import { useState, use, useEffect } from 'react'
import { createNote, structureNurseCareWithAI } from '@/app/dashboard/notes/actions'
import { Save, Activity, Pill, Eye, ArrowLeft, Mic, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface SoinData {
    constantes: {
        tension: string
        pouls: string
        temperature: string
        saturation: string
        poids: string
    }
    traitement: {
        distribution: boolean
        refus: boolean
        si_besoin: string
    }
    observation: string
    incident: boolean
}

const INITIAL_DATA: SoinData = {
    constantes: { tension: '', pouls: '', temperature: '', saturation: '', poids: '' },
    traitement: { distribution: false, refus: false, si_besoin: '' },
    observation: '',
    incident: false
}

export default function NewNursingCarePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [data, setData] = useState<SoinData>(INITIAL_DATA)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAiProcessing, setIsAiProcessing] = useState(false)

    // Voice & AI
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition()
    const [showTranscript, setShowTranscript] = useState(false)

    const handleMagicFill = async () => {
        if (!transcript.trim()) return
        stopListening()
        setIsAiProcessing(true)

        try {
            console.log("Analyzing transcript:", transcript)
            const result = await structureNurseCareWithAI(transcript)
            console.log("AI Result:", result)

            if (result) {
                // Merge intelligently
                setData(prev => ({
                    ...prev,
                    constantes: { ...prev.constantes, ...result.constantes },
                    traitement: { ...prev.traitement, ...result.traitement },
                    observation: result.observation || prev.observation,
                    incident: result.incident || prev.incident
                }))
                setShowTranscript(false)
                resetTranscript()
            }
        } catch (e) {
            console.error("Magic Fill Error:", e)
            alert("Erreur lors de l'analyse IA")
        } finally {
            setIsAiProcessing(false)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const formData = new FormData()
        formData.append('patient_id', id)
        formData.append('content', JSON.stringify(data))
        formData.append('type', 'Soin Infirmier')

        await createNote(formData)
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/patients/${id}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 p-2 rounded-lg"><Activity className="w-6 h-6" /></span>
                        Nouveau Soin Infirmier
                    </h1>
                </div>

                {/* MAGIC DICTATION BUTTONS */}
                {hasSupport && (
                    <div className="flex gap-2">
                        {!isListening ? (
                            <button
                                onClick={() => { setShowTranscript(true); startListening(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                            >
                                <Mic className="w-4 h-4" />
                                <span>Magic Dictée</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleMagicFill}
                                disabled={isAiProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 animate-pulse-slow shadow-lg"
                            >
                                {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                <span>Terminer & Remplir</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* TRANSCRIPT PREVIEW */}
            {showTranscript && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            En écoute...
                        </span>
                        <button onClick={() => { stopListening(); setShowTranscript(false); }} className="text-xs text-gray-500 hover:text-gray-700 underline">Annuler</button>
                    </div>
                    <p className="text-indigo-900 text-lg font-medium leading-relaxed min-h-[60px]">
                        {transcript || "Parlez maintenant (ex: 'Tension 12 8, température 37 5, patient calme...')"}
                    </p>
                </div>
            )}

            <div className="grid gap-6">

                {/* 1. CONSTANTES */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" /> Constantes Vitales
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Tension</label>
                            <input
                                type="text"
                                placeholder="12/8"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.constantes.tension}
                                onChange={e => setData({ ...data, constantes: { ...data.constantes, tension: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Pouls (bpm)</label>
                            <input
                                type="number"
                                placeholder="72"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.constantes.pouls}
                                onChange={e => setData({ ...data, constantes: { ...data.constantes, pouls: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Temp (°C)</label>
                            <input
                                type="number"
                                placeholder="37.0"
                                step="0.1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.constantes.temperature}
                                onChange={e => setData({ ...data, constantes: { ...data.constantes, temperature: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">SpO2 (%)</label>
                            <input
                                type="number"
                                placeholder="98"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.constantes.saturation}
                                onChange={e => setData({ ...data, constantes: { ...data.constantes, saturation: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Poids (kg)</label>
                            <input
                                type="number"
                                placeholder="70"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.constantes.poids}
                                onChange={e => setData({ ...data, constantes: { ...data.constantes, poids: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. TRAITEMENT */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-purple-500" /> Administration Traitement
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-8">
                            <label className="flex items-center gap-2 cursor-pointer bg-green-50 px-3 py-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                                <input
                                    type="checkbox"
                                    className="rounded text-green-600 focus:ring-green-500 h-5 w-5"
                                    checked={data.traitement.distribution}
                                    onChange={e => setData({ ...data, traitement: { ...data.traitement, distribution: e.target.checked } })}
                                />
                                <span className="text-green-900 font-medium">Traitement distribué</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer bg-red-50 px-3 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                                <input
                                    type="checkbox"
                                    className="rounded text-red-600 focus:ring-red-500 h-5 w-5"
                                    checked={data.traitement.refus}
                                    onChange={e => setData({ ...data, traitement: { ...data.traitement, refus: e.target.checked } })}
                                />
                                <span className="text-red-900 font-medium">Refus de traitement</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Si besoin / Ponctuel administré :</label>
                            <input
                                type="text"
                                placeholder="Ex: Loxapac 50mg pour agitation..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors"
                                value={data.traitement.si_besoin}
                                onChange={e => setData({ ...data, traitement: { ...data.traitement, si_besoin: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. OBSERVATIONS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-orange-500" /> Observations Infirmier
                    </h2>
                    <textarea
                        rows={6}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-colors"
                        placeholder="Comportement, sommeil, participation aux activités..."
                        value={data.observation}
                        onChange={e => setData({ ...data, observation: e.target.value })}
                    />

                    <div className="mt-4">
                        <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-md border transition-all ${data.incident ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100 hover:bg-red-100'}`}>
                            <input
                                type="checkbox"
                                className="rounded text-red-600 focus:ring-red-500 h-5 w-5"
                                checked={data.incident}
                                onChange={e => setData({ ...data, incident: e.target.checked })}
                            />
                            <span className="text-red-800 font-bold">⚠️ INCIDENT À SIGNALER (Agitation, Fugue, Violence...)</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isAiProcessing}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Valider le Soin
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
