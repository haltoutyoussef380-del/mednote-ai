'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { extractPatientInfo } from '@/lib/ai'

export async function extractPatientInfoAction(rawText: string) {
    return await extractPatientInfo(rawText)
}

export async function createPatient(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const rawData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        birth_date: (formData.get('birth_date') as string) || null,
        gender: formData.get('gender') as string,
        phone: (formData.get('phone') as string) || null,
        email: (formData.get('email') as string) || null,
        user_id: user.id,
        // Enriched Fields
        cine: (formData.get('cine') as string) || null,
        address: (formData.get('address') as string) || null,
        city: (formData.get('city') as string) || null,
        // zip_code removed as per user request
        insurance_provider: (formData.get('insurance_provider') as string) || null,
        insurance_id: (formData.get('insurance_id') as string) || null,
    }

    // Check if profile exists (debugging step)
    const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (profileError || !profile) {
        console.error("PROFILE ERROR: User exists in Auth but not in public.profiles table!", profileError)
        redirect('/dashboard/patients/new?error=' + encodeURIComponent("Erreur critique: Votre profil utilisateur est manquant. Contactez le support."))
    }

    console.log("Creating patient with data:", rawData)

    // Using select() forces return of data, helps catch RLS Select policy issues immediately
    const { data: insertedData, error } = await supabase.from('patients').insert(rawData).select()

    if (error) {
        console.error('SERVER ERROR creating patient:', error)
        // Keep the redirect but log thoroughly
        redirect('/dashboard/patients/new?error=' + encodeURIComponent(error.message))
    }

    if (!insertedData || insertedData.length === 0) {
        console.error("INSERT SILENT FAILURE: No error returned, but no data returned either. RLS Select blocking?")
        redirect('/dashboard/patients/new?error=' + encodeURIComponent("Erreur: Enregistrement réussi mais impossible de confirmer (RLS blocking)."))
    }

    const newPatientId = insertedData[0].id
    console.log("SUCCESS! Patient created with ID:", newPatientId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/patients')

    // Redirect to the new patient's detail page to confirm creation
    redirect(`/dashboard/patients/${newPatientId}`)
}
