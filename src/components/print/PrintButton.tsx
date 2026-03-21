'use client'

import React from 'react'

interface PrintButtonProps {
    label?: string
}

export function PrintButton({ label = "Imprimer" }: PrintButtonProps) {
    return (
        <div className="fixed bottom-8 right-8 no-print">
            <button
                onClick={() => window.print()}
                className="bg-primary text-white px-8 py-4 rounded-full shadow-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-white uppercase tracking-widest text-sm"
            >
                <span className="text-xl">🖨️</span> {label}
            </button>
        </div>
    )
}
