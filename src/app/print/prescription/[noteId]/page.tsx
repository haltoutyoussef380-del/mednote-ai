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
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-3xl font-black tracking-[0.3em] text-[#1e293b] uppercase">
                            Ordonnance
                        </h1>
                        <div className="w-24 h-1 bg-primary mt-2 rounded-full"></div>
                    </div>

                    {/* PATIENT INFO (Elegant Badge) */}
                    <div className="mb-10 flex items-center justify-between bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Patient(e)</span>
                            <span className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">{patient.last_name} {patient.first_name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Consultation du</span>
                            <span className="text-sm font-bold text-gray-800">{date}</span>
                        </div>
                    </div>

                    {/* CORPS DE L'ORDONNANCE */}
                    <div className="flex-1">
                        <div className="space-y-6 font-serif">
                            {content.prescriptions && content.prescriptions.length > 0 ? (
                                <div className="space-y-6">
                                    {content.prescriptions.map((p: any, idx: number) => (
                                        <div key={p.id || idx} className="flex flex-col border-b border-dashed border-gray-100 pb-4 last:border-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Rx: {p.nom}</span>
                                                {p.dosage && <span className="text-lg font-bold text-gray-600">({p.dosage})</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-base italic text-indigo-900/60 font-medium mt-1">
                                                {p.frequence && (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30"></span>
                                                        {p.frequence}
                                                    </span>
                                                )}
                                                {p.duree && (
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30"></span>
                                                        Pendant {p.duree}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xl leading-loose text-gray-800 whitespace-pre-wrap pl-6 border-l-4 border-primary/10">
                                    {content.ordonnance || content.suivi || prescriptionText}
                                </div>
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
            <PrintButton label="Imprimer l'Ordonnance" />
        </div>
    )
}
