'use client'

import { createPatient, extractPatientInfoAction } from '../actions'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useState, useEffect } from 'react'
import { Loader2, Mic, Save, Sparkles, UserPlus } from 'lucide-react'

const MOROCCAN_CITIES = [
    "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kenitra", "Tetouan",
    "Safi", "Mohammedia", "Khouribga", "El Jadida", "Béni Mellal", "Nador", "Taza", "Settat", "Berrechid",
    "Khemisset", "Guelmim", "Larache", "Ksar El Kebir", "Ouarzazate", "Errachidia", "Inezgane", "Dakhla", "Laayoune", "Essaouira"
].sort();

export default function NewPatientPage() {
    const { isListening, transcript, startListening, stopListening, hasSupport } = useSpeechRecognition();
    const [isExtracting, setIsExtracting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // State pour l'affichage conditionnel du champ "Autre Mutuelle"
    const [insuranceType, setInsuranceType] = useState('');

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
        phone: '',
        // Nouveaux champs
        cine: '',
        address: '',
        city: 'Casablanca', // Default
        insurance_provider: '',
        insurance_id: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Custom logic for Insurance dropdown
        if (name === 'insurance_provider_select') {
            setInsuranceType(value);
            // Si ce n'est pas "Autre", on met directement la valeur dans le vrai champ
            if (value !== 'Autre') {
                setFormData(prev => ({ ...prev, insurance_provider: value }));
            } else {
                // Si c'est autre, on vide pour laisser l'utilisateur taper
                setFormData(prev => ({ ...prev, insurance_provider: '' }));
            }
        }
    };

    const handleExtraction = async (text: string) => {
        if (!text.trim()) return;
        setIsExtracting(true);
        try {
            const result = await extractPatientInfoAction(text);
            if (result && result.success && result.data) {
                const extracted = result.data;
                setFormData(prev => ({
                    ...prev,
                    first_name: extracted.first_name || prev.first_name,
                    last_name: extracted.last_name || prev.last_name,
                    birth_date: extracted.birth_date || prev.birth_date,
                    gender: extracted.gender || prev.gender,
                    email: extracted.email || prev.email,
                    phone: extracted.phone || prev.phone,
                    cine: (extracted as any).cine || prev.cine,
                    address: (extracted as any).address || prev.address
                }));
                alert(`Succès ! Données extraites pour : ${extracted.first_name || '?'} ${extracted.last_name || '?'}`);
            } else {
                alert(`Échec de l'extraction. Réessayez.`);
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
            handleExtraction(transcript);
        } else {
            startListening();
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-2">
                        <UserPlus className="w-8 h-8 text-primary" />
                        Nouveau Patient
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Création d'un dossier administratif et génération automatique du matricule.</p>
                </div>
                {/* Voice Dictation Button */}
                {isMounted && hasSupport && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isExtracting}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset transition-all ${isListening
                            ? 'bg-red-50 text-red-700 ring-red-600 animate-pulse'
                            : 'bg-white text-primary ring-blue-100 hover:bg-blue-50'
                            }`}
                    >
                        {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                        {isListening ? 'Arrêter et Remplir' : 'Dictée Magique (IA)'}
                    </button>
                )}
            </div>

            {/* Transcript Display */}
            {(isListening || transcript) && (
                <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm">
                    <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Dictée en cours
                    </h4>
                    <p className="text-blue-800 italic">"{transcript}"</p>
                    {!isListening && (
                        <button onClick={() => handleExtraction(transcript)} className="mt-2 text-xs font-medium text-blue-700 hover:underline">
                            Ré-analyser le texte
                        </button>
                    )}
                </div>
            )}

            <form action={createPatient} className="space-y-6">

                {/* SECTION 1: ETAT CIVIL */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">État Civil</h3>
                    </div>
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Prénom *</label>
                                <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Nom *</label>
                                <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Date de naissance *</label>
                                <input type="date" name="birth_date" required value={formData.birth_date} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Genre</label>
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3">
                                    <option value="M">Homme</option>
                                    <option value="F">Femme</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">CINE</label>
                                <input type="text" name="cine" placeholder="ex: AB123456" value={formData.cine} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3 uppercase" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: COORDONNÉES */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Coordonnées</h3>
                    </div>
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Téléphone Mobile</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Adresse Complète</label>
                                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Ville</label>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                                >
                                    {MOROCCAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Zip Code Removed */}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: COUVERTURE MÉDICALE */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Couverture Médicale</h3>
                    </div>
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Organisme</label>
                                <select
                                    name="insurance_provider_select"
                                    value={insuranceType}
                                    onChange={handleInputChange}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                                >
                                    <option value="">Aucune / Non spécifié</option>
                                    <option value="CNSS">CNSS</option>
                                    <option value="CNOPS">CNOPS</option>
                                    <option value="AMO">AMO</option>
                                    <option value="Autre">Autre (Préciser)</option>
                                </select>

                                {insuranceType === 'Autre' && (
                                    <input
                                        type="text"
                                        name="insurance_provider"
                                        placeholder="Précisez le nom de la mutuelle"
                                        value={formData.insurance_provider}
                                        onChange={handleInputChange}
                                        className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                                    />
                                )}
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">N° Immatriculation / Affiliation</label>
                                <input type="text" name="insurance_id" value={formData.insurance_id} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-4">
                    <button type="button" className="text-sm font-semibold leading-6 text-gray-900" onClick={() => window.history.back()}>
                        Annuler
                    </button>
                    <button type="submit" className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        <Save className="w-4 h-4" />
                        Enregistrer le Dossier
                    </button>
                </div>
            </form>
        </div>
    )
}
