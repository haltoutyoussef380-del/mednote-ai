
import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const code = params?.code

  // FALLBACK: If we land here from an auth redirect (like password recovery)
  // that was blocked or misconfigured in Supabase, forward to the callback.
  if (code && typeof code === 'string') {
    redirect(`/auth/callback?code=${code}&next=/auth/reset-password`)
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-primary">MedNote AI</h1>
        <p className="text-lg text-gray-600">
          Votre assistant médical intelligent pour la prise de notes et le suivi patient.
        </p>
        <div className="flex gap-4">
          <a href="/login" className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all">
            Connexion
          </a>
        </div>
      </main>
    </div>
  );
}
