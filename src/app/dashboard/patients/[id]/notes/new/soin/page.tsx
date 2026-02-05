'use client'

import { useState, use, useEffect } from 'react'
import { createNote, structureNurseCareWithAI } from '@/app/dashboard/notes/actions'
import { transcribeAudio } from '@/app/actions/audio'
import { Save, Activity, Pill, Eye, ArrowLeft, Mic, Sparkles, Loader2, StopCircle } from 'lucide-react'
import Link from 'next/link'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

// Check for browser support
const hasMediaRecorder = typeof window !== 'undefined' && !!window.MediaRecorder;

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

    // Voice & AI (Whisper)
    const { isRecording, startRecording, stopRecording, audioBlob, resetRecording } = useAudioRecorder()
    const [transcript, setTranscript] = useState("")

    // Effect: Trigger transcription when audioBlob is ready
    useEffect(() => {
        if (audioBlob) {
            handleTranscribe()
        }
    }, [audioBlob])

    const handleTranscribe = async () => {
        if (!audioBlob) return
        setIsAiProcessing(true)

        try {
            // 1. Convert Blob to File
            const file = new File([audioBlob], "dictation.webm", { type: 'audio/webm' })
            const formData = new FormData()
            formData.append('file', file)

            // 2. Send to Groq Whisper
            console.log("Sending audio to Whisper...")
            const { text, error } = await transcribeAudio(formData)

            if (error) throw new Error(error)
            if (!text) throw new Error("No transcription received")

            console.log("Whisper Text:", text)
            setTranscript(text)

            // 3. Structure with Llama 3
            console.log("Structuring with AI...")
            const result = await structureNurseCareWithAI(text)
            console.log("AI Result:", result)

            if (result) {
                setData(prev => ({
                    ...prev,
                    constantes: { ...prev.constantes, ...result.constantes },
                    traitement: { ...prev.traitement, ...result.traitement },
                    observation: result.observation || prev.observation,
                    incident: result.incident || prev.incident
                }))
            }
            // Cleanup
            resetRecording()

        } catch (e) {
            console.error("Magic Fill Error:", e)
            alert("Erreur lors de l'analyse vocale. Veuillez réessayer.")
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

                {/* MAGIC DICTATION BUTTONS (WHISPER) */}
                {hasMediaRecorder && (
                    <div className="flex gap-2">
                        {isAiProcessing ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-full animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Analyse IA en cours...</span>
                            </div>
                        ) : (
                            !isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                                >
                                    <Mic className="w-4 h-4" />
                                    <span>Magic Dictée (HD)</span>
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 animate-pulse shadow-lg"
                                >
                                    <StopCircle className="w-4 h-4" />
                                    <span>Terminer & Analyser</span>
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* TRANSCRIPT PREVIEW (Optional) */}
            {transcript && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 relative group">
                    <p className="text-indigo-900 text-sm font-medium leading-relaxed italic">
                        "{transcript}"
                    </p>
                    <button
                        onClick={() => setTranscript("")}
                        className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                        Masquer
                    </button>
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
