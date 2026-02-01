'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface DictationAreaProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    label?: string;
}

export function DictationArea({
    value,
    onChange,
    placeholder,
    className,
    rows,
    label
}: DictationAreaProps) {
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();
    const [baseValue, setBaseValue] = useState("");
    const [hasMounted, setHasMounted] = useState(false);
    const onChangeRef = useRef(onChange); // Store latest onChange

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Keep ref in sync
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Update parent when dictating
    useEffect(() => {
        if (isListening && transcript) {
            // Smart spacing
            const prefix = baseValue ? (baseValue + (baseValue.endsWith(' ') ? '' : ' ')) : '';
            onChangeRef.current(prefix + transcript);
        }
    }, [transcript, isListening, baseValue]); // onChange is NOT a dependency anymore

    const handleToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            setBaseValue(value); // Snapshot current text
            resetTranscript();   // Clear previous session
            startListening();
        }
    }

    return (
        <div className="relative group">
            {label && <label className="block text-xs font-bold text-primary uppercase mb-1 ml-1">{label}</label>}
            <div className="relative">
                <textarea
                    rows={rows || 4}
                    className={`${className || "w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary"} ${isListening ? 'ring-2 ring-red-400 border-red-400 bg-red-50' : ''}`}
                    placeholder={placeholder}
                    value={value} // The value is controlled by parent, but updated by effect above
                    onChange={e => onChange(e.target.value)}
                />

                {hasMounted && hasSupport && (
                    <button
                        type="button"
                        onClick={handleToggle}
                        className={`absolute bottom-2 right-2 p-2 rounded-full shadow-sm transition-all ${isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-100 text-gray-500 hover:bg-primary hover:text-white'
                            }`}
                        title="Dicter dans ce champ"
                    >
                        {isListening ? '⏹' : '🎙️'}
                    </button>
                )}
            </div>
            {isListening && <div className="text-xs text-red-500 animate-pulse mt-1 font-semibold">🔴 Enregistrement... (Parlez maintenant)</div>}
        </div>
    )
}
