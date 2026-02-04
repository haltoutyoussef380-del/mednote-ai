import { NoteCard } from './NoteCard'

interface NoteTimelineProps {
    notes: any[]
}

export function NoteTimeline({ notes }: NoteTimelineProps) {
    if (!notes || notes.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Aucune note médicale enregistrée pour ce patient.</p>
                <p className="text-sm text-gray-400 mt-1">Commencez par ajouter une première consultation.</p>
            </div>
        )
    }

    return (
        <div className="mt-8 ml-4">
            {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
            ))}
        </div>
    )
}
