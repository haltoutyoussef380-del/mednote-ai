import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const shouldKeepListeningRef = useRef(false); // To track if stop was intentional

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                // Ignore 'no-speech' error (silence) as it's normal in continuous mode
                if (event.error === 'no-speech') {
                    // console.warn('Silence detected (no-speech), restarting soon via onend...');
                    return;
                }
                // Ignore 'aborted' error (often happens when manually stopping or re-starting)
                if (event.error === 'aborted') {
                    return;
                }

                console.error('Speech recognition error', event.error);
                // For other errors (not-allowed, etc), we might want to stop
                // if (event.error !== 'aborted') {
                //     setIsListening(false); // Let onend handle logic
                // }
            };

            recognitionRef.current.onend = () => {
                if (shouldKeepListeningRef.current) {
                    // Auto-restart if it was supposed to be listening
                    try {
                        recognitionRef.current.start();
                        // console.log('Auto-restarting speech recognition...');
                    } catch (e) {
                        console.error("Failed to restart recognition", e);
                        setIsListening(false);
                        shouldKeepListeningRef.current = false;
                    }
                } else {
                    setIsListening(false);
                }
            };
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                shouldKeepListeningRef.current = true;
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Error starting recognition:", error);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            shouldKeepListeningRef.current = false; // Intentional stop
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasSupport: typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    };
}
