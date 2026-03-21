import { requestPasswordReset } from '../actions'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
    const params = await searchParams;

    return (
        <div className="flex min-h-screen bg-white">
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-sans">
                            Mot de passe <span className="text-primary">oublié ?</span>
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Entrez votre email pour recevoir un lien de réinitialisation.
                        </p>
                    </div>

                    <div className="mt-10">
                        {/* ALERTS FEEDBACK */}
                        {params.message === 'check_email' && (
                            <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">Email envoyé !</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>Consultez votre boîte mail. Un lien de réinitialisation vous a été envoyé.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {params.error && (
                            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Oups !</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{decodeURIComponent(params.error)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                    Votre adresse Email
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="votre@email.com"
                                        className="block w-full rounded-md border-0 py-2.5 pl-10 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
                                    />
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <button
                                formAction={requestPasswordReset}
                                className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98]"
                            >
                                Envoyer le lien
                            </button>

                            <div className="mt-6">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Retour à la connexion
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* SECTION DROITE VISUELLE */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1576091160550-2173dba9697a?q=80&w=1920&auto=format&fit=crop"
                    alt="Support médical"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
            </div>
        </div>
    )
}
