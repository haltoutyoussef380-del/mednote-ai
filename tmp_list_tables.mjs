
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'sb_publishable_nppUETnVKIRey0G5Qqw2Lg_kAK3tXQ-'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    console.log('Fetching table names...')
    const { data: appts, error: e1 } = await supabase.from('appointments').select('*').limit(1)
    console.log('Appointments sample:', appts, 'Error:', e1)

    const { data: pts, error: e2 } = await supabase.from('patients').select('*').limit(1)
    console.log('Patients sample:', pts, 'Error:', e2)
}

listTables()
