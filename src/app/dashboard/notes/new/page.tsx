
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewNotePage() {
    const supabase = await createClient()

    // Fetch user patients to let them select one
    const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, birth_date')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-3xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Nouvelle Note
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Veuillez sélectionner le patient pour lequel vous souhaitez créer une note ou compte-rendu.
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                <ul role="list" className="divide-y divide-gray-100">
                    {patients?.map((patient) => (
                        <li key={patient.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                            <div className="flex min-w-0 gap-x-4">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                                    {patient.first_name[0]}{patient.last_name[0]}
                                </span>
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-gray-900">
                                        <Link href={`/dashboard/patients/${patient.id}/notes/new`}>
                                            <span className="absolute inset-x-0 -top-px bottom-0" />
                                            {patient.first_name} {patient.last_name}
                                        </Link>
                                    </p>
                                    <p className="mt-1 flex text-xs leading-5 text-gray-500">
                                        Né(e) le {patient.birth_date || 'Inconnue'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-x-4">
                                <div className="hidden sm:flex sm:flex-col sm:items-end">
                                    <p className="text-sm leading-6 text-gray-900">Sélectionner →</p>
                                </div>
                                <svg className="h-5 w-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.16 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </li>
                    ))}
                    {(!patients || patients.length === 0) && (
                        <div className="px-4 py-10 text-center">
                            <p className="text-gray-500 mb-4">Aucun patient trouvé.</p>
                            <Link
                                href="/dashboard/patients/new"
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                            >
                                Créer un patient d'abord
                            </Link>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    )
}
