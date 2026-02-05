import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function PrintPrescriptionPage({ params }: { params: Promise<{ noteId: string }> }) {
    const supabase = await createClient()
    const { noteId } = await params

    // 1. Fetch Note with Patient and Doctor info
    const { data: note } = await supabase
        .from('notes')
        .select(`
            *,
            patient:patients(*),
            doctor:profiles(*)
        `)
        .eq('id', noteId)
        .single()

    if (!note) notFound()

    const patient = note.patient
    const doctor = note.doctor
    const content = typeof note.content === 'string' ? JSON.parse(note.content) : note.content

    // Extraction du contenu (Prescription/Traitement)
    // On essaie de trouver 'suivi', 'traitement', ou 'conclusion' qui pourrait contenir l'ordonnance.
    const prescriptionText = content.suivi || content.traitement?.si_besoin || content.text || "Aucune prescription spécifique."

    // Date
    const date = format(new Date(note.created_at), 'd MMMM yyyy', { locale: fr })

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">

            {/* EN-TÊTE HÔPITAL (Visible uniquement à l'impression souvent, mais ici on l'affiche tout le temps) */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Hôpital Psychiatrique</h1>
                    <h2 className="text-lg font-semibold text-gray-700">Service de Psychiatrie Adulte</h2>
                    <p className="text-xs text-gray-500 mt-1">123 Avenue de la Santé, 75000 Ville</p>
                    <p className="text-xs text-gray-500">Tél: 01 23 45 67 89</p>
                </div>
                <div className="text-right">
                    <h3 className="text-xl font-bold">Dr. {doctor?.full_name || 'Médecin'}</h3>
                    <p className="text-sm">Psychiatre</p>
                    <p className="text-sm">RPPS: 1000xxxxxxx</p>
                </div>
            </div>

            {/* INFO PATIENT */}
            <div className="mb-12">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="font-bold text-sm">Le {date}</span>
                    <span className="font-bold text-sm">Lieu: Consultation Externe</span>
                </div>
                <div className="border border-black p-4 rounded-lg bg-gray-50 print:bg-transparent">
                    <p className="font-bold text-lg mb-1">
                        Patient : {patient.first_name} {patient.last_name}
                    </p>
                    <div className="flex gap-6 text-sm">
                        <span>Né(e) le : {format(new Date(patient.birth_date), 'dd/MM/yyyy')}</span>
                        <span>Âge : {new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} ans</span>
                        <span>N° Dossier : {patient.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* ORDONNANCE / CONTENU */}
            <div className="min-h-[400px]">
                <h3 className="text-center text-xl font-bold underline mb-8">ORDONNANCE</h3>

                <div className="prose max-w-none text-lg leading-relaxed whitespace-pre-wrap font-serif">
                    {/* Si c'est un tableau de médocs (futur), on map. Ici c'est du texte libre ou structuré */}
                    {prescriptionText}
                </div>
            </div>

            {/* PIED DE PAGE / SIGNATURE */}
            <div className="mt-16 flex justify-end">
                <div className="w-1/3 text-center">
                    <p className="mb-12 italic">Signature et Cachet :</p>
                    <div className="border-t border-black w-full"></div>
                    <p className="text-xs mt-2">Ce document est valide sans signature manuscrite si transmis via messagerie sécurisée.</p>
                </div>
            </div>

            {/* MENTION LÉGALE IMPRESSION */}
            <div className="fixed bottom-4 left-0 w-full text-center text-[10px] text-gray-400 print:block hidden">
                Imprimé via MedNote AI le {new Date().toLocaleString('fr-FR')} - Document confidentiel.
            </div>

            {/* BOUTON D'IMPRESSION (Visible écran uniquement) */}
            <div className="fixed bottom-8 right-8 print:hidden">
                <button
                    onClick={() => {
                        window.print()
                    }} // Ce code sera hydraté côté client via un petit script ou juste onClick inline si 'use client'
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* Script auto-print pour simplifier */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // document.getElementById('print-btn').onclick = () => window.print();
            `}} />
        </div>
    )
}
