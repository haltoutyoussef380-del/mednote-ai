
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFraicheur() {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            patients!inner(*)
        `)
        .ilike('patients.last_name', '%Fraicheur%')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Appointments found for Fraîcheur:')
    console.table(data.map(a => ({
        id: a.id,
        patient: a.patients?.last_name,
        date_in_db: a.date,
        type: a.type
    })))
}

checkFraicheur()
