import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PatientFilters } from '@/components/patient/PatientFilters'
import { Plus, User } from 'lucide-react'

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    const query = typeof params.query === 'string' ? params.query : ''
    const phone = typeof params.phone === 'string' ? params.phone : ''
    const cine = typeof params.cine === 'string' ? params.cine : ''
    const date = typeof params.date === 'string' ? params.date : ''

    // Base query
    let dbQuery = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

    // Apply Filters
    if (query) {
        // Search in first_name OR last_name
        dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }

    if (phone) {
        dbQuery = dbQuery.ilike('phone', `%${phone}%`)
    }

    if (cine) {
        dbQuery = dbQuery.ilike('cine', `%${cine}%`)
    }

    // Appointment Date Filter (Advanced)
    // If a date is selected, we only want patients who have an appointment on that date
    if (date) {
        // We first find the patience IDs from the appointments table
        const startOfDay = new Date(date).toISOString()
        const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString()

        const { data: appointmentData } = await supabase
            .from('appointments')
            .select('patient_id')
            .gte('date', startOfDay)
            .lte('date', endOfDay)

        const patientIds = appointmentData?.map(a => a.patient_id) || []

        if (patientIds.length > 0) {
            dbQuery = dbQuery.in('id', patientIds)
        } else {
            // Force empty result if no appointments found for that date
            dbQuery = dbQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        }
    }

    const { data: patients } = await dbQuery

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Patients</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Gestion centralisée de vos dossiers patients.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        href="/dashboard/patients/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau Patient
                    </Link>
                </div>
            </div>

            {/* FILTRES DE RECHERCHE */}
            <PatientFilters />

            {/* LISTE DE RESULTATS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:pl-6">
                                    Patient
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Age / Genre
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Coordonnées
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    CINE
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {patients?.map((patient) => (
                                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">{patient.last_name} {patient.first_name}</div>
                                                <div className="text-gray-500 text-xs">ID: ...{patient.id.slice(-4)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{patient.birth_date}</span>
                                            <span className="text-xs text-gray-400 capitalize">{patient.gender}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{patient.phone || '-'}</span>
                                            <span className="text-xs text-gray-400">{patient.email}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                                        {patient.cine || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium sm:pr-6">
                                        <Link
                                            href={`/dashboard/patients/${patient.id}`}
                                            className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 group-hover:underline"
                                        >
                                            Voir Dossier
                                            <span className="sr-only">, {patient.first_name}</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!patients || patients.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                                <User className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">Aucun patient trouvé.</p>
                                            <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos critères de recherche.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
