import { updatePassword } from './actions'
import { Lock, ShieldCheck } from 'lucide-react'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const params = await searchParams;

    return (
        <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans tracking-tight">
                    Nouveau Mot de Passe
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Sécurisez votre compte avec un mot de passe fort.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
                    {params.error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200 animate-pulse">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{decodeURIComponent(params.error)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nouveau mot de passe
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full rounded-xl border-gray-200 py-3 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm transition-all bg-gray-50/50"
                                />
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmer le mot de passe
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full rounded-xl border-gray-200 py-3 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm transition-all bg-gray-50/50"
                                />
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <button
                                formAction={updatePassword}
                                className="flex w-full justify-center rounded-xl bg-primary px-3 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-[0.98] uppercase tracking-widest"
                            >
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
