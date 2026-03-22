import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    console.log("WAITING ROOM API: GET request received");
    
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!url) console.error("WAITING ROOM API: Missing NEXT_PUBLIC_SUPABASE_URL");
    if (!serviceRoleKey) console.warn("WAITING ROOM API: Missing SUPABASE_SERVICE_ROLE_KEY, falling back to anon key");

    const supabase = createClient(
        url || '',
        serviceRoleKey || anonKey || ''
    )
    
    try {
    // Dates setup pour aujourd'hui en UTC
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

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
        .in('status', ['appelé', 'en attente'])
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .order('status', { ascending: true }) // 'appelé' avant 'en attente' (a < e)
        .order('date', { ascending: true })

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
        console.error("WAITING ROOM API CRITICAL ERROR:", err);
        return NextResponse.json({ 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
        }, { status: 500 })
    }
}
