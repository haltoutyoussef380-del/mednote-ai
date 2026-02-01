
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50/50">
      <nav className="border-b bg-white px-4 py-3 shadow-sm sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="MedNote AI Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-primary">MedNote AI</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Dr. {profile?.full_name || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {children}
      </main>
    </div>
  )
}
