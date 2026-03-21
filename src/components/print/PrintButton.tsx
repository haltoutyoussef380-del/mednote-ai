'use client'

import React from 'react'

export function PrintButton() {
    return (
        <div className="fixed bottom-8 right-8 no-print">
            <button
                onClick={() => window.print()}
                className="bg-[#2c3e50] text-white px-8 py-4 rounded-full shadow-2xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-white"
            >
                <span className="text-xl">🖨️</span> Imprimer l'Ordonnance
            </button>
        </div>
    )
}
