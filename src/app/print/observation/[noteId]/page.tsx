import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PrintButton } from '@/components/print/PrintButton'
import { Activity, ClipboardList, User, Calendar, Stethoscope } from 'lucide-react'

export default async function PrintObservationPage({ params }: { params: Promise<{ noteId: string }> }) {
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
    const content = (typeof note.content === 'string' ? JSON.parse(note.content) : note.content) as any
    const examenEntries = content.examen ? Object.entries(content.examen).filter(([_, v]) => !!v) : []
    const date = format(new Date(note.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })

    return (
        <div className="min-h-screen bg-white text-black p-0 sm:p-12 flex flex-col items-center">
            {/* Styles CSS spécifiques pour l'impression A4 */}
            <style dangerouslySetInnerHTML={{ __html: `
                @page {
                    size: A4;
                    margin: 20mm;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                .observation-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 0;
                    margin: 0 auto;
                    background: white;
                    display: flex;
                    flex-direction: column;
                }
            `}} />

            <div className="observation-container shadow-2xl print:shadow-none p-12 border border-gray-100 print:border-none">
                {/* EN-TÊTE PROFESSIONNEL */}
                <div className="flex justify-between items-start border-b-2 border-primary/20 pb-8 mb-10">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary">MedNote <span className="text-gray-900">AI</span></h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Hôpital Universitaire de Psychiatrie</p>
                        <div className="mt-4 text-sm text-gray-600">
                            <p className="font-bold">Dr. {doctor?.full_name || 'Enseignant Chercheur'}</p>
                            <p>Spécialiste en Psychiatrie</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <Calendar className="w-4 h-4" />
                            <p>Date: <span className="font-bold text-gray-900">{date}</span></p>
                        </div>
                        <p>Dossier N°: <span className="font-bold text-gray-900">{patient.id.slice(0, 8).toUpperCase()}</span></p>
                    </div>
                </div>

                {/* TITRE DU DOCUMENT */}
                <h2 className="text-center text-2xl font-black uppercase tracking-widest mb-12 border-y py-4 border-gray-100">
                    Observation Médicale
                </h2>

                {/* PATIENT INFO CARD */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-10 flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Patient</p>
                            <p className="text-xl font-black uppercase tracking-tight">{patient.last_name} {patient.first_name}</p>
                            <p className="text-sm text-gray-500">{patient.cin || 'N° CIN non renseigné'} • {patient.gender === 'M' ? 'Homme' : 'Femme'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Type de consultation</p>
                         <p className="text-lg font-bold text-primary">{note.type || 'Standard'}</p>
                    </div>
                </div>

                {/* CLINICAL CONTENT */}
                <div className="space-y-10 flex-1">
                    {/* Motif */}
                    {content.motif && (
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4" /> Motif de consultation
                            </h3>
                            <div className="pl-6 border-l-2 border-gray-100">
                                <p className="text-gray-800 leading-relaxed font-semibold">{content.motif}</p>
                            </div>
                        </div>
                    )}

                    {/* Histoire */}
                    {content.histoire && (
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-3">
                                <ClipboardList className="w-4 h-4" /> Histoire de la maladie
                            </h3>
                            <div className="pl-6 border-l-2 border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {content.histoire}
                            </div>
                        </div>
                    )}

                    {/* Examen Clinique */}
                    {content.examen && Object.keys(content.examen).length > 0 && (
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-3">
                                <Stethoscope className="w-4 h-4" /> État Mental / Examen
                            </h3>
                            <div className="pl-6 border-l-2 border-gray-100">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                    {examenEntries.map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-[10px] font-black uppercase text-gray-400">{key}</span>
                                            <span className="text-sm font-bold text-gray-800">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnostic / Conclusion */}
                    {(content.diagnostic || content.conclusion) && (
                        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                            {content.diagnostic && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Diagnostic Retenu</h4>
                                    <p className="text-xl font-black text-gray-900 leading-tight">{content.diagnostic}</p>
                                </div>
                            )}
                            {content.conclusion && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Conclusion Médicale</h4>
                                    <p className="text-gray-700 leading-relaxed">{content.conclusion}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Traitement / Plan de soin */}
                    {content.suivi && (
                        <div className="mt-8">
                             <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Traitement & Conduite à tenir</h4>
                             <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 whitespace-pre-wrap">
                                 {content.suivi}
                             </div>
                        </div>
                    )}
                </div>

                {/* SIGNATURE AREA */}
                <div className="mt-20 flex justify-end">
                    <div className="text-center w-64 border-t border-gray-200 pt-4">
                        <p className="text-xs font-bold text-gray-400 mb-12 uppercase tracking-widest">Cachet et Signature</p>
                        <p className="text-sm font-black">Dr. {doctor?.full_name}</p>
                    </div>
                </div>
            </div>

            {/* BOUTON D'IMPRESSION */}
            <PrintButton label="Imprimer l'Observation" />
        </div>
    )
}
