import { User, Phone, Mail, Calendar, Activity } from 'lucide-react'

interface PatientHeaderProps {
    patient: {
        id: string
        matricule?: string
        first_name: string
        last_name: string
        birth_date: string
        gender: string
        email: string | null
        phone: string | null
        cine?: string
        address?: string
        city?: string
        insurance_provider?: string
        insurance_id?: string
    }
}

export function PatientHeader({ patient }: PatientHeaderProps) {
    const getInitials = (first: string, last: string) => {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    const calculateAge = (birthDate: string) => {
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5"></div>
            <div className="px-6 pb-6">
                <div className="relative flex items-end -mt-16 mb-4">
                    <div className="relative w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                        {/* Avatar Placeholder (Initiales) */}
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                            {getInitials(patient.first_name, patient.last_name)}
                        </div>
                    </div>

                    <div className="ml-6 mb-1 flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {patient.first_name} {patient.last_name}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${patient.gender === 'M' || patient.gender === 'Homme'
                                ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                : 'bg-pink-50 text-pink-700 ring-pink-600/20'
                                }`}>
                                {patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : patient.gender}
                            </span>
                            {patient.matricule && (
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 font-mono">
                                    {patient.matricule}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            Né(e) le {new Date(patient.birth_date).toLocaleDateString()} ({calculateAge(patient.birth_date)} ans)
                        </p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-2 mb-2">
                        <button className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-500" />
                            Dossier Complet
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
                    {/* Contact */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-white rounded-md shadow-sm text-gray-400 mt-0.5">
                            <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{patient.phone || '-'}</p>
                            <p className="text-xs text-gray-400 truncate">{patient.email}</p>
                        </div>
                    </div>

                    {/* Adresse & CINE */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-white rounded-md shadow-sm text-gray-400 mt-0.5">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Identité / Adresse</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{patient.cine || 'CINE Manquant'}</p>
                            <p className="text-xs text-gray-500 truncate" title={patient.address || ''}>
                                {patient.city || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Mutuelle */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors col-span-2">
                        <div className="p-2 bg-white rounded-md shadow-sm text-gray-400 mt-0.5">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Couverture Médicale</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{patient.insurance_provider || 'Non assurée'}</span>
                                {patient.insurance_id && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        #{patient.insurance_id}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
