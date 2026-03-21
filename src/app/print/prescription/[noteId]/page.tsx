import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PrintButton } from '@/components/print/PrintButton'

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
        <div className="min-h-screen bg-white text-black p-0 sm:p-8 flex flex-col items-center">
            {/* Styles CSS spécifiques pour l'impression A5 */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    size: A5;
                    margin: 0;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                .prescription-container {
                    width: 148mm;
                    min-height: 210mm;
                    padding: 0;
                    margin: 0;
                    position: relative;
                    background: white;
                    display: flex;
                    flex-direction: column;
                }
            `}} />

            <div className="prescription-container shadow-2xl print:shadow-none">
                {/* EN-TÊTE IMAGE */}
                <div className="w-full">
                    <img 
                        src="/ordonnace entete.png" 
                        alt="En-tête" 
                        className="w-full h-auto object-contain"
                    />
                </div>

                {/* CONTENU PRINCIPAL */}
                <div className="px-10 py-6 flex-1 flex flex-col">
                    {/* DATE ET LIEU */}
                    <div className="flex justify-end mb-6">
                        <div className="text-right font-medium">
                            <p className="text-sm">Tanger le : <span className="border-b border-dotted border-black px-4">{date}</span></p>
                        </div>
                    </div>

                    {/* TITRE */}
                    <h1 className="text-center text-3xl font-bold underline mb-10 tracking-widest text-[#2c3e50]">
                        ORDONNANCE
                    </h1>

                    {/* PATIENT INFO (Subtil) */}
                    <div className="mb-8 italic text-slate-700">
                        <p>Patient(e) : <span className="font-bold not-italic">{patient.first_name} {patient.last_name}</span></p>
                    </div>

                    {/* CORPS DE L'ORDONNANCE (LISTE DE MÉDICAMENTS) */}
                    <div className="flex-1">
                        <div className="space-y-4 font-serif text-lg">
                            {content.prescriptions && content.prescriptions.length > 0 ? (
                                <ul className="space-y-6">
                                    {content.prescriptions.map((p: any, idx: number) => (
                                        <li key={p.id || idx} className="border-l-4 border-slate-200 pl-4 py-1">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xl uppercase tracking-tight">{p.nom}</span>
                                                <div className="flex gap-4 text-base italic text-slate-600 mt-1">
                                                    {p.dosage && <span>{p.dosage}</span>}
                                                    {p.frequence && <span>- {p.frequence}</span>}
                                                    {p.duree && <span>- Pendant {p.duree}</span>}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {content.ordonnance || content.suivi || prescriptionText}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* PROCHAIN RENDEZ-VOUS INDICATEUR (Comme sur le modèle) */}
                    <div className="mt-12 pt-4 border-t border-slate-100 italic text-slate-500 text-sm">
                        <p>Prochain Rendez-vous : <span className="text-black not-italic font-bold ml-1">{content.prochain_rdv || "................................................................"}</span></p>
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

            {/* BOUTON D'IMPRESSION (Composant Client) */}
            <PrintButton />
        </div>
    )
}
