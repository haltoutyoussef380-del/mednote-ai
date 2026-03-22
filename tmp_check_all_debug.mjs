
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'sb_publishable_nppUETnVKIRey0G5Qqw2Lg_kAK3tXQ-'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAll() {
    console.log('Fetching ALL appointments from the table...')
    const { data, error } = await supabase
        .from('appointments')
        .select(`*, patients(first_name, last_name)`)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Last 20 appointments created:')
    console.table(data.map(a => ({
        id: a.id,
        patient: `${a.patients?.first_name} ${a.patients?.last_name}`,
        date_iso: a.date,
        created_at: a.created_at,
        status: a.status
    })))
}

checkAll()
