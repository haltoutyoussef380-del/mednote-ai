
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch patient details
    const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

    if (!patient) {
        notFound()
    }

    // Fetch patient notes
    const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {patient.first_name} {patient.last_name}
                    </h2>
                    <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            Né(e) le: {patient.birth_date} | Genre: {patient.gender}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            {patient.email} | {patient.phone}
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href={`/dashboard/patients/${id}/notes/new`}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                    >
                        Ajouter une note
                    </Link>
                </div>
            </div>

            {/* Notes Timeline/List */}
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">Historique des Consultations</h3>

                <div className="space-y-4">
                    {notes?.map((note) => (
                        <div key={note.id} className="relative flex gap-x-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex-auto">
                                <div className="flex items-baseline justify-between gap-x-4">
                                    <p className="text-sm font-semibold leading-6 text-gray-900">
                                        {note.type}
                                    </p>
                                    <p className="flex-none text-xs text-gray-500">
                                        {new Date(note.created_at).toLocaleDateString('fr-FR', {
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                                    {/* Handling different note formats */}
                                    {typeof note.content === 'string' ? (
                                        note.content
                                    ) : (note.content as any)?.motif ? (
                                        // Format Observation Psychiatrique (Wizard)
                                        // Format Observation Psychiatrique (Wizard)
                                        <div className="space-y-3 text-sm">
                                            {/* Motif */}
                                            {(note.content as any).motif && (
                                                <div><span className="font-bold text-gray-900">1. Motif : </span>{(note.content as any).motif}</div>
                                            )}

                                            {/* Antécédents */}
                                            {(note.content as any).antecedents && (
                                                <div>
                                                    <span className="font-bold text-gray-900">2. Antécédents : </span>
                                                    <div className="ml-4 text-gray-700">
                                                        {(note.content as any).antecedents.type && <div>- Type: {(note.content as any).antecedents.type}</div>}
                                                        {(note.content as any).antecedents.details && <div>- Personnels: {(note.content as any).antecedents.details}</div>}
                                                        {(note.content as any).antecedents.familiaux && <div>- Familiaux: {(note.content as any).antecedents.familiaux}</div>}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Biographie */}
                                            {(note.content as any).biographie && (
                                                <div><span className="font-bold text-gray-900">3. Biographie : </span>{(note.content as any).biographie}</div>
                                            )}

                                            {/* Histoire */}
                                            {(note.content as any).histoire && (
                                                <div><span className="font-bold text-gray-900">4. Histoire de la maladie : </span>{(note.content as any).histoire}</div>
                                            )}

                                            {/* Examen */}
                                            {(note.content as any).examen && (
                                                <div>
                                                    <span className="font-bold text-gray-900">5. Examen Psychiatrique : </span>
                                                    <div className="ml-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded mt-1 border">
                                                        {Object.entries((note.content as any).examen || {}).map(([key, val]) => (
                                                            val ? <div key={key}><span className="font-semibold capitalize">{key}:</span> {val as string}</div> : null
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Conclusion, Diagnostic, Suivi */}
                                            {(note.content as any).conclusion && (
                                                <div><span className="font-bold text-gray-900">6. Conclusion : </span>{(note.content as any).conclusion}</div>
                                            )}
                                            {(note.content as any).diagnostic && (
                                                <div><span className="font-bold text-gray-900">7. Diagnostic : </span>{(note.content as any).diagnostic}</div>
                                            )}
                                            {(note.content as any).suivi && (
                                                <div><span className="font-bold text-gray-900">8. Suivi / Traitement : </span>{(note.content as any).suivi}</div>
                                            )}
                                        </div>
                                    ) : (
                                        // Format Legacy / Simple Note
                                        (note.content as any)?.text || "Contenu non affichable"
                                    )}
                                </div>

                                {note.ai_summary && (
                                    <div className="mt-4 bg-secondary/30 p-3 rounded-md border border-secondary">
                                        <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Résumé IA</h4>
                                        <p className="text-sm text-primary/80">{note.ai_summary}</p>
                                    </div>
                                )}

                                {!note.ai_summary && (
                                    <div className="mt-4 flex gap-2">
                                        <button className="text-xs font-medium text-primary hover:underline">
                                            Générer le résumé IA (à venir)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {(!notes || notes.length === 0) && (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-sm text-gray-500">Aucune note médicale enregistrée pour ce patient.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
