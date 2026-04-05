"use client";

import Visualizer from "@/components/voice/visualizer";
import useRecordingStore from "@/store/useRecordingStore";
import Image from "next/image";
import { useEffect, useRef } from "react";

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
          speaker_role: line.role === "physician" ? "doctor" : line.role === "customer" ? "customer" : "patient",
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
                        : "#94A3B8",
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
}: {
  isRecording: boolean;
  extractionData: VoicePageData["extraction"];
}) => {
  const extraction = useRecordingStore((state) => state.extraction);
  const updateExtraction = useRecordingStore((state) => state.updateExtraction);
  const isSessionReady = useRecordingStore((state) => state.sessionReady);

  const fields = [
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

  const symptomValues = extraction.associated_symptoms.length
    ? extraction.associated_symptoms
    : extractionData?.symptoms ?? [];

  const sentimentValue = extraction.sentiment || extractionData?.sentiment || "Neutral";

  return (
    <div className="flex flex-col h-full bg-[#090909]">
      <div className="flex items-center justify-between p-4 border-b border-[#9d9d9d]">
        <h1 className="font-bold text-white text-2xl font-oxanium tracking-wide">LIVE EXTRACTION</h1>
        <div className="flex items-center gap-2">
          <span className="text-[#8B5CF6] text-xs font-mono">AI</span>
          {isRecording && <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />}
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
            ASSOCIATED SYMPTOMS
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

const StartScreen = ({ sessionName }: { sessionName?: string | null }) => {
  const setHasStarted = useRecordingStore((state) => state.setHasStarted);
  const setSessionReady = useRecordingStore((state) => state.setSessionReady);

  const handleStart = () => {
    setHasStarted(true);
    setSessionReady(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#080708] flex flex-col items-center justify-center gap-8 font-oxanium">
      <div className="rounded-full flex items-center justify-center text-4xl">
        <Image src="/mic.png" alt="Mic Icon" width={128} height={128} />
      </div>
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-white text-4xl font-bold font-oxanium tracking-wide">Ready to Record?</h1>
        <p className="text-[#9d9d9d] font-lexend text-lg max-w-md">
          Start a new session to begin live transcription and AI-powered extraction.
        </p>
        {sessionName && <p className="text-sm text-[#cfcfcf]">Last reviewed session: {sessionName}</p>}
      </div>
      <div className="flex gap-3">
        <span className="px-4 py-2 rounded-full text-sm font-outfit font-semibold bg-teal-500/20 border-teal-500/30">
          Healthcare
        </span>
        <span className="px-4 py-2 rounded-full text-sm font-outfit font-semibold bg-amber-500/20 border-amber-500/30">
          Finance
        </span>
      </div>
      <button
        onClick={handleStart}
        className="px-8 py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 hover:scale-105 active:scale-95 bg-blue-500"
      >
        Start New Session
      </button>
      <p className="text-[#6b6b6b] text-sm font-mono">Make sure your microphone is connected</p>
    </div>
  );
};

const VoiceRecordingPageClient = ({ pageData }: { pageData: VoicePageData | null }) => {
  const isRecording = useRecordingStore((state) => state.isRecording);
  const hasStarted = useRecordingStore((state) => state.hasStarted);
  const sessionReady = useRecordingStore((state) => state.sessionReady);

  const showVisualizer = sessionReady || isRecording;
  const showReviewLayout = hasStarted && !isRecording && !sessionReady;
  const isPreSession = !hasStarted;

  if (isPreSession) {
    return (
      <StartScreen
        sessionName={pageData?.session?.patients?.name ?? pageData?.session?.customers?.name ?? null}
      />
    );
  }

  return (
    <div className="w-full bg-[#080708] min-h-screen flex flex-col">
      <div className="w-full h-full flex gap-3 items-stretch justify-center p-4">
        <div
          className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out"
          style={{ width: showReviewLayout ? "48%" : "25%" }}
        >
          <TranscriptPanel isRecording={isRecording} transcriptLines={pageData?.transcript ?? []} />
        </div>

        <div
          className="h-[90vh] bg-[#070807] rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            width: showVisualizer ? "50%" : "0%",
            opacity: showVisualizer ? 1 : 0,
            pointerEvents: showVisualizer ? "auto" : "none",
          }}
        >
          <Visualizer showButton={true} />
        </div>

        <div
          className="h-[90vh] bg-[#0f0e10] rounded-2xl overflow-hidden transition-all duration-500 ease-in-out"
          style={{ width: showReviewLayout ? "48%" : "25%" }}
        >
          <ExtractionPanel isRecording={isRecording} extractionData={pageData?.extraction ?? null} />
        </div>
      </div>
    </div>
  );
};

export default VoiceRecordingPageClient;
