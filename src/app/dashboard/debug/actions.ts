'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function forceAdminRole() {
    console.log("--- FORCE ADMIN START ---")

    // 1. Get Current User ID
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No User Logged In" }

    // 2. Init Admin Client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !url) {
        return { error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env" }
    }

    const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 3. Force Upsert Profile
    try {
        // Try to update specifically using casting if needed, but 'admin' should be valid enum
        // We use 'upsert' to handle both create and update
        const { error } = await adminClient
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: "Admin User (Rescued)", // Default name if missing
                role: 'admin'
            })
            .select()
            .single()

        if (error) {
            console.error("Force Admin Error:", error)
            return { error: `DB Error: ${error.message}. (Hint: Did you run the migration to add 'role' column?)` }
        }

        return { success: true }
    } catch (e: any) {
        return { error: "Exception: " + e.message }
    }
}
