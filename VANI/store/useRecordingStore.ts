'use client';

import { DateRange } from 'react-day-picker';
import { create } from 'zustand';

interface DashboardRangeSelector {
    range:number;
    setRange:(range:number)=>void
}

interface DashboardCustomRangeSelector {
    customRangeSelector:DateRange | null
    setCustomRangeSelector:(customRangeSelector:DateRange|null)=>void
}

interface DashboardDomain {
    domain:String;
    setDomain:(domain:String)=>void;
}

interface TranscriptLine {
    speaker: string;
    role: 'physician' | 'patient' | 'agent' | 'customer';
    text: string;
    language: string;
    timestamp: string;
}

interface ExtractionData {
    chief_complaint: string | null;
    duration: string | null;
    associated_symptoms: string[];
    past_medical_history: string | null;
    medications: string | null;
    diagnosis: string | null;
    treatment_plan: string | null;
    sentiment: string;
}

interface RecordingState {
    // Recording state
    isRecording: boolean;
    setIsRecording: (recording: boolean) => void;

    // Transcript
    transcript: TranscriptLine[];
    addTranscriptLine: (line: TranscriptLine) => void;
    clearTranscript: () => void;

    hasStarted: boolean;
    setHasStarted: (started: boolean) => void;

    sessionReady: boolean;
    setSessionReady: (ready: boolean) => void;

    // Extraction
    extraction: ExtractionData;
    updateExtraction: (fields: Partial<ExtractionData>) => void;
    resetExtraction: () => void;

    // WebRTC call state
    callStatus: 'idle' | 'waiting' | 'connecting' | 'connected' | 'ended';
    setCallStatus: (status: 'idle' | 'waiting' | 'connecting' | 'connected' | 'ended') => void;

    sessionId: string | null;
    setSessionId: (id: string | null) => void;

    patientName: string | null;
    setPatientName: (name: string | null) => void;

    callDuration: number;
    setCallDuration: (n: number | ((prev: number) => number)) => void;
}

const defaultExtraction: ExtractionData = {
    chief_complaint: null,
    duration: null,
    associated_symptoms: [],
    past_medical_history: null,
    medications: null,
    diagnosis: null,
    treatment_plan: null,
    sentiment: 'Neutral',
};

const useRecordingStore = create<RecordingState>((set) => ({
    // Recording
    isRecording: false,
    setIsRecording: (recording) => set({ isRecording: recording }),

    // Transcript
    transcript: [],
    addTranscriptLine: (line) =>
        set((state) => ({ transcript: [...state.transcript, line] })),
    clearTranscript: () => set({ transcript: [] }),

    hasStarted: false,
    setHasStarted: (started) => set({ hasStarted: started }),

    sessionReady: false,
    setSessionReady: (ready) => set({ sessionReady: ready }),

    // Extraction
    extraction: defaultExtraction,
    updateExtraction: (fields) =>
        set((state) => ({
            extraction: { ...state.extraction, ...fields },
        })),
    resetExtraction: () => set({ extraction: defaultExtraction }),

    // WebRTC call state
    callStatus: 'idle',
    setCallStatus: (status) => set({ callStatus: status }),

    sessionId: null,
    setSessionId: (id) => set({ sessionId: id }),

    patientName: null,
    setPatientName: (name) => set({ patientName: name }),

    callDuration: 0,
    setCallDuration: (n) => set({ callDuration: n }),
}));

 export const useDashboardRangeSelector = create<DashboardRangeSelector>((set)=>({
    range:7,
    setRange : (range)=> set({range})
}))

export const useDashboardCustomRangeSelector = create<DashboardCustomRangeSelector>((set)=>({
    customRangeSelector:null,
    setCustomRangeSelector:(customRangeSelector)=>set({customRangeSelector})
}))

export const useDashboardDomain = create<DashboardDomain>((set)=>({
    domain:"All",
    setDomain:(domain)=>set({domain})
}))

export default useRecordingStore;
