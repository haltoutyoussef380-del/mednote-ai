import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    // Server-side fetch (bypasses some client limitations depending on setup)
    // We fetch the current waiting queue
    
    const { data: apptsData, error } = await supabase
        .from('appointments')
        .select(`
            id,
            date,
            status,
            patient_id,
            doctor_id,
            patients (
                first_name,
                last_name
            )
        `)
        .eq('status', 'appelé')
        .order('date', { ascending: false })

    if (error) {
        console.error("API WAITING ROOM ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Récupérer les profils (médecins) séparément
    try {
        const mapAppts = await Promise.all((apptsData || []).map(async (appt) => {
            let profile = null;
            if (appt.doctor_id) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', appt.doctor_id)
                    .maybeSingle()
                profile = data;
            }
                
            return {
                ...appt,
                profiles: profile || { full_name: 'Inconnu' }
            }
        }))

        return NextResponse.json({ data: mapAppts })
    } catch (err: any) {
        console.error("API WAITING ROOM MAPPING ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
