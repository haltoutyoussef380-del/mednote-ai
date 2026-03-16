import { useState, useRef, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { processVoiceCommand } from '@/app/actions/voice-pilot';
import { FormContext, VoicePilotAction } from '@/lib/voice-pilot';

export function useVoicePilot() {
    // State for Continuous Mode
    const [isContinuousMode, setIsContinuousMode] = useState(false);

    // Forward declaration for onSilence
    const { isRecording, startRecording: startMic, stopRecording, audioBlob, resetRecording } = useAudioRecorder();

    // Real-time Visual Feedback (Browser API)
    const [liveTranscript, setLiveTranscript] = useState("");
    const recognitionRef = useRef<Record<string, any> | null>(null);
    const currentTranscriptRef = useRef<string>(""); // Current session transcript
    const accumulatedTextRef = useRef<string>(""); // Accumulated across sessions
    const onCommandDetectedRef = useRef<((command: string) => void) | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current as Record<string, any>;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'fr-FR';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Store current transcript in ref
                const currentText = finalTranscript || interimTranscript;
                currentTranscriptRef.current = currentText;

                // Combine accumulated text with new interim text
                const fullText = accumulatedTextRef.current
                    ? `${accumulatedTextRef.current} ${currentText}`
                    : currentText;
                setLiveTranscript(fullText);

                // REAL-TIME COMMAND DETECTION
                if (finalTranscript) {
                    const lowerText = finalTranscript.toLowerCase().trim();

                    // Navigation keywords
                    const nextKeywords = ['suivant', 'next', 'suite', 'passe', 'après', 'continue'];
                    const prevKeywords = ['précédent', 'previous', 'retour', 'avant', 'back'];
                    const saveKeywords = ['enregistrer', 'save', 'sauvegarder', 'valider'];

                    if (nextKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command detected: NEXT");
                        if (onCommandDetectedRef.current) {
                            onCommandDetectedRef.current('NEXT');
                        }
                    } else if (prevKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command detected: PREV");
                        if (onCommandDetectedRef.current) {
                            onCommandDetectedRef.current('PREV');
                        }
                    } else if (saveKeywords.some(kw => lowerText.includes(kw))) {
                        console.log("🎤 Command detected: SAVE");
                        if (onCommandDetectedRef.current) {
                            onCommandDetectedRef.current('SAVE');
                        }
                    }
                }
            };

            if (recognition) {
                recognition.onend = () => {
                    // Save the current session transcript to accumulated text
                    if (currentTranscriptRef.current.trim()) {
                        const newAccumulated = accumulatedTextRef.current
                            ? `${accumulatedTextRef.current} ${currentTranscriptRef.current.trim()}`
                            : currentTranscriptRef.current.trim();
                        accumulatedTextRef.current = newAccumulated;
                        currentTranscriptRef.current = ""; // Reset current session
                    }
                };
            }
        }
    }, []);

    useEffect(() => {
        if (isRecording && recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn("Speech recognition error:", e);
            }
        } else if (!isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [isRecording]);

    // ... Processing State ...
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastTranscript, setLastTranscript] = useState("");
    const [lastActions, setLastActions] = useState<VoicePilotAction[]>([]);

    const processCommand = async (context: FormContext) => {
        setIsProcessing(true);
        setLastActions([]);
        // Keep the accumulated transcript visible during processing

        try {
            if (!audioBlob) throw new Error("No audio payload");

            const formData = new FormData();
            formData.append('file', new File([audioBlob], "command.webm", { type: 'audio/webm' }));

            const result = await processVoiceCommand(formData, context);

            if (result.error) throw new Error(result.error);

            setLastTranscript(result.transcript);
            setLastActions(result.actions);

            return result.actions;

        } catch (error) {
            console.error("Voice Pilot Hook Error:", error);
            return [];
        } finally {
            setIsProcessing(false);
            resetRecording();

            // AUTO-RESTART for Continuous Mode
            // We verify isContinuousMode is still true (user didn't toggle it off during processing)
            // And we verify we are not already recording (safety)
            if (isContinuousMode) {
                console.log("🔄 Auto-restarting Voice Pilot (Continuous Mode)");
                // Small delay to prevent instant loop issues
                setTimeout(() => {
                    startMic();
                }, 500);
            }
        }
    };

    const toggleContinuousMode = () => {
        setIsContinuousMode(prev => {
            const newState = !prev;
            if (!newState && isRecording) {
                stopRecording(); // Stop if turning off
            }
            // Clear accumulated text when turning off continuous mode
            if (!newState) {
                accumulatedTextRef.current = "";
                currentTranscriptRef.current = "";
                setLiveTranscript("");
            }
            return newState;
        });
    };

    // Wrapper for start that handles the mode
    const startRecording = () => {
        startMic();
    };

    // Allow external code to register command handler
    const setOnCommandDetected = (callback: (command: string) => void) => {
        onCommandDetectedRef.current = callback;
    };

    return {
        isRecording,
        startRecording,
        stopRecording,
        audioBlob,
        isProcessing,
        lastTranscript,
        lastActions,
        processCommand,
        isContinuousMode,
        toggleContinuousMode,
        liveTranscript,
        setOnCommandDetected
    };
}
