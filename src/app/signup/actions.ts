'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
    const supabase = createClient()

    // Récupération des données incluant le nouveau champ 'role'
    const last_name = formData.get('last_name') as string;
    const first_name = formData.get('first_name') as string;

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                full_name: `${first_name} ${last_name}`, // On garde full_name pour compatibilité
                last_name,
                first_name,
                cine: formData.get('cine') as string,
                mobile: formData.get('mobile') as string,
                role: formData.get('role') as string || 'medecin',
            }
        }
    }

    const { data: authData, error } = await (await supabase).auth.signUp(data)

    if (error) {
        console.error('Signup error:', error.message)
        // Redirection vers la page signup en cas d'erreur
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Gestion de la confirmation email
    if (authData.user && !authData.session) {
        redirect('/login?message=check_email')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
