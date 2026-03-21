'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        redirect('/auth/reset-password?error=Les mots de passe ne correspondent pas.')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        console.error('Update password error:', error.message)
        redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/dashboard?message=password_updated')
}
