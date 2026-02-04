'use client'

import { Search, Calendar, Phone, CreditCard, RotateCcw } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function PatientFilters() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string, name: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set(name, term)
        } else {
            params.delete(name)
        }
        replace(`${pathname}?${params.toString()}`)
    }, 300)

    const clearFilters = () => {
        replace(pathname)
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Recherche Avancée
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Recherche Générale (Nom/Prénom) */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom / Prénom</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            onChange={(e) => handleSearch(e.target.value, 'query')}
                            defaultValue={searchParams.get('query')?.toString()}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                {/* Téléphone */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Phone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            placeholder="06..."
                            onChange={(e) => handleSearch(e.target.value, 'phone')}
                            defaultValue={searchParams.get('phone')?.toString()}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                {/* CINE */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">CINE (ID)</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <CreditCard className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            placeholder="AB1234..."
                            onChange={(e) => handleSearch(e.target.value, 'cine')}
                            defaultValue={searchParams.get('cine')?.toString()}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                {/* Date RDV - Note: This requires complex backend join, simplistic implementation for now */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date de RDV</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="date"
                            onChange={(e) => handleSearch(e.target.value, 'date')}
                            defaultValue={searchParams.get('date')?.toString()}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={clearFilters}
                    type="button"
                    className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    <RotateCcw className="w-3 h-3" />
                    Réinitialiser
                </button>
            </div>
        </div>
    )
}
