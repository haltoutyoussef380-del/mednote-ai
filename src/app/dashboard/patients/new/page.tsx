'use client'

import { createPatient, extractPatientInfoAction } from '../actions'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useState, useEffect } from 'react'

export default function NewPatientPage() {
    const { isListening, transcript, startListening, stopListening, hasSupport } = useSpeechRecognition();
    const [isExtracting, setIsExtracting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Controlled form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        birth_date: '',
        gender: 'M',
        email: '',
        phone: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleExtraction = async (text: string) => {
        if (!text.trim()) return;
        setIsExtracting(true);
        try {
            const result = await extractPatientInfoAction(text);
            console.log("Client received:", result);

            if (result && result.success && result.data) {
                const extracted = result.data;
                setFormData(prev => ({
                    ...prev,
                    first_name: extracted.first_name || prev.first_name,
                    last_name: extracted.last_name || prev.last_name,
                    birth_date: extracted.birth_date || prev.birth_date,
                    gender: extracted.gender || prev.gender,
                    email: extracted.email || prev.email,
                    phone: extracted.phone || prev.phone
                }));
                alert(`Succès ! Données extraites pour : ${extracted.first_name || '?'} ${extracted.last_name || '?'}`);
            } else {
                const errorMsg = result?.error || "Erreur inconnue";
                const rawMsg = result?.raw ? `\nRéponse brute IA: ${result.raw.substring(0, 100)}...` : "";
                alert(`Échec de l'extraction.\nErreur: ${errorMsg}${rawMsg}\n\nReformulez et réessayez.`);
            }
        } catch (e) {
            console.error(e);
            alert("Impossible d'extraire les informations.");
        } finally {
            setIsExtracting(false);
        }
    }

    const toggleListening = () => {
        if (isListening) {
            stopListening();
            // Trigger extraction on stop is optional if we have the manual button
            // But good UX is to try it.
            handleExtraction(transcript);
        } else {
            startListening();
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Nouveau Patient
                    </h2>
                </div>
                {/* Voice Dictation Button */}
                {isMounted && hasSupport && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isExtracting}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-all ${isListening
                            ? 'bg-red-50 text-red-700 ring-red-600 animate-pulse'
                            : 'bg-white text-blue-700 ring-blue-300 hover:bg-blue-50'
                            }`}
                    >
                        <span className="text-xl">{isListening ? '⏹' : '✨🎤'}</span>
                        {isListening ? 'Arrêter et Remplir' : 'Dictée Magique'}
                    </button>
                )}
            </div>

            {/* Transcript Display & Manual Trigger - Visible if listening OR if there is text */}
            {(isListening || transcript) && (
                <div className={`mb-4 p-3 rounded-md border text-sm ${isListening ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <div className="font-semibold mb-1">
                        {isListening ? '🔴 Enregistrement en cours :' : '📝 Texte capturé :'}
                    </div>
                    <p className="italic mb-3">"{transcript}"</p>

                    {/* Manual Trigger Button - Visible if NOT listening and text exists */}
                    {!isListening && transcript && (
                        <button
                            type="button"
                            onClick={() => handleExtraction(transcript)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-xs font-semibold shadow-sm transition-colors"
                        >
                            🔄 Analyser et Remplir le formulaire
                        </button>
                    )}
                </div>
            )}

            {isExtracting && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100 text-gray-600 text-sm flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extraction des informations en cours...
                </div>
            )}

            <form action={createPatient} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        <div className="sm:col-span-3">
                            <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">
                                Prénom
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="first_name"
                                    id="first-name"
                                    autoComplete="given-name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                                Nom
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="last_name"
                                    id="last-name"
                                    autoComplete="family-name"
                                    required
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="birth-date" className="block text-sm font-medium leading-6 text-gray-900">
                                Date de naissance
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="birth_date"
                                    id="birth-date"
                                    required
                                    value={formData.birth_date}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="gender" className="block text-sm font-medium leading-6 text-gray-900">
                                Genre
                            </label>
                            <div className="mt-2">
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="M">Homme</option>
                                    <option value="F">Femme</option>
                                    <option value="O">Autre</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-4">
                            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                                Téléphone
                            </label>
                            <div className="mt-2">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                    </div>
                </div>
                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <button
                        type="button"
                        className="text-sm font-semibold leading-6 text-gray-900"
                        onClick={() => window.history.back()}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    )
}
