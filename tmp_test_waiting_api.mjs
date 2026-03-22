
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxxjggpiopvjjklcaixv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eGpnZ3Bpb3B2amprbGNhaXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5Mzk1NywiZXhwIjoyMDg0ODY5OTU3fQ.nplISs-WzFVm1yqnjVH_p7VfjSBxbsAq7SHIH5XhW9w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWaitingRoomAPI() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    console.log(`Checking for date range: ${startOfDay} to ${endOfDay}`);

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

    if (error) {
        console.error("API ERROR:", error);
        return;
    }

    console.log("Appointments found for monitor:", apptsData?.length || 0);
    console.table(apptsData?.map(a => ({
        id: a.id,
        patient: `${a.patients?.first_name} ${a.patients?.last_name}`,
        status: a.status,
        date: a.date
    })));

    // Also check how many are 'programmé' for today
    const { data: prog } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('status', 'programmé')
        .gte('date', startOfDay)
        .lte('date', endOfDay);
    
    console.log("Appointments still 'programmé' for today:", prog?.length || 0);
}

testWaitingRoomAPI();
