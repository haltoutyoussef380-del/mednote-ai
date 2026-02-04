'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteUser } from './actions'

interface DeleteButtonProps {
    userId: string
    userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteButtonProps) {
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${userName || 'cet utilisateur'} ?`)) {
            return
        }

        setIsPending(true)
        const result = await deleteUser(userId)

        if (result?.error) {
            alert("Erreur: " + result.error)
            setIsPending(false)
        }
        // If success, router.refresh() happens in action, so UI updates automatically
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
            title="Supprimer l'utilisateur"
        >
            <Trash2 className="w-4 h-4" />

        </button>
    )
}
