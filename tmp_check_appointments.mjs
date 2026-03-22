
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAppointments() {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:patients(nom_prenom),
            doctor:profiles!appointments_doctor_id_fkey(full_name)
        `)
        .eq('date', '2026-03-22')
        .order('time', { ascending: true })

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Appointments found for 2026-03-22:')
    console.table(data.map(a => ({
        id: a.id,
        patient: a.patient?.nom_prenom,
        doctor: a.doctor?.full_name,
        time: a.time,
        status: a.status
    })))
}

checkAppointments()
