import { useState, useRef, useEffect, useCallback } from 'react';

export interface VoiceCommand {
    type: 'NEXT' | 'PREV' | 'SAVE' | 'TEXT';
    text?: string;
}

export function useSimpleVoice() {
    const [isListening, setIsListening] = useState(false);
    const [liveText, setLiveText] = useState("");
    const recognitionRef = useRef<any>(null);
    const onCommandRef = useRef<((cmd: VoiceCommand) => void) | null>(null);
    const onTextRef = useRef<((text: string) => void) | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = (event: any) => {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript;
                    } else {
                        interimText += transcript;
                    }
                }

                // Update live text for display
                const currentText = finalText || interimText;
                setLiveText(currentText);

                // Send interim text to callback for real-time display
                if (interimText && onTextRef.current) {
                    onTextRef.current(interimText);
                }

                // Process final text for commands or content
                if (finalText) {
                    const lowerText = finalText.toLowerCase().trim();

                    // Check for navigation commands
                    const nextKeywords = ['suivant', 'next', 'suite', 'passe', 'après', 'continue'];
                    const prevKeywords = ['précédent', 'previous', 'retour', 'avant', 'back'];
                    const saveKeywords = ['enregistrer', 'save', 'sauvegarder', 'valider'];

                    if (nextKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command: NEXT");
                        if (onCommandRef.current) {
                            onCommandRef.current({ type: 'NEXT' });
                        }
                        setLiveText(""); // Clear after command
                    } else if (prevKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command: PREV");
                        if (onCommandRef.current) {
                            onCommandRef.current({ type: 'PREV' });
                        }
                        setLiveText("");
                    } else if (saveKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command: SAVE");
                        if (onCommandRef.current) {
                            onCommandRef.current({ type: 'SAVE' });
                        }
                        setLiveText("");
                    } else {
                        // It's content, send to text callback
                        console.log("📝 Text:", finalText);
                        if (onTextRef.current) {
                            onTextRef.current(finalText);
                        }
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
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
                setLiveText("");
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
            setLiveText("");
            console.log("🎤 Stopped listening");
        }
    }, [isListening]);

    const setOnCommand = useCallback((callback: (cmd: VoiceCommand) => void) => {
        onCommandRef.current = callback;
    }, []);

    const setOnText = useCallback((callback: (text: string) => void) => {
        onTextRef.current = callback;
    }, []);

    return {
        isListening,
        liveText,
        startListening,
        stopListening,
        setOnCommand,
        setOnText
    };
}
