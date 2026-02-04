import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NoteCard } from '@/components/patient/NoteCard'
import { User } from 'lucide-react'

export default async function GlobalNotesPage() {
    const supabase = await createClient()

    // Fetch all notes with patient details, sorted by most recent
    const { data: notes } = await supabase
        .from('notes')
        .select('*, patients(id, first_name, last_name, gender)')
        .order('created_at', { ascending: false })
        .limit(50) // Limit to 50 most recent for performance

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Fil d'actualité médical</h1>
                    <p className="text-sm text-gray-500 mt-1">Dernières consultations et mises à jour de tous vos patients.</p>
                </div>
            </div>

            <div className="space-y-8">
                {notes?.map((note) => (
                    <div key={note.id} className="relative group">
                        {/* Patient Context Header */}
                        <div className="absolute -left-3 top-4 -bottom-4 w-0.5 bg-gray-100 group-last:hidden md:block hidden"></div>

                        <div className="mb-2 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm z-10">
                                <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <Link
                                href={`/dashboard/patients/${(note as any).patients.id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-primary hover:underline"
                            >
                                {(note as any).patients.first_name} {(note as any).patients.last_name}
                            </Link>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{(note as any).patients.gender}</span>
                        </div>

                        {/* Reusing the NoteCard */}
                        <div className="ml-3 sm:ml-10">
                            <NoteCard note={note} />
                        </div>
                    </div>
                ))}

                {(!notes || notes.length === 0) && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">Aucune note trouvée.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
