
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eGpnZ3Bpb3B2amprbGNhaXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5Mzk1NywiZXhwIjoyMDg0ODY5OTU3fQ.nplISs-WzFVm1yqnjVH_p7VfjSBxbsAq7SHIH5XhW9w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAll() {
    console.log('Fetching ALL appointments with SERVICE_ROLE...')
    const { data: appts, error: e1 } = await supabase
        .from('appointments')
        .select(`*, patients(*)`)
        .order('created_at', { ascending: false })
        .limit(20)

    if (e1) {
        console.error('Error Appointments:', e1)
    } else {
        console.log('Last 20 appointments:')
        console.table(appts.map(a => ({
            id: a.id,
            patient: `${a.patients?.first_name} ${a.patients?.last_name}`,
            date_iso: a.date,
            created_at: a.created_at,
            status: a.status
        })))
    }
}

checkAll()
