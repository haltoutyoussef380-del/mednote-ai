export type VoicePilotActionType = 'FILL' | 'NAVIGATE' | 'SELECT' | 'CONFIRM' | 'ERROR' | 'STOP';

export interface VoicePilotAction {
    type: VoicePilotActionType;
    field?: string;      // Target field (e.g., "antecedents.familiaux")
    value?: string;      // Value to fill or select
    target?: string;     // Navigation target (e.g., "NEXT", "PREV", "STEP_3")
    message?: string;    // Feedback message for the user
}

export interface VoicePilotResponse {
    transcript: string;
    actions: VoicePilotAction[];
    error?: string;
}

export interface FormContext {
    currentStep: number;
    availableFields: string[]; // List of fields valid for the current step
}
