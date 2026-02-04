'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to get Admin Client safely
function getAdminClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
        throw new Error("La clé SUPABASE_SERVICE_ROLE_KEY est manquante dans le fichier .env")
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function createUser(formData: FormData) {
    // 1. Check if current user is Admin
    const supabase = await createServerClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: "Non authentifié" }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (currentProfile?.role !== 'admin') {
        return { error: "Accès refusé. Réservé aux administrateurs." }
    }

    try {
        const supabaseAdmin = getAdminClient()

        // 2. Extract Data
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        // Reconstruct full_name
        const firstName = formData.get('first_name') as string
        const lastName = formData.get('last_name') as string
        const fullName = `${firstName} ${lastName}`.trim()

        // New Fields
        const cine = formData.get('cine') as string
        const mobile = formData.get('mobile') as string
        const role = formData.get('role') as string

        // 3. Create User in Auth (using Admin Client)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                full_name: fullName,
                cine: cine,
                phone: mobile
            }
        })

        if (createError) return { error: createError.message }
        if (!newUser.user) return { error: "Erreur inconnue lors de la création." }

        // 4. Update Profile with Role & Extra Fields
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: fullName,
                role: role,
                cine: cine,
                phone: mobile
            })
            .eq('id', newUser.user.id)

        if (profileError) {
            // Fallback: IF trigger didn't fire or failed, insert manually
            await supabaseAdmin.from('profiles').insert({
                id: newUser.user.id,
                full_name: fullName,
                role: role,
                email: email,
                cine: cine,
                phone: mobile
            })
        }

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateUser(formData: FormData) {
    // 1. Check if current user is Admin
    const supabase = await createServerClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: "Non authentifié" }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (currentProfile?.role !== 'admin') {
        return { error: "Accès refusé." }
    }

    // 2. Extract Data
    const userId = formData.get('id') as string
    const fullName = formData.get('full_name') as string
    const role = formData.get('role') as string

    try {
        const supabaseAdmin = getAdminClient()

        // 3. Update Profile
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: fullName,
                role: role
            })
            .eq('id', userId)

        if (error) return { error: error.message }

        // 4. Update Auth Metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: fullName }
        })

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteUser(userId: string) {
    // 1. Check if current user is Admin
    const supabase = await createServerClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return { error: "Non authentifié" }

    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (currentProfile?.role !== 'admin') {
        return { error: "Accès refusé." }
    }

    // 2. Prevent Suiciding (Deleting own admin account)
    if (userId === currentUser.id) {
        return { error: "Vous ne pouvez pas supprimer votre propre compte." }
    }

    try {
        const supabaseAdmin = getAdminClient()

        // 3. SOFT DELETE: Ban from Auth + Mark deleted in Profile

        // A. Ban User (Max duration ~100 years)
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: "876000h" // ~100 years
        })

        if (banError) return { error: "Erreur Ban: " + banError.message }

        // B. Mark as Deleted in Profile (for filtering UI)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', userId)

        if (profileError) return { error: "Erreur Profile: " + profileError.message }

        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
