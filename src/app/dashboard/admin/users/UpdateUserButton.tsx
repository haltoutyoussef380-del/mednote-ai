'use client'

import { useState } from 'react'
import { Pencil, X, Save } from 'lucide-react'
import { updateUser } from './actions'

interface UpdateButtonProps {
    user: {
        id: string
        full_name: string | null
        role: string | null
        email: string
        cine?: string | null
        phone?: string | null
    }
}

export function UpdateUserButton({ user }: UpdateButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        formData.append('id', user.id) // Important: Send ID

        const result = await updateUser(formData)

        setIsPending(false)
        if (result?.error) {
            setError(result.error)
        } else {
            setIsOpen(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
            >
                <Pencil className="w-4 h-4" />
                Éditer
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
                            <h3 className="font-bold text-lg text-indigo-900">Modifier l'Utilisateur</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Email (non modifiable)</label>
                                <div className="mt-1 p-2 bg-gray-100 rounded text-gray-700 text-sm">
                                    {user.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom Complet</label>
                                <input
                                    name="full_name"
                                    defaultValue={user.full_name || ''}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CINE</label>
                                    <input
                                        name="cine"
                                        defaultValue={user.cine || ''}
                                        placeholder="AB123456"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                    <input
                                        name="mobile"
                                        defaultValue={user.phone || ''}
                                        placeholder="06..."
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                                <select
                                    name="role"
                                    defaultValue={user.role || 'medecin'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                >
                                    <option value="medecin">Médecin</option>
                                    <option value="secretaire">Secrétaire</option>
                                    <option value="infirmier">Infirmier</option>
                                    <option value="admin">Administrateur</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isPending ? 'Enregistrement...' : (
                                        <>
                                            <Save className="w-4 h-4" /> Enregistrer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
