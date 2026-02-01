import { login, signup } from './actions'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-2xl rounded-xl border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        MedNote AI
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Connectez-vous à votre espace praticien
                    </p>
                </div>
                <form className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="full-name" className="sr-only">
                                Nom complet (Inscription uniquement)
                            </label>
                            <input
                                id="full-name"
                                name="full_name"
                                type="text"
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                placeholder="Nom complet (Inscription)"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Adresse Email
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                placeholder="Adresse Email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                placeholder="Mot de passe"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            formAction={login}
                            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            Se connecter
                        </button>
                        <button
                            formAction={signup}
                            className="group relative flex w-full justify-center rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
                        >
                            S'inscrire
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
