'use client'

import { useState } from 'react'
import { forceAdminRole } from './actions'

export default function DebugPage() {
    const [status, setStatus] = useState('')

    const handleFix = async () => {
        setStatus("Tentative de réparation...")
        const result = await forceAdminRole()

        if (result.success) {
            setStatus("✅ SUCCÈS ! Vous êtes maintenant Admin. Rechargez le Dashboard.")
        } else {
            setStatus("❌ ERREUR: " + result.error)
        }
    }

    return (
        <div className="p-10 max-w-2xl mx-auto bg-white shadow-xl rounded-xl border border-gray-200 mt-10">
            <h1 className="text-2xl font-bold text-red-600 mb-4">🛠️ Page de Réparation Rapide</h1>
            <p className="mb-6 text-gray-600">
                Cette page permet de forcer votre compte à devenir <strong>Administrateur</strong> si les commandes SQL échouent.
            </p>

            <div className="bg-gray-100 p-4 rounded mb-6 font-mono text-sm">
                Status: {status || "En attente..."}
            </div>

            <button
                onClick={handleFix}
                className="w-full py-4 bg-red-600 text-white font-bold text-lg rounded-lg hover:bg-red-700 shadow-lg transition-all"
            >
                🚀 FORCER LE PASSAGE ADMIN
            </button>

            <a href="/dashboard" className="block text-center mt-6 text-indigo-600 hover:underline">
                Retour au Tableau de Bord
            </a>
        </div>
    )
}
