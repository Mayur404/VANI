'use client';

import { useCallback, useRef, useState } from 'react';
import useRecordingStore from '@/store/useRecordingStore';

interface DiarizedLine {
  speaker: string;
  role: 'physician' | 'patient' | 'agent' | 'customer';
  text: string;
  language: string;
  timestamp: string;
}

interface ExtractionReport {
  chief_complaint?: string | null;
  symptoms?: string[];
  duration?: string | null;
  severity?: string | null;
  past_medical_history?: string | null;
  current_medications?: string[];
  allergies?: string[];
  clinical_observations?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  risk_indicators?: string[];
  ent_findings?: string | null;
  pregnancy_data?: string | null;
  injury_details?: string | null;
  mobility_status?: string | null;
  immunization_given?: string[];
  associated_symptoms?: string[];
  sentiment?: string;
  live_schema_report?: Record<string, unknown>;
}

interface UseVoiceRecordingReturn {
  micStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  saveReport: (patientName?: string) => Promise<{ success: boolean; sessionId?: number }>;
  rawTranscript: string;
  isProcessing: boolean;
  isSaving: boolean;
  reportSaved: boolean;
  error: string | null;
}

const CHUNK_DURATION_MS = 15000;
const DIARIZE_DEBOUNCE_MS = 1400;
const EXTRACT_DEBOUNCE_MS = 1800;
const RATE_LIMIT_COOLDOWN_MS = 60000;

const BACKEND_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:4000';

