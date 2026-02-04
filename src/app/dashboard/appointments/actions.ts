'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAppointment(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Unauthorized")
    }

    const patient_id = formData.get('patient_id') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const type = formData.get('type') as string
    const notes = formData.get('notes') as string

    // Combine date and time
    const fullDate = new Date(`${date}T${time}`)

    const { error } = await supabase.from('appointments').insert({
        doctor_id: user.id,
        patient_id,
        date: fullDate.toISOString(),
        type,
        notes,
        status: 'programmé',
        created_by: user.id
    })

    if (error) {
        console.error("Error creating appointment:", error)
        // In a real app, we would return the error, but for now we'll just log
        return { error: error.message }
    }

    revalidatePath('/dashboard/appointments')
    // Revalidation du dashboard général car il pourrait y avoir un widget
    revalidatePath('/dashboard')
}
