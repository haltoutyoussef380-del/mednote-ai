import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
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
                        <p className="mt-2 text-sm text-gray-600">
                            Votre assistant médical intelligent pour plus de sérénité.
                        </p>
                    </div>

                    <div className="mt-10">
                        {/* ALERTS FEEDBACK */}
                        {params.message === 'check_email' && (
                            <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">Compte créé avec succès !</h3>
                                        <div className="mt-2 text-sm text-green-700">
                                            <p>Veuillez vérifier votre boîte mail pour confirmer votre inscription avant de vous connecter.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {params.error && (
                            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Erreur de connexion</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>{decodeURIComponent(params.error)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm font-medium leading-6">
                                <span className="bg-white px-6 text-gray-900">Connexion Praticien</span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <form className="space-y-6">
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
                                            placeholder="docteur@exemple.com"
                                            className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
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
                                            autoComplete="current-password"
                                            required
                                            className="block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        formAction={login}
                                        className="flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-[0.98]"
                                    >
                                        Se connecter
                                    </button>
                                </div>
                            </form>


                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION DROITE : IMAGE & BRANDING */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1920&auto=format&fit=crop"
                    alt="Atmosphère médicale sereine"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" /> {/* Filtre couleur légère */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-20">
                    <div className="text-white">
                        <h3 className="text-2xl font-bold">MedNote AI au service du soin.</h3>
                        <p className="mt-2 opacity-90">Concentrez-vous sur vos patients, nous nous occupons du reste.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
