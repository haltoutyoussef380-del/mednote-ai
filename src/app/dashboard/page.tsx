import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, FileText, Calendar, Clock, Activity } from "lucide-react";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Dates pour filtre "Aujourd'hui"
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 1. Fetch Real Counts (Parallel)
    const [
        { count: patientCount },
        { count: noteCount },
        { count: appointmentCount },
        { count: appointmentsToday }
    ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('date', startOfDay).lte('date', endOfDay)
    ]);

    const stats = [
        {
            name: 'Patients',
            value: patientCount?.toString() || '0',
            href: '/dashboard/patients',
            color: 'bg-blue-50 text-blue-700',
            icon: Users
        },
        {
            name: 'Consultations',
            value: noteCount?.toString() || '0',
            href: '/dashboard/notes',
            color: 'bg-purple-50 text-purple-700',
            icon: FileText
        },
        {
            name: 'Rendez-vous (Total)',
            value: appointmentCount?.toString() || '0',
            href: '/dashboard/appointments',
            color: 'bg-emerald-50 text-emerald-700',
            icon: Calendar
        },
        {
            name: 'RDV Aujourd\'hui',
            value: appointmentsToday?.toString() || '0',
            href: '/dashboard/appointments',
            color: 'bg-orange-50 text-orange-700',
            icon: Clock
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/patients/new"
                        className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Nouveau Patient
                    </Link>
                    <Link
                        href="/dashboard/notes/new"
                        className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Nouvelle Note
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.name}
                        href={stat.href}
                        className="relative flex items-center space-x-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 group"
                    >
                        <div className={`flex-shrink-0 rounded-lg p-3 ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="absolute inset-0" aria-hidden="true" />
                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Activité récente</h3>
                    <div className="mt-4 text-sm text-gray-500">
                        Aucune activité récente à afficher.
                    </div>
                </div>
            </div>
        </div>
    );
}
