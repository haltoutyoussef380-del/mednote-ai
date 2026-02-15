'use client'

import { useState, useEffect, useRef } from 'react'

interface DictationAreaProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    label?: string;
    onFocus?: () => void;
}

export function DictationArea({
    value,
    onChange,
    placeholder,
    className,
    rows,
    label,
    onFocus
}: DictationAreaProps) {

    return (
        <div className="relative group">
            {label && <label className="block text-xs font-bold text-primary uppercase mb-1 ml-1">{label}</label>}
            <textarea
                rows={rows || 4}
                className={className || "w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary"}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={onFocus}
            />
        </div>
    )
}
