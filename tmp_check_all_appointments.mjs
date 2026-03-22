
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'sb_publishable_nppUETnVKIRey0G5Qqw2Lg_kAK3tXQ-'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllToday() {
    console.log('Fetching ALL appointments for 2026-03-22...')
    const { data, error } = await supabase
        .from('appointments')
        .select(`*, patients(first_name, last_name)`)
        // Try both range and exact match if possible, but let's just get everything and filter in JS to be safe
        .select(`*, patients(*)`)

    if (error) {
        console.error('Error:', error)
        return
    }

    const today = data.filter(a => a.date.startsWith('2026-03-22'))
    const yesterday = data.filter(a => a.date.startsWith('2026-03-21'))

    console.log('Appointments for 2026-03-22:')
    console.table(today.map(a => ({
        id: a.id,
        patient: `${a.patients?.first_name} ${a.patients?.last_name}`,
        date_iso: a.date,
        type: a.type,
        status: a.status
    })))

    console.log('Appointments for 2026-03-21 (Checking for shifts):')
    console.table(yesterday.map(a => ({
        id: a.id,
        patient: `${a.patients?.first_name} ${a.patients?.last_name}`,
        date_iso: a.date,
        type: a.type,
        status: a.status
    })))
}

checkAllToday()
