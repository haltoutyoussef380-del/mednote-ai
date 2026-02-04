import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserButton } from './CreateUserButton'
import { UpdateUserButton } from './UpdateUserButton'
import { DeleteUserButton } from './DeleteUserButton'

export default async function AdminUsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify Admin Access
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role !== 'admin') {
        return (
            <div className="p-8 text-center text-red-600">
                <h1 className="text-2xl font-bold">Accès Refusé</h1>
                <p>Cette page est réservée aux administrateurs.</p>
            </div>
        )
    }

    // Fetch All Users (excluding soft deleted)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gestion de l'Équipe</h1>
                    <p className="text-sm text-gray-500">Créez des comptes pour vos collaborateurs (Secrétaires, Infirmiers...)</p>
                </div>
                <CreateUserButton />
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {profiles?.map((profile) => (
                            <tr key={profile.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {profile.full_name?.[0] || '?'}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{profile.full_name || 'Sans nom'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{profile.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${profile.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                        profile.role === 'medecin' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                            profile.role === 'infirmier' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                'bg-gray-50 text-gray-600 ring-gray-500/10' // secretaire
                                        }`}>
                                        {profile.role?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <UpdateUserButton user={profile} />
                                        <DeleteUserButton userId={profile.id} userName={profile.full_name} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
