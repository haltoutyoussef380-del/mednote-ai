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
    const doctor_id = formData.get('doctor_id') as string || user.id
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const type = formData.get('type') as string
    const notes = formData.get('notes') as string

    // Combine date and time
    const fullDate = new Date(`${date}T${time}`)

    const { error } = await supabase.from('appointments').insert({
        doctor_id: doctor_id,
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
        // return { error: error.message }
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/appointments')
    // Revalidation du dashboard général car il pourrait y avoir un widget
    revalidatePath('/dashboard')
}

export async function confirmAppointment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string
    const time = formData.get('time') as string

    // Récupérer le rendez-vous actuel pour avoir la date (jour)
    const { data: appt } = await supabase.from('appointments').select('date').eq('id', id).single()
    if (!appt) throw new Error("Appointment not found")

    // Combiner la date existante avec la nouvelle heure
    const dateObj = new Date(appt.date)
    const [hours, minutes] = time.split(':')
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const { error } = await supabase.from('appointments').update({
        date: dateObj.toISOString(),
        status: 'programmé'
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')
}

export async function cancelAppointment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string

    const { error } = await supabase.from('appointments').update({
        status: 'annulé'
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')
}

export async function deleteAppointment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string

    const { error } = await supabase.from('appointments').delete().eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')
}

export async function rescheduleAppointment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string

    const fullDate = new Date(`${date}T${time}`)

    const { error } = await supabase.from('appointments').update({
        date: fullDate.toISOString(),
        status: 'programmé' // Remet en programmé si c'était à confirmer ou autre
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard')
}

export async function markAsWaiting(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string

    const { error } = await supabase.from('appointments').update({
        status: 'en attente'
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard/waiting-room')
}

export async function callPatient(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const id = formData.get('appointment_id') as string

    const { error } = await supabase.from('appointments').update({
        status: 'appelé'
    }).eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard/waiting-room')
}
