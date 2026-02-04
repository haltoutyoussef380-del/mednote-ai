import { createClient } from '@/lib/supabase/server'
import { PatientChatWidget } from '@/components/patient/PatientChatWidget'

export default async function PatientLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch minimal patient info for the Chat Widget
    const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', id)
        .single()

    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient"

    return (
        <>
            {children}
            {/* The Chat Widget is floating, so it can sit here */}
            <PatientChatWidget patientId={id} patientName={patientName} />
        </>
    )
}
