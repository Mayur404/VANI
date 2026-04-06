"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Check, Mic, PhoneOff, Flag, Volume2 } from "lucide-react";
import useRecordingStore from "@/store/useRecordingStore";
import { useDashboardDomain } from "@/store/useRecordingStore";
import Visualizer from "@/components/voice/visualizer";
import ConnectingLoader from "@/components/call/ConnectingLoader";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";

type VoicePageData = Awaited<ReturnType<typeof import("@/lib/services/voice.service").getVoicePageData>>;

const TranscriptPanel = ({
    isRecording,
    transcriptLines,
}: {
    isRecording: boolean;
    transcriptLines: VoicePageData["transcript"];
}) => {
    const transcript = useRecordingStore((state) => state.transcript);
    const bottomRef = useRef<HTMLDivElement>(null);

    const lines =
        transcript.length > 0
            ? transcript.map((line, index) => ({
                  id: index,
                  speaker_label: line.speaker,
                  speaker_role: line.role === "physician" ? "doctor" : line.role === "customer" ? "patient" : line.role,
                  text: line.text,
                  language: line.language,
                  timestamp_seconds: Number(line.timestamp),
              }))
            : transcriptLines;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lines]);

    return (
        <div className="flex flex-col h-full bg-[#090909]">
            <div className="flex items-center justify-between p-4 border-b border-[#9d9d9d]">
                <h1 className="font-bold text-white text-2xl font-oxanium tracking-wide">LIVE TRANSCRIPT</h1>
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-500 text-xs font-mono tracking-widest">LIVE</span>
                    </div>
                )}
                {!isRecording && lines.length > 0 && (
                    <span className="text-[#475569] text-xs font-mono">{lines.length} lines</span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {lines.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-[#b7b7b7] font-mono text-sm tracking-widest uppercase">
                            {isRecording ? "Listening..." : "No transcript yet"}
                        </p>
                    </div>
                ) : (
                    lines.map((line, i) => (
                        <div key={line.id ?? i} className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171]">
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-xs font-mono font-bold tracking-widest"
                                    style={{
                                        color:
                                            line.speaker_label === "SPEAKER_1" || line.speaker_role === "doctor"
                                                ? "#10b981"
                                                : "#14b8a6",
                                    }}
                                >
                                    {String(line.speaker_role ?? "speaker").toUpperCase()}
                                </span>
                                {line.language && (
                                    <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-[#975d4e]/30 text-[#d3b3ab]">
                                        {line.language.toUpperCase()}
                                    </span>
                                )}
                                <span className="text-xs text-[#475569] font-mono ml-auto">
                                    {Number(line.timestamp_seconds ?? 0).toFixed(1)}s
                                </span>
                            </div>
                            <p className="text-[#E2E8F0] text-sm leading-relaxed font-lexend">&quot;{line.text}&quot;</p>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

const ExtractionPanel = ({
    isRecording,
    extractionData,
    domain = "healthcare",
}: {
    isRecording: boolean;
    extractionData: VoicePageData["extraction"];
    domain?: "healthcare" | "finance";
}) => {
    const extraction = useRecordingStore((state) => state.extraction);
    const updateExtraction = useRecordingStore((state) => state.updateExtraction);
    const isSessionReady = useRecordingStore((state) => state.sessionReady);
    const isFinance = domain === "finance";

    const healthcareFields = [
        { key: "chief_complaint", label: "CHIEF COMPLAINT", fallback: extractionData?.chiefComplaint ?? null },
        { key: "duration", label: "DURATION", fallback: null },
        { key: "past_medical_history", label: "PAST MEDICAL HISTORY", fallback: null },
        {
            key: "medications",
            label: "MEDICATIONS",
            fallback: Array.isArray(extractionData?.medications)
                ? extractionData.medications.join(", ")
                : null,
        },
        { key: "diagnosis", label: "DIAGNOSIS", fallback: extractionData?.summary ?? null },
        { key: "treatment_plan", label: "TREATMENT PLAN", fallback: extractionData?.recommendation ?? null },
    ] as const;

    const financeFields = [
        { key: "chief_complaint", label: "PAYMENT COMMITMENT", fallback: null },
        { key: "duration", label: "OUTSTANDING BALANCE", fallback: null },
        { key: "past_medical_history", label: "REASON FOR DELAY", fallback: null },
        { key: "medications", label: "PROMISED PAYMENT DATE", fallback: null },
        { key: "diagnosis", label: "RISK LEVEL", fallback: null },
        { key: "treatment_plan", label: "NEXT ACTION", fallback: null },
    ] as const;

    const fields = isFinance ? financeFields : healthcareFields;

    const symptomValues = extraction.associated_symptoms.length
        ? extraction.associated_symptoms
        : extractionData?.symptoms ?? [];

    const sentimentValue = extraction.sentiment || extractionData?.sentiment || "Neutral";

    return (
        <div className="flex flex-col h-full bg-[#090909]">
            <div className="flex items-center justify-between p-4 border-b border-[#9d9d9d]">
                <h1 className="font-bold text-white text-2xl font-oxanium tracking-wide">{isFinance ? "FINANCE EXTRACTION" : "LIVE EXTRACTION"}</h1>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${isFinance ? "text-amber-500" : "text-[#8B5CF6]"}`}>AI</span>
                    {isRecording && <div className={`w-2 h-2 rounded-full animate-pulse ${isFinance ? "bg-amber-500" : "bg-[#8B5CF6]"}`} />}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {fields.map(({ key, label, fallback }) => {
                    const value = (extraction[key] as string | null) || fallback;
                    return (
                        <div key={key} className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-[#dadada] tracking-widest">{label}</span>
                                {value && <span className="ml-auto text-[#10B981]" style={{ fontSize: 8 }}>●</span>}
                            </div>
                            {!isRecording ? (
                                <textarea
                                    className="w-full bg-transparent text-sm text-[#F1F5F9] font-lexend resize-none outline-none placeholder-[#b7b7b7] min-h-[28px]"
                                    value={value || ""}
                                    placeholder="Not detected"
                                    onChange={(e) => updateExtraction({ [key]: e.target.value })}
                                    rows={2}
                                />
                            ) : (
                                <p className="text-sm font-lexend" style={{ color: value ? "#F1F5F9" : "#334155" }}>
                                    {value || "Waiting for context..."}
                                </p>
                            )}
                        </div>
                    );
                })}

                <div className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171]">
                    <span className="text-xs font-mono text-[#dadada] tracking-widest block mb-2">
                        {isFinance ? "RECOVERY FLAGS" : "ASSOCIATED SYMPTOMS"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {symptomValues.length > 0 ? (
                            symptomValues.map((s, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full font-lexend bg-[#334155] text-[#E2E8F0]">
                                    {s}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-[#b7b7b7] font-lexend">Detecting...</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171]">
                        <span className="text-xs font-mono text-[#b7b7b7] tracking-widest block mb-1">SENTIMENT</span>
                        <p className="text-lg font-bold text-[#b7b7b7] font-oxanium">{sentimentValue}</p>
                    </div>
                    <div className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171]">
                        <span className="text-xs font-mono text-[#b7b7b7] tracking-widest block mb-1">STATUS</span>
                        <p className="text-lg font-bold font-oxanium" style={{ color: isRecording ? "#10B981" : "#F59E0B" }}>
                            {isRecording ? "Live" : "Review"}
                        </p>
                    </div>
                </div>

                {!isRecording && (
                    <button
                        className={`w-full py-3 rounded-xl font-semibold font-outfit text-white transition-all duration-200 mt-2 ${
                            !isSessionReady ? "bg-[#2b7fff]" : "bg-[#1f1f1f]"
                        }`}
                    >
                        Approve & Save Report
                    </button>
                )}
            </div>
        </div>
    );
};

const IdleState = ({
    patientName,
    patientId,
    patientPhone,
    domain,
    onAIAutoCall,
    onManualCall,
}: {
    patientName: string;
    patientId: string;
    patientPhone: string;
    domain: "healthcare" | "finance";
    onAIAutoCall: () => void;
    onManualCall: () => void;
}) => {
    return (
        <div className="w-full min-h-screen bg-[#080708] flex flex-col items-center justify-center gap-8 font-oxanium">
            <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#1f1f1f] flex flex-col gap-6">
                {/* Subject Info */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-teal-500/50 flex items-center justify-center">
                            <span className="text-2xl font-bold text-teal-500 font-oxanium">
                                {patientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-white text-xl font-bold font-oxanium">{patientName}</h2>
                            <p className="text-[#9d9d9d] text-sm font-lexend">ID: {patientId}</p>
                            <p className="text-[#6b6b6b] text-xs font-mono">{patientPhone}</p>
                        </div>
                    </div>

                    {/* Domain Badge */}
                    <span
                        className={`px-4 py-2 rounded-full text-sm font-outfit font-semibold w-fit ${
                            domain === "healthcare"
                                ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                                : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        }`}
                    >
                        {domain === "healthcare" ? "Healthcare" : "Finance"}
                    </span>
                </div>

                {/* Two Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onAIAutoCall}
                        className="flex-1 py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 hover:scale-105 active:scale-95 bg-blue-500"
                    >
                        AI Auto Call
                    </button>
                    <button
                        onClick={onManualCall}
                        className="flex-1 py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 border border-[#1f1f1f] bg-transparent hover:bg-[#1f1f1f]"
                    >
                        Manual Call
                    </button>
                </div>

                <p className="text-[#6b6b6b] text-sm font-mono text-center">
                    {domain === "finance"
                        ? "Manual call: a join link will be sent to the customer via email and SMS"
                        : "Manual call: a join link will be sent to the patient via email and SMS"}
                </p>
            </div>
        </div>
    );
};

const WaitingState = ({
    sessionId,
    patientName,
    customerLink,
    callMode,
    localStream,
    onCancel,
    onSimulatePatientJoin,
}: {
    sessionId: string;
    patientName: string;
    customerLink: string;
    callMode: "ai" | "manual";
    localStream: MediaStream | null;
    onCancel: () => void;
    onSimulatePatientJoin: () => void;
}) => {
    const [copied, setCopied] = useState(false);
    const sessionUrl = customerLink || (typeof window !== "undefined" ? `${window.location.origin}/call/join/${sessionId}` : "");

    const handleCopy = async () => {
        await navigator.clipboard.writeText(sessionUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full min-h-screen bg-[#080708] flex flex-col items-center justify-center gap-6">
            {/* Top Section - Connecting Loader & Patient Info */}
            <div className="flex flex-col items-center gap-6">
                <ConnectingLoader patientInitials={patientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)} />

                <p className="text-[#9d9d9d] font-lexend text-sm">
                    {callMode === "ai" ? "AI call link generated. Share it with the patient." : "Waiting for patient to join..."}
                </p>

                {/* Session Link Card */}
                <div className="rounded-lg p-3 bg-[#0e0e0e] border-[#717171] flex items-center gap-3">
                    <code className="text-xs font-mono text-[#dadada] truncate max-w-[280px]">
                        {sessionUrl.replace("http://", "").replace("https://", "")}
                    </code>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md bg-[#1f1f1f] hover:bg-[#2b2b2b] transition-colors"
                        type="button"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-[#dadada]" />}
                    </button>
                </div>

                {/* Patient Info Reminder */}
                <div className="rounded-lg p-4 bg-[#0e0e0e] border-[#717171] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-teal-500/50 flex items-center justify-center">
                        <span className="text-sm font-bold text-teal-500 font-oxanium">
                            {patientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-lexend text-[#dadada]">{patientName}</span>
                        <div className="flex items-center gap-2 text-xs text-[#6b6b6b] font-mono">
                            <span className="flex items-center gap-1">
                                <Check size={10} className="text-green-500" /> SMS
                            </span>
                            <span className="flex items-center gap-1">
                                <Check size={10} className="text-green-500" /> Email
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section - Visualizer */}
            {callMode === "manual" && (
                <div className="w-full max-w-xl flex flex-col gap-2">
                    <h3 className="text-center font-bold text-white text-lg font-oxanium tracking-wide">YOUR MICROPHONE</h3>
                    <div className="rounded-2xl bg-[#070807] border border-[#1f1f1f] overflow-hidden">
                        <Visualizer showButton={false} stream={localStream} />
                    </div>
                </div>
            )}

            {/* Bottom - Cancel Button */}
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={onCancel}
                    className="px-8 py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626]/20 border border-[#dc2626]/50 hover:bg-[#dc2626]/30"
                >
                    Cancel Call
                </button>

                {/* Dev button for testing */}
                {callMode === "manual" && (
                    <button
                        onClick={onSimulatePatientJoin}
                        className="px-4 py-2 rounded-lg text-xs font-mono text-[#6b6b6b] hover:text-[#9d9d9d] transition-colors"
                    >
                        [DEV] Simulate Patient Join
                    </button>
                )}
            </div>
        </div>
    );
};

const ConnectedState = ({
    patientName,
    sessionId,
    callDuration,
    localStream,
    onEndCall,
    onFlagAlert,
    domain = "healthcare",
}: {
    patientName: string;
    sessionId: string;
    callDuration: number;
    localStream: MediaStream | null;
    onEndCall: () => void;
    onFlagAlert: () => void;
    domain?: "healthcare" | "finance";
}) => {
    const [micGain, setMicGain] = useState(80);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full bg-[#080708] min-h-screen flex flex-col">
            <div className="w-full h-full flex gap-3 items-stretch justify-center p-4">
                {/* LEFT COLUMN - Transcript */}
                <div className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out flex-1 max-w-[25%]">
                    <TranscriptPanel isRecording={true} transcriptLines={[]} />
                </div>

                {/* CENTER COLUMN - Visualizer & Controls */}
                <div className="h-[90vh] bg-[#070807] rounded-2xl flex flex-col overflow-hidden transition-all duration-500 ease-in-out flex-[2]">
                    {/* Call Info Bar */}
                    <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-white font-lexend text-sm font-medium">{patientName}</span>
                                <span className="text-[#6b6b6b] font-dm-mono text-xs">ID: {sessionId?.slice(0, 8)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[#dadada] font-mono text-lg">{formatDuration(callDuration)}</span>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-green-500 text-xs font-mono tracking-widest">CONNECTED</span>
                            </div>
                        </div>
                    </div>

                    {/* Visualizer */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        <Visualizer showButton={false} stream={localStream} />
                    </div>

                    {/* Meta Bar */}
                    <div className="p-3 border-t border-[#1f1f1f] flex items-center justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-[#6b6b6b] text-xs font-mono tracking-widest">LATENCY</span>
                            <span className="text-[#10b981] text-sm font-oxanium">24ms</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[#6b6b6b] text-xs font-mono tracking-widest">CONFIDENCE</span>
                            <span className="text-[#10b981] text-sm font-oxanium">98%</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[#6b6b6b] text-xs font-mono tracking-widest">LANGUAGE</span>
                            <span className="text-[#10b981] text-sm font-oxanium">EN</span>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="p-4 border-t border-[#1f1f1f] flex items-center justify-center gap-4">
                        <button
                            onClick={onFlagAlert}
                            className="px-6 py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626]/20 border border-[#dc2626]/50 hover:bg-[#dc2626]/30 flex items-center gap-2"
                        >
                            <Flag size={18} />
                            FLAG ALERT
                        </button>

                        <button
                            onClick={onEndCall}
                            className="px-8 py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626] hover:bg-[#b91c1c] flex items-center gap-2"
                        >
                            <PhoneOff size={18} />
                            END CALL
                        </button>

                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#1f1f1f] border border-[#2b2b2b]">
                            <Volume2 size={18} className="text-[#dadada]" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={micGain}
                                onChange={(e) => setMicGain(Number(e.target.value))}
                                className="w-24 accent-teal-500"
                            />
                            <span className="text-xs font-mono text-[#dadada] w-8">{micGain}%</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Extraction */}
                <div className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out flex-1 max-w-[25%]">
                    <ExtractionPanel isRecording={true} extractionData={null} domain={domain} />
                </div>
            </div>
        </div>
    );
};

const PostCallState = ({
    patientName,
    sessionId,
    callDuration,
    onSaveReport,
    domain = "healthcare",
}: {
    patientName: string;
    sessionId: string;
    callDuration: number;
    onSaveReport: () => void;
    domain?: "healthcare" | "finance";
}) => {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full bg-[#080708] min-h-screen flex flex-col">
            <div className="w-full h-full flex gap-3 items-stretch justify-center p-4">
                {/* LEFT COLUMN - Transcript (expanded) */}
                <div className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out flex-1 max-w-[48%]">
                    <TranscriptPanel isRecording={false} transcriptLines={[]} />
                </div>

                {/* RIGHT COLUMN - Extraction (expanded) */}
                <div className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out flex-1 max-w-[48%]">
                    <ExtractionPanel isRecording={false} extractionData={null} domain={domain} />
                </div>
            </div>
        </div>
    );
};

const VoiceCallPage = () => {
    const searchParams = useSearchParams();
    const selectedWorkspaceDomain = useDashboardDomain((state) => state.domain);

    const callStatus = useRecordingStore((state) => state.callStatus);
    const setCallStatus = useRecordingStore((state) => state.setCallStatus);
    const sessionId = useRecordingStore((state) => state.sessionId);
    const setSessionId = useRecordingStore((state) => state.setSessionId);
    const callDuration = useRecordingStore((state) => state.callDuration);
    const setCallDuration = useRecordingStore((state) => state.setCallDuration);
    const patientName = useRecordingStore((state) => state.patientName);
    const setPatientName = useRecordingStore((state) => state.setPatientName);
    const setIsRecording = useRecordingStore((state) => state.setIsRecording);

    const { localStream, startCall, endCall, isConnected } = useWebRTCCall();

    const [customerLink, setCustomerLink] = useState("");
    const [callMode, setCallMode] = useState<"ai" | "manual">("manual");
    const fallbackDomain =
        String(selectedWorkspaceDomain).toLowerCase() === "finance" ? "finance" : "healthcare";
    const requestedDomain = searchParams.get("domain");
    const resolvedDomain =
        requestedDomain === "finance" || requestedDomain === "healthcare"
            ? requestedDomain
            : fallbackDomain;

    const callContext = {
        name: searchParams.get("name") || "Ravi Kumar",
        id: searchParams.get("id") || "12345",
        phone: searchParams.get("phone") || "+91 9876543210",
        domain: resolvedDomain as "healthcare" | "finance",
        amount: Number(searchParams.get("amount") || "50000"),
        bank: searchParams.get("bank") || "VANI Health Finance",
        agent: searchParams.get("agent") || "Dr. Praneeth",
    };
    const scheduledCallId = searchParams.get("scheduledCallId");
    const autoStartScheduled = searchParams.get("autoStartScheduled") !== "false";

    useEffect(() => {
        setPatientName(callContext.name);
    }, [callContext.name, setPatientName]);

    // Duration timer
    useEffect(() => {
        if (callStatus === "connected") {
            const interval = setInterval(() => {
                setCallDuration(callDuration + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [callStatus, callDuration, setCallDuration]);

    // Sync with WebRTC connection state
    useEffect(() => {
        if (isConnected && callStatus === "waiting") {
            setIsRecording(true);
            setCallStatus("connected");
        }
    }, [isConnected, callStatus, setCallStatus, setIsRecording]);

    const handleAIAutoCall = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
            setCallMode("ai");

            const response = scheduledCallId
                ? await fetch(`${backendUrl}/scheduled-call-session/${scheduledCallId}`)
                : await fetch(`${backendUrl}/create-ai-session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customerName: callContext.name,
                        phoneNumber: callContext.phone,
                        loanAccountNumber: callContext.id,
                        outstandingAmount: callContext.amount,
                        bankName: callContext.bank,
                        domain: callContext.domain,
                        agentName: callContext.agent,
                    }),
                });

            if (!response.ok) {
                throw new Error(scheduledCallId ? "Failed to get scheduled AI session" : "Failed to create AI session");
            }

            const data = await response.json();
            setCustomerLink(data.customerLink);
            setSessionId(data.sessionId);
            setPatientName(callContext.name);
            setCallStatus("waiting");
        } catch (error) {
            console.error("AI Auto Call error:", error);
            alert("Failed to initiate AI call");
        }
    };

    useEffect(() => {
        if (!scheduledCallId || !autoStartScheduled || callStatus !== "idle") return;
        void handleAIAutoCall();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduledCallId, autoStartScheduled, callStatus]);

    const handleManualCall = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
            setCallMode("manual");

            const response = await fetch(`${backendUrl}/create-manual-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentName: callContext.agent,
                    customerName: callContext.name,
                    customerPhone: callContext.phone,
                    loanAccountNumber: callContext.id,
                    domain: callContext.domain,
                }),
            });

            if (!response.ok) throw new Error("Failed to create manual room");

            const data = await response.json();
            setSessionId(data.roomId);
            setCustomerLink(data.customerLink);
            setPatientName(callContext.name);
            setCallStatus("waiting");

            // Start the WebRTC call as agent
            await startCall(data.roomId);
        } catch (error) {
            console.error("Manual Call error:", error);
            alert("Failed to initiate manual call");
        }
    };

    const handleCancelCall = () => {
        endCall();
        setIsRecording(false);
        setCallStatus("idle");
        setSessionId(null);
        setCallDuration(0);
        setCustomerLink("");
    };

    const handleEndCall = () => {
        endCall();
        setIsRecording(false);
        setCallStatus("ended");
    };

    const handleSimulatePatientJoin = () => {
        // Dev-only: simulate patient joining
        setCallStatus("connected");
    };

    const handleFlagAlert = () => {
        console.log("FLAG ALERT triggered");
        // Implement alert logic here
    };

    const handleSaveReport = () => {
        console.log("Report saved");
        // Implement save logic here
    };

    // Render based on call status
    if (callStatus === "idle") {
        return (
            <IdleState
                patientName={callContext.name}
                patientId={callContext.id}
                patientPhone={callContext.phone}
                domain={callContext.domain}
                onAIAutoCall={handleAIAutoCall}
                onManualCall={handleManualCall}
            />
        );
    }

    if (callStatus === "waiting") {
        return (
            <WaitingState
                sessionId={sessionId || ""}
                patientName={patientName || callContext.name}
                customerLink={customerLink}
                callMode={callMode}
                localStream={localStream}
                onCancel={handleCancelCall}
                onSimulatePatientJoin={handleSimulatePatientJoin}
            />
        );
    }

    if (callStatus === "connected") {
        return (
            <ConnectedState
                patientName={patientName || callContext.name}
                sessionId={sessionId || ""}
                callDuration={callDuration}
                localStream={localStream}
                onEndCall={handleEndCall}
                onFlagAlert={handleFlagAlert}
                domain={callContext.domain}
            />
        );
    }

    if (callStatus === "ended") {
        return (
            <PostCallState
                patientName={patientName || callContext.name}
                sessionId={sessionId || ""}
                callDuration={callDuration}
                onSaveReport={handleSaveReport}
                domain={callContext.domain}
            />
        );
    }

    // Default: show connecting state
    return (
        <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center">
            <ConnectingLoader />
        </div>
    );
};

export default VoiceCallPage;
