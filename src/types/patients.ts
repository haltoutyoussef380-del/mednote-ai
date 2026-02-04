export interface Patient {
    id: string
    created_at: string
    first_name: string
    last_name: string
    birth_date: string
    gender: 'M' | 'F'
    email?: string
    phone?: string

    // Nouveaux champs enrichis
    matricule?: string // Généré par DB
    cine?: string
    address?: string
    city?: string
    zip_code?: string

    // Assurance
    insurance_provider?: 'CNOPS' | 'CNSS' | 'AMO' | 'Autre' | string
    insurance_id?: string
}
