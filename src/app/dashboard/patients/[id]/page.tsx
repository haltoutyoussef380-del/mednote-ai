import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PatientHeader } from '@/components/patient/PatientHeader'
import { NoteTimeline } from '@/components/patient/NoteTimeline'
import { Plus, Activity } from 'lucide-react'
import { PatientChatWidget } from '@/components/patient/PatientChatWidget'

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

    // Fetch user and profile for Role Check
    const { data: { user } } = await supabase.auth.getUser()
    let userRole = null

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        userRole = profile?.role
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* 1. En-tête Patient (Carte Identité) */}
            <PatientHeader patient={patient} />

            {/* 2. Actions & Titre Timeline */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Dossier Médical
                        <span className="flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                            {notes?.length || 0}
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Historique complet des consultations et suivis.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Hide Consultation button for Nurses */}
                    {userRole !== 'infirmier' && (
                        <Link
                            href={`/dashboard/patients/${id}/notes/new`}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvelle Consultation
                        </Link>
                    )}

                    <Link
                        href={`/dashboard/patients/${id}/notes/new/soin`}
                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Activity className="w-4 h-4 text-green-600" />
                        Soin Infirmier
                    </Link>
                </div>
            </div>

            {/* 3. Timeline des Notes */}
            <NoteTimeline notes={notes || []} />

            {/* 4. Assistant IA (Flottant) */}
            <PatientChatWidget patientId={patient.id} patientName={`${patient.first_name} ${patient.last_name}`} />
        </div>
    )
}
