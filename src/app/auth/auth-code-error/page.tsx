import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-red-100 p-3 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans tracking-tight">
                    Lien Expiré ou Invalide
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Désolé, le lien de récupération n'est plus valide.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100 text-center">
                    <p className="text-gray-700 mb-6">
                        Les liens de sécurité expirent rapidement pour protéger votre compte. 
                        Veuillez demander un nouveau lien de réinitialisation.
                    </p>
                    
                    <div className="space-y-4">
                        <Link
                            href="/login/forgot-password"
                            className="flex w-full justify-center rounded-xl bg-primary px-3 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-[0.98] uppercase tracking-widest"
                        >
                            Demander un nouveau lien
                        </Link>
                        
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
