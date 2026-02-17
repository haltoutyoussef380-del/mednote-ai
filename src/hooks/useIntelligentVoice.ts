import { useState, useRef, useEffect, useCallback } from 'react';
import { correctMedicalText } from '@/app/actions/ai-voice';

export interface VoiceTranscript {
    raw: string;
    corrected: string;
}

export function useIntelligentVoice() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState<VoiceTranscript>({ raw: '', corrected: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);
    const onTranscriptRef = useRef<((transcript: VoiceTranscript) => void) | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = async (event: any) => {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptText = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcriptText;
                    } else {
                        interimText += transcriptText;
                    }
                }

                // Show interim text immediately (not corrected yet)
                if (interimText) {
                    setTranscript({ raw: interimText, corrected: interimText });
                }

                // When we have final text, correct it with AI
                if (finalText) {
                    console.log("📝 Texte brut:", finalText);
                    setIsProcessing(true);

                    try {
                        const corrected = await correctMedicalText(finalText);
                        console.log("✅ Texte corrigé:", corrected);

                        const transcriptData = { raw: finalText, corrected };
                        setTranscript(transcriptData);

                        // Call callback with corrected text
                        if (onTranscriptRef.current) {
                            onTranscriptRef.current(transcriptData);
                        }

                        // Keep listening for next phrase (continuous mode)
                        console.log("🎤 Prêt pour la prochaine phrase...");
                    } catch (error) {
                        console.error("Erreur correction:", error);
                        const transcriptData = { raw: finalText, corrected: finalText };
                        setTranscript(transcriptData);
                        if (onTranscriptRef.current) {
                            onTranscriptRef.current(transcriptData);
                        }
                    } finally {
                        setIsProcessing(false);
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                // Handle normal events silently (no console error)
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    console.log("ℹ️ Reconnaissance vocale interrompue (normal)");
                    setIsProcessing(false);
                    return;
                }

                // Handle network errors with auto-retry (no error log, just warning)
                if (event.error === 'network') {
                    console.warn("⚠️ Erreur réseau - Nouvelle tentative dans 2 secondes...");
                    setIsProcessing(false);

                    // Auto-retry after 2 seconds if still listening
                    setTimeout(() => {
                        if (isListening && recognitionRef.current) {
                            try {
                                recognitionRef.current.start();
                                console.log("🔄 Reconnexion réussie");
                            } catch (e) {
                                console.error("Échec reconnexion:", e);
                            }
                        }
                    }, 2000);
                    return;
                }

                // Only log actual critical errors
                console.error("❌ Erreur critique:", event.error);
                setIsProcessing(false);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if still listening
                if (isListening && recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.warn("Could not restart recognition:", e);
                    }
                }
            };
        }
    }, [isListening]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                setTranscript({ raw: '', corrected: '' });
                console.log("🎤 Started listening");
            } catch (e) {
                console.error("Failed to start recognition:", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            console.log("🎤 Stopped listening");
        }
    }, [isListening]);

    const clearTranscript = useCallback(() => {
        setTranscript({ raw: '', corrected: '' });
    }, []);

    const setOnTranscript = useCallback((callback: (transcript: VoiceTranscript) => void) => {
        onTranscriptRef.current = callback;
    }, []);

    return {
        isListening,
        transcript,
        isProcessing,
        startListening,
        stopListening,
        clearTranscript,
        setOnTranscript
    };
}
