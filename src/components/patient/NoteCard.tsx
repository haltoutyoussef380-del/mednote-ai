import { FileText, Activity, Clock, ChevronRight } from 'lucide-react'

interface NoteCardProps {
    note: any // We'll refine this type later if possible
}

export function NoteCard({ note }: NoteCardProps) {
    const isWizardFormat = typeof note.content === 'object' && note.content !== null

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'consultation': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'urgence': return 'bg-red-50 text-red-700 border-red-200'
            case 'suivi': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="relative pl-8 pb-12 last:pb-0">
            {/* Timeline Line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />

            {/* Timeline Dot */}
            <div className={`absolute left-[-5px] top-6 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-100 ${note.type === 'Urgence' ? 'bg-red-500' : 'bg-primary'
                }`} />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
                {/* Header */}
                <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(note.type)}`}>
                            {note.type}
                        </div>
                        <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(note.created_at)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {!isWizardFormat ? (
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content || "Contenu non disponible"}</p>
                    ) : (
                        <div className="space-y-4">
                            {/* Motif - Highlighted */}
                            {note.content.motif && (
                                <div className="p-3 bg-indigo-50/50 rounded-md border border-indigo-100/50">
                                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <Activity className="w-3 h-3" /> Motif
                                    </h4>
                                    <p className="text-gray-800 font-medium">{note.content.motif}</p>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Antécédents */}
                                {(note.content.antecedents?.personnels || note.content.antecedents?.familiaux) && (
                                    <div className="text-sm">
                                        <h5 className="font-semibold text-gray-900 mb-1">Antécédents</h5>
                                        <ul className="list-disc list-inside text-gray-600 space-y-0.5 ml-1">
                                            {note.content.antecedents.personnels && <li>Perso: {note.content.antecedents.personnels}</li>}
                                            {note.content.antecedents.familiaux && <li>Fam: {note.content.antecedents.familiaux}</li>}
                                        </ul>
                                    </div>
                                )}

                                {note.content.examen && Object.keys(note.content.examen).length > 0 && (
                                    <div className="text-sm">
                                        <h5 className="font-semibold text-gray-900 mb-1">Examen</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(note.content.examen).map(([k, v]) => (
                                                v ? <span key={k} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                                                    {k}: {String(v)}
                                                </span> : null
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Other Fields */}
                            {note.content.histoire && (
                                <div className="text-sm">
                                    <h5 className="font-semibold text-gray-900">Histoire de la maladie</h5>
                                    <p className="text-gray-600 leading-relaxed">{note.content.histoire}</p>
                                </div>
                            )}
                            {note.content.biographie && (
                                <div className="text-sm">
                                    <h5 className="font-semibold text-gray-900">Biographie</h5>
                                    <p className="text-gray-600 leading-relaxed">{note.content.biographie}</p>
                                </div>
                            )}

                            {/* Diagnostic & Conclusion */}
                            {(note.content.diagnostic || note.content.conclusion) && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {note.content.diagnostic && (
                                        <div className="mb-2">
                                            <span className="text-sm font-bold text-gray-900 block">Diagnostic:</span>
                                            <p className="text-gray-800">{note.content.diagnostic}</p>
                                        </div>
                                    )}
                                    {note.content.conclusion && (
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 block">Conclusion:</span>
                                            <p className="text-gray-600">{note.content.conclusion}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {note.content.suivi && (
                                <div className="mt-2 bg-emerald-50/50 p-3 rounded border border-emerald-100">
                                    <span className="text-sm font-bold text-emerald-900 block">Suivi / Traitement:</span>
                                    <p className="text-emerald-800 text-sm">{note.content.suivi}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* AI Summary Footer */}
                {note.ai_summary && (
                    <div className="bg-gradient-to-r from-violet-50 via-white to-white px-5 py-3 border-t border-gray-100 flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-violet-600">IA</span>
                            </div>
                        </div>
                        <p className="text-sm text-violet-800/80 italic">{note.ai_summary}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
