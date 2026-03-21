'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function DatePicker({ defaultValue }: { defaultValue: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleDateChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (date) {
            params.set('date', date)
        } else {
            params.delete('date')
        }
        router.push(`/dashboard/appointments?${params.toString()}`)
    }

    return (
        <input 
            type="date" 
            defaultValue={defaultValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg border-gray-200 text-sm font-bold text-gray-700 focus:ring-primary focus:border-primary border border-gray-100 bg-white"
        />
    )
}
