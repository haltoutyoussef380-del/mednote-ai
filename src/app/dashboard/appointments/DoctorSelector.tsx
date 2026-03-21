'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Doctor {
    id: string
    full_name: string
    email: string
}

export default function DoctorSelector({ doctors, currentDoctorId }: { doctors: Doctor[], currentDoctorId?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleDoctorChange = (doctorId: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (doctorId) {
            params.set('doctor_id', doctorId)
        } else {
            params.delete('doctor_id')
        }
        router.push(`/dashboard/appointments?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <select 
                value={currentDoctorId || ''}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="rounded-lg border-0 bg-transparent text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer min-w-[150px]"
            >
                <option value="">Tous les médecins</option>
                {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                        Dr. {doc.full_name || doc.email}
                    </option>
                ))}
            </select>
        </div>
    )
}
