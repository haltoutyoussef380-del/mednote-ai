export interface Appointment {
    id: string
    created_at: string
    doctor_id: string
    patient_id: string
    date: string
    duration: number
    type: string
    status: 'programmé' | 'confirmé' | 'annulé' | 'terminé'
    notes?: string

    // Joined Data
    patients?: {
        first_name: string
        last_name: string
        phone?: string
    }
}
