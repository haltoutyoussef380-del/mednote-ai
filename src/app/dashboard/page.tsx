import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch real counts
    const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

    const { count: noteCount } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true });

    const stats = [
        { name: 'Patients', value: patientCount?.toString() || '0', href: '/dashboard/patients', color: 'bg-primary/10 text-primary' },
        { name: 'Notes', value: noteCount?.toString() || '0', href: '/dashboard', color: 'bg-secondary text-secondary-foreground' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tableau de bord</h1>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/patients/new"
                        className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Nouveau Patient
                    </Link>
                    <Link
                        href="/dashboard/notes/new"
                        className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Nouvelle Note
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.name}
                        href={stat.href}
                        className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:border-gray-400"
                    >
                        <div className={`flex-shrink-0 rounded-lg p-3 ${stat.color}`}>
                            {/* Icon placeholder */}
                            <span className="text-xl font-bold">{stat.value}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="absolute inset-0" aria-hidden="true" />
                            <p className="text-sm font-medium text-gray-900">{stat.name}</p>
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
