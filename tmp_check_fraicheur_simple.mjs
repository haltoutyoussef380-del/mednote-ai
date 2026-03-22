
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'sb_publishable_nppUETnVKIRey0G5Qqw2Lg_kAK3tXQ-'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFraicheur() {
    console.log('Fetching appointments for patient with "Fraîcheur"...')
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, last_name, first_name')
        .ilike('last_name', '%Fraicheur%')

    if (pError || !patients || patients.length === 0) {
        console.error('Patient not found or error:', pError)
        return
    }

    const patientIds = patients.map(p => p.id)
    console.log('Patient IDs:', patientIds)

    const { data, error } = await supabase
        .from('appointments')
        .select(`*`)
        .in('patient_id', patientIds)

    if (error) {
        console.error('Error fetching appointments:', error)
        return
    }

    console.log('Appointments found:')
    console.table(data.map(a => ({
        id: a.id,
        date_iso: a.date,
        type: a.type,
        status: a.status
    })))
}

checkFraicheur()