function parseDiarizedTranscript(
  diarizedTranscript: string,
  language: string,
  startedAt: number,
): DiarizedLine[] {
  const lines = diarizedTranscript.split('\n').filter((line) => line.trim());
  const elapsed = startedAt > 0 ? (Date.now() - startedAt) / 1000 : 0;

  return lines
    .map((line, index) => {
      const isDoctor = /^doctor\s*:/i.test(line);
      const isPatient = /^patient\s*:/i.test(line);
      const text = line.replace(/^(Doctor|Patient|Speaker\s*\d+)\s*:\s*/i, '').trim();

      if (!text) return null;

      return {
        speaker: isDoctor ? 'SPEAKER_1' : 'SPEAKER_2',
        role: isDoctor ? 'physician' : isPatient ? 'patient' : 'patient',
        text,
        language,
        timestamp: ((elapsed / Math.max(lines.length, 1)) * index).toFixed(1),
      } satisfies DiarizedLine;
    })
    .filter((line): line is DiarizedLine => Boolean(line));
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [rawTranscript, setRawTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const rawTranscriptRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeMimeTypeRef = useRef('audio/webm');
  const chunkIndexRef = useRef(0);
  const queueRef = useRef<Array<{ blob: Blob; index: number }>>([]);
  const processingQueueRef = useRef(false);
  const diarizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extractTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const diarizeInFlightRef = useRef(false);
  const extractInFlightRef = useRef(false);
  const diarizedTextRef = useRef('');
  const startTimeRef = useRef(0);
  const languageRef = useRef('en-IN');
  const recordedChunksRef = useRef<Blob[]>([]);
  const finalizingSessionRef = useRef(false);
  const rateLimitedUntilRef = useRef(0);
  const liveTranscriptionDisabledRef = useRef(false);

  const addTranscriptLine = useRecordingStore((s) => s.addTranscriptLine);
  const updateExtraction = useRecordingStore((s) => s.updateExtraction);
  const setIsRecordingStore = useRecordingStore((s) => s.setIsRecording);
  const setSessionReady = useRecordingStore((s) => s.setSessionReady);
  const clearTranscript = useRecordingStore((s) => s.clearTranscript);
  const resetExtraction = useRecordingStore((s) => s.resetExtraction);

  const sendChunk = useCallback(async (blob: Blob, index: number) => {
    if (liveTranscriptionDisabledRef.current || Date.now() < rateLimitedUntilRef.current) {
      throw new Error('SARVAM_RATE_LIMITED');
    }

    const fd = new FormData();
    const ext = activeMimeTypeRef.current.includes('ogg') ? 'ogg' : 'webm';
    fd.append('file', blob, `chunk-${index}.${ext}`);
    fd.append('model', 'saaras:v3');
    fd.append('mode', 'translate');
    fd.append('language_code', languageRef.current || 'unknown');

    const resp = await fetch(`${BACKEND_URL}/api/voice/transcribe-chunk`, {
      method: 'POST',
      body: fd,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        rateLimitedUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        liveTranscriptionDisabledRef.current = true;
        throw new Error('SARVAM_RATE_LIMITED');
      }
      throw new Error(err.details || err.error || `HTTP ${resp.status}`);
    }

    return resp.json() as Promise<{ transcript: string; language_code: string }>;
  }, []);

  const applyDiarizedTranscript = useCallback((diarizedTranscript: string) => {
    diarizedTextRef.current = diarizedTranscript;
    const lines = parseDiarizedTranscript(diarizedTranscript, languageRef.current, startTimeRef.current);

    clearTranscript();
    lines.forEach((line) => addTranscriptLine(line));
  }, [addTranscriptLine, clearTranscript]);

  const runDiarization = useCallback(async (transcriptOverride?: string) => {
    const transcript = (transcriptOverride ?? rawTranscriptRef.current).trim();
    if (!transcript || diarizeInFlightRef.current) return;

    diarizeInFlightRef.current = true;
    try {
      const resp = await fetch(`${BACKEND_URL}/api/voice/diarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!resp.ok) return;

      const result = await resp.json();
      applyDiarizedTranscript(result.diarized_transcript || '');
    } catch (err) {
      console.error('[VoiceRecording] Diarization failed:', err);
    } finally {
      diarizeInFlightRef.current = false;
    }
  }, [applyDiarizedTranscript]);

  const scheduleDiarization = useCallback(() => {
    if (diarizeTimerRef.current) clearTimeout(diarizeTimerRef.current);
    diarizeTimerRef.current = setTimeout(() => {
      void runDiarization();
    }, DIARIZE_DEBOUNCE_MS);
  }, [runDiarization]);

  const runExtraction = useCallback(async (transcriptOverride?: string, diarizedOverride?: string) => {
    const transcript = (transcriptOverride ?? rawTranscriptRef.current).trim();
    const diarizedTranscript = (diarizedOverride ?? diarizedTextRef.current).trim();

    if (!transcript || extractInFlightRef.current) return;

    extractInFlightRef.current = true;
    setIsProcessing(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/voice/extract-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          diarized_transcript: diarizedTranscript,
        }),
      });

      if (!resp.ok) return;

      const result = await resp.json();
      const report = (result.mapped_report || result.report || {}) as ExtractionReport;

      updateExtraction({
        chief_complaint: report.chief_complaint || null,
        duration: report.duration || null,
        severity: report.severity || null,
        past_medical_history: report.past_medical_history || null,
        medications: Array.isArray(report.current_medications)
          ? report.current_medications.join(', ')
          : null,
        current_medications: report.current_medications || [],
        allergies: report.allergies || [],
        clinical_observations: report.clinical_observations || null,
        diagnosis: report.diagnosis || null,
        treatment_plan: report.treatment_plan || null,
        risk_indicators: report.risk_indicators || [],
        ent_findings: report.ent_findings || null,
        pregnancy_data: report.pregnancy_data || null,
        injury_details: report.injury_details || null,
        mobility_status: report.mobility_status || null,
        immunization_given: report.immunization_given || [],
        associated_symptoms: report.associated_symptoms || report.symptoms || [],
        sentiment: report.sentiment || 'Neutral',
        live_schema_report: report.live_schema_report || null,
      });
    } catch (err) {
      console.error('[VoiceRecording] Extraction failed:', err);
    } finally {
      extractInFlightRef.current = false;
      setIsProcessing(false);
    }
  }, [updateExtraction]);

  const scheduleExtraction = useCallback(() => {
    if (extractTimerRef.current) clearTimeout(extractTimerRef.current);
    extractTimerRef.current = setTimeout(() => {
      void runExtraction();
    }, EXTRACT_DEBOUNCE_MS);
  }, [runExtraction]);

  const recordSingleChunk = useCallback((stream: MediaStream): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const parts: Blob[] = [];
      const mime = activeMimeTypeRef.current;
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          parts.push(event.data);
        }
      };

      recorder.onerror = (event) =>
        reject(new Error((event as unknown as { error?: Error }).error?.message || 'Recorder error'));

      recorder.onstop = () => {
        const blob = new Blob(parts, { type: mime || 'audio/webm' });
        resolve(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();

      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, CHUNK_DURATION_MS);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (processingQueueRef.current) return;
    processingQueueRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const item = queueRef.current.shift();
        if (!item) continue;

        try {
          const result = await sendChunk(item.blob, item.index);
          const text = result.transcript || '';

          if (result.language_code && result.language_code !== 'unknown') {
            languageRef.current = result.language_code;
          }

          if (text.trim()) {
            rawTranscriptRef.current = rawTranscriptRef.current
              ? `${rawTranscriptRef.current.trim()} ${text}`
              : text;
            setRawTranscript(rawTranscriptRef.current);

            addTranscriptLine({
              speaker: 'SPEAKER_1',
              role: 'physician',
              text: text.trim(),
              language: languageRef.current,
              timestamp: ((Date.now() - startTimeRef.current) / 1000).toFixed(1),
            });

            scheduleDiarization();
            scheduleExtraction();
          }
        } catch (err) {
          if (err instanceof Error && err.message === 'SARVAM_RATE_LIMITED') {
            setError('Sarvam rate limit reached. Continuing recording and will use available transcript/final fallback.');
            queueRef.current = [];
            break;
          }
          console.error(`[VoiceRecording] Chunk ${item.index} failed:`, err);
        }
      }
    } finally {
      processingQueueRef.current = false;
    }
  }, [addTranscriptLine, scheduleDiarization, scheduleExtraction, sendChunk]);

  const captureLoop = useCallback(async (stream: MediaStream) => {
    while (isRecordingRef.current) {
      chunkIndexRef.current += 1;
      const idx = chunkIndexRef.current;

      try {
        const blob = await recordSingleChunk(stream);
        if (!isRecordingRef.current && blob.size === 0) break;

        if (blob.size > 0) {
          recordedChunksRef.current.push(blob);
          queueRef.current.push({ blob, index: idx });
          void processQueue();
        }
      } catch (err) {
        console.error(`[VoiceRecording] Capture failed on chunk ${idx}:`, err);
        break;
      }
    }
  }, [processQueue, recordSingleChunk]);

  const finalizeFullSession = useCallback(async () => {
    if (finalizingSessionRef.current || recordedChunksRef.current.length === 0) {
      return;
    }

    finalizingSessionRef.current = true;
    setIsProcessing(true);

    try {
      const shouldAttemptFinalSarvam =
        !liveTranscriptionDisabledRef.current || !rawTranscriptRef.current.trim();

      if (!shouldAttemptFinalSarvam && rawTranscriptRef.current.trim()) {
        if (!diarizedTextRef.current.trim()) {
          await runDiarization(rawTranscriptRef.current);
        }
        await runExtraction(rawTranscriptRef.current, diarizedTextRef.current);
        return;
      }

      const ext = activeMimeTypeRef.current.includes('ogg') ? 'ogg' : 'webm';
      const sessionBlob = new Blob(recordedChunksRef.current, { type: activeMimeTypeRef.current || 'audio/webm' });
      const fd = new FormData();
      fd.append('file', sessionBlob, `session-recording.${ext}`);
      fd.append('model', 'saaras:v3');
      fd.append('mode', 'translate');
      fd.append('language_code', languageRef.current || 'unknown');

      const resp = await fetch(`${BACKEND_URL}/api/voice/transcribe-session`, {
        method: 'POST',
        body: fd,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429 && rawTranscriptRef.current.trim()) {
          setError('Sarvam rate limit hit during final pass. Using available live transcript.');
          if (!diarizedTextRef.current.trim()) {
            await runDiarization(rawTranscriptRef.current);
          }
          await runExtraction(rawTranscriptRef.current, diarizedTextRef.current);
          return;
        }
        throw new Error(err.details || err.error || `HTTP ${resp.status}`);
      }

      const result = await resp.json() as {
        transcript: string;
        diarized_transcript: string;
        language_code: string;
      };

      if (result.language_code && result.language_code !== 'unknown') {
        languageRef.current = result.language_code;
      }

      if (result.transcript?.trim()) {
        rawTranscriptRef.current = result.transcript.trim();
        setRawTranscript(rawTranscriptRef.current);
      }

      if (result.diarized_transcript?.trim()) {
        applyDiarizedTranscript(result.diarized_transcript);
      } else if (rawTranscriptRef.current.trim()) {
        await runDiarization(rawTranscriptRef.current);
      }

      if (rawTranscriptRef.current.trim()) {
        await runExtraction(rawTranscriptRef.current, result.diarized_transcript || diarizedTextRef.current);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Final transcription failed';
      setError(message);
      console.error('[VoiceRecording] Final session transcription failed:', err);
    } finally {
      finalizingSessionRef.current = false;
      setIsProcessing(false);
    }
  }, [applyDiarizedTranscript, runDiarization, runExtraction]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    try {
      setError(null);
      setReportSaved(false);

      rawTranscriptRef.current = '';
      setRawTranscript('');
      diarizedTextRef.current = '';
      chunkIndexRef.current = 0;
      queueRef.current = [];
      recordedChunksRef.current = [];
      rateLimitedUntilRef.current = 0;
      liveTranscriptionDisabledRef.current = false;
      clearTranscript();
      resetExtraction();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });

      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      activeMimeTypeRef.current = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || 'audio/webm';

      streamRef.current = stream;
      setMicStream(stream);
      isRecordingRef.current = true;
      startTimeRef.current = Date.now();

      setIsRecordingStore(true);
      setSessionReady(true);

      void captureLoop(stream);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('[VoiceRecording] Start failed:', message);
    }
  }, [captureLoop, clearTranscript, resetExtraction, setIsRecordingStore, setSessionReady]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    if (diarizeTimerRef.current) clearTimeout(diarizeTimerRef.current);
    if (extractTimerRef.current) clearTimeout(extractTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    streamRef.current = null;
    setMicStream(null);

    setIsRecordingStore(false);
    setSessionReady(false);

    window.setTimeout(() => {
      void finalizeFullSession();
    }, 250);
  }, [finalizeFullSession, setIsRecordingStore, setSessionReady]);

  const saveReport = useCallback(async (patientName?: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const storeState = useRecordingStore.getState();
      const lines = storeState.transcript.map((line) => ({
        speaker: line.speaker,
        role: line.role === 'physician' ? 'doctor' : line.role,
        text: line.text,
        language: line.language,
        timestamp: line.timestamp,
      }));

      const extraction = storeState.extraction;
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const resp = await fetch(`${BACKEND_URL}/api/voice/save-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName || 'Unknown Patient',
          transcriptLines: lines,
          extraction,
          durationSeconds,
          languageDetected: languageRef.current,
        }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Save failed');

      setReportSaved(true);
      return { success: true, sessionId: result.sessionId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    micStream,
    startRecording,
    stopRecording,
    saveReport,
    rawTranscript,
    isProcessing,
    isSaving,
    reportSaved,
    error,
  };
}

export default useVoiceRecording;
