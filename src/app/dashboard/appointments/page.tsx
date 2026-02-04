import { createClient } from '@/lib/supabase/server'
import { Appointment } from '@/types/appointments'
import { Calendar, Clock, Plus, User } from 'lucide-react'
import { createAppointment } from './actions'
import Link from 'next/link'

export default async function AppointmentsPage() {
    const supabase = await createClient()

    // Fetch appointments
    const { data: appointments } = await supabase
        .from('appointments')
        .select('*, patients(first_name, last_name, phone)')
        .gte('date', new Date().toISOString()) // Only future or today
        .order('date', { ascending: true })

    // Fetch patients list for the dropdown
    const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('last_name')

    // Group by Date
    const groupedAppointments = (appointments as unknown as Appointment[])?.reduce((groups, appointment) => {
        const date = new Date(appointment.date).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
        })
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(appointment)
        return groups
    }, {} as Record<string, Appointment[]>)

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos prochains rendez-vous.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LISTE DES RDV (2/3 largeur) */}
                <div className="lg:col-span-2 space-y-6">
                    {Object.entries(groupedAppointments || {}).map(([date, appts]) => (
                        <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <h3 className="font-semibold text-gray-900 capitalize">{date}</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {appts.map((appt) => (
                                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/5 text-primary border border-primary/10">
                                                <span className="text-sm font-bold">
                                                    {new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div>
                                                <Link href={`/dashboard/patients/${appt.patient_id}`} className="font-semibold text-gray-900 hover:text-primary hover:underline">
                                                    {appt.patients?.first_name || 'Patient'} {appt.patients?.last_name || 'Inconnu'}
                                                </Link>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appt.type === 'Urgence' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {appt.type}
                                                    </span>
                                                    {appt.patients?.phone && (
                                                        <span>• {appt.patients.phone}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            {/* Status Badge */}
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                {appt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {(!appointments || appointments.length === 0) && (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-500">Aucun rendez-vous à venir.</p>
                        </div>
                    )}
                </div>

                {/* FORMULAIRE NOUVEAU RDV (1/3 largeur) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit sticky top-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Nouveau Rendez-vous
                    </h3>

                    <form action={createAppointment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                            <select name="patient_id" required className="block w-full rounded-md border-0 py-2 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                <option value="">Choisir un patient...</option>
                                {patients?.map(p => (
                                    <option key={p.id} value={p.id}>{p.last_name} {p.first_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" name="date" required className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                                <input type="time" name="time" required className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select name="type" className="block w-full rounded-md border-0 py-2 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6">
                                <option>Consultation</option>
                                <option>Suivi</option>
                                <option>Urgence</option>
                                <option>Certificat</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Notes</label>
                            <textarea name="notes" rows={3} className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm"></textarea>
                        </div>

                        <button type="submit" className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                            Programmer
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
