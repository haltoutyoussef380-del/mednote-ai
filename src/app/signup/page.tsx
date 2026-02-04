import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const params = await searchParams;

    return (
        <div className="flex min-h-screen bg-white">
            {/* SECTION GAUCHE : FORMULAIRE */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-sans">
                            MedNote <span className="text-primary">AI</span>
                        </h2>
                        <h3 className="mt-2 text-xl font-bold text-gray-900 tracking-tight">Créer un compte</h3>
                    </div>

                    <div className="mt-8">
                        {/* ALERT ERROR */}
                        {params.error && (
                            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Erreur d'inscription</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{decodeURIComponent(params.error)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form className="space-y-6">
                            {/* ROLE SELECTOR */}
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">
                                    Profession
                                </label>
                                <div className="mt-2">
                                    <select
                                        id="role"
                                        name="role"
                                        className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                    >
                                        <option value="medecin">Médecin</option>
                                        <option value="infirmier">Infirmier(ère)</option>
                                        <option value="secretaire">Secrétaire Médicale</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900">
                                        Nom
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            required
                                            placeholder="Martin"
                                            className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900">
                                        Prénom
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            required
                                            placeholder="Jean"
                                            className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="cine" className="block text-sm font-medium leading-6 text-gray-900">
                                    CINE (Carte Nationale)
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="cine"
                                        name="cine"
                                        type="text"
                                        required
                                        placeholder="AB123456"
                                        className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="mobile" className="block text-sm font-medium leading-6 text-gray-900">
                                    Mobile
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        type="tel"
                                        placeholder="06 00 00 00 00"
                                        className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                    Adresse Email
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="nom@hopital.com"
                                        className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Mot de passe
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    formAction={signup}
                                    className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98]"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                Déjà un compte ?{' '}
                                <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION DROITE : IMAGE & BRANDING (Différente de Login pour varier) */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1920&auto=format&fit=crop"
                    alt="Équipe médicale"
                />
                <div className="absolute inset-0 bg-teal-900/40 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-20">
                    <div className="text-white">
                        <h3 className="text-2xl font-bold">Rejoignez l'avenir de la médecine.</h3>
                        <p className="mt-2 opacity-90">Une plateforme pensée pour tous les professionnels de santé.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
