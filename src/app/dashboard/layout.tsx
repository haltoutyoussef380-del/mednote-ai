import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Users, FileText, Calendar, LogOut, Settings } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile safely
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // TEMP: Log error if any
  if (error) console.error("Profile Fetch Error:", error);

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/dashboard/patients', icon: Users },
    { name: 'Fil d\'actualité', href: '/dashboard/notes', icon: FileText },
    { name: 'Rendez-vous', href: '/dashboard/appointments', icon: Calendar, current: false },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR GAUCHE FIXE */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <Image src="/logo.png" alt="MedNote AI" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold text-gray-900">MedNote AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu Principal</p>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors group"
            >
              <item.icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              {item.name}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100">
            {profile?.role === 'admin' && (
              <div className="mb-4">
                <p className="px-3 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Administration</p>
                <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group">
                  <Users className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  Gestion Équipe
                </Link>
              </div>
            )}

            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Autres</p>
            <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors group">
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              Paramètres
            </Link>
          </div>
        </nav>

        {/* User Profile (Bottom) */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-sm font-bold text-primary">
                {(profile?.full_name || user.email || 'Dr').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {profile?.full_name || 'Praticien'}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {user.email}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header (Visible only on small screens) - To act as a fallback for now */}
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="font-bold text-gray-900">MedNote AI</span>
          </div>
          {/* TODO: Add mobile menu toggle here */}
        </div>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto">

          {children}
        </div>
      </main>
    </div>
  )
}
