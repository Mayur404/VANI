"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, AlertCircle, Bot, Phone, Mic, PhoneOff } from "lucide-react";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";
import useRecordingStore from "@/store/useRecordingStore";

// Mock doctor data - replace with real data from backend
const MOCK_DOCTOR = {
    name: "Dr. Priya Sharma",
    hospital: "Apollo Hospitals",
};

const CustomerAICallView = ({
    sessionId,
    onClose,
}: {
    sessionId: string;
    onClose: () => void;
}) => {
    const [started, setStarted] = useState(false);
    const [statusText, setStatusText] = useState("Connecting...");
    const [micStatus, setMicStatus] = useState<"off" | "listening" | "processing">("off");
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioQueueRef = useRef<Array<{ audio: string; text: string; isFinal: boolean }>>([]);
    const pendingAudioQueueRef = useRef<Array<{ audio: string; text: string; isFinal: boolean }>>([]);
    const isPlayingAudioRef = useRef(false);
    const isRecordingRef = useRef(false);
    const audioChunksRef = useRef<Blob[]>([]);
    const silenceCleanupRef = useRef<(() => void) | null>(null);
    const startedRef = useRef(false);
    const callEndedRef = useRef(false);
    const isAISpeakingRef = useRef(false);

    const stopRecording = () => {
        silenceCleanupRef.current?.();
        silenceCleanupRef.current = null;

        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }

        isRecordingRef.current = false;
        setMicStatus("off");
    };

    const playAudio = async (base64Audio: string) => {
        if (callEndedRef.current) return;

        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);

        for (let i = 0; i < audioData.length; i += 1) {
            view[i] = audioData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);

        try {
            await new Promise<void>((resolve) => {
                const audio = new Audio(url);
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
                audio.play().catch(() => resolve());
            });
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    const processAudioQueue = async () => {
        if (isPlayingAudioRef.current || audioQueueRef.current.length === 0 || callEndedRef.current) return;

        isPlayingAudioRef.current = true;
        const nextChunk = audioQueueRef.current.shift();

        if (!nextChunk) {
            isPlayingAudioRef.current = false;
            return;
        }

        const { audio, text, isFinal } = nextChunk;
        setStatusText(`AI: ${text}`);
        isAISpeakingRef.current = true;
        setIsAISpeaking(true);
        setMicStatus("off");
        await playAudio(audio);
        isPlayingAudioRef.current = false;

        if (callEndedRef.current) return;

        if (audioQueueRef.current.length > 0) {
            void processAudioQueue();
            return;
        }

        if (isFinal) {
            isAISpeakingRef.current = false;
            setIsAISpeaking(false);
            setStatusText("Your turn - speak now...");
            startRecording();
        }
    };

    const startRecording = () => {
        if (isRecordingRef.current || isAISpeakingRef.current || callEndedRef.current || !localStreamRef.current) return;

        isRecordingRef.current = true;
        audioChunksRef.current = [];

        const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", ""];
        const mimeType = preferredTypes.find((type) => !type || MediaRecorder.isTypeSupported(type)) || "";

        mediaRecorderRef.current = mimeType
            ? new MediaRecorder(localStreamRef.current, { mimeType, audioBitsPerSecond: 128000 })
            : new MediaRecorder(localStreamRef.current);

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
            isRecordingRef.current = false;

            if (isAISpeakingRef.current || callEndedRef.current) return;

            if (audioChunksRef.current.length === 0) {
                setStatusText("Nothing heard - speak again.");
                setMicStatus("off");
                return;
            }

            setMicStatus("processing");
            setStatusText("Processing your response...");

            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", blob, "audio.webm");

            try {
                const response = await fetch("/transcribe-ai", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                const transcript = data.transcript || "";
                const languageCode = data.language_code || "en-IN";

                if (transcript.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
                    setStatusText(`You: ${transcript}`);
                    wsRef.current.send(
                        JSON.stringify({
                            type: "customer-speech",
                            transcript,
                            languageCode,
                        }),
                    );
                } else if (!callEndedRef.current) {
                    setStatusText("Nothing heard - speak again.");
                    setMicStatus("off");
                    setTimeout(() => startRecording(), 1000);
                }
            } catch {
                if (!callEndedRef.current) {
                    setStatusText("Speech recognition failed. Trying again...");
                    setMicStatus("off");
                    setTimeout(() => startRecording(), 1000);
                }
            }
        };

        mediaRecorderRef.current.start(100);
        setMicStatus("listening");
        setStatusText("Your turn - speak now...");

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(localStreamRef.current);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        let speechDetected = false;
        let silenceStart: number | null = null;
        const SPEECH_THRESHOLD = 12;
        const SILENCE_AFTER_SPEECH = 2000;
        const MAX_DURATION = 12000;

        const checkInterval = window.setInterval(() => {
            if (!isRecordingRef.current || isAISpeakingRef.current || callEndedRef.current) {
                window.clearInterval(checkInterval);
                void audioContext.close();
                return;
            }

            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const volume = data.reduce((sum, value) => sum + value, 0) / data.length;

            if (volume > SPEECH_THRESHOLD) {
                speechDetected = true;
                silenceStart = null;
                setStatusText("Listening...");
            } else if (speechDetected) {
                if (!silenceStart) silenceStart = Date.now();
                if (Date.now() - silenceStart >= SILENCE_AFTER_SPEECH) {
                    window.clearInterval(checkInterval);
                    void audioContext.close();
                    if (mediaRecorderRef.current?.state === "recording") {
                        mediaRecorderRef.current.stop();
                    }
                }
            }
        }, 100);

        const timeoutId = window.setTimeout(() => {
            window.clearInterval(checkInterval);
            void audioContext.close();
            if (mediaRecorderRef.current?.state === "recording" && !callEndedRef.current) {
                mediaRecorderRef.current.stop();
            }
        }, MAX_DURATION);

        silenceCleanupRef.current = () => {
            window.clearInterval(checkInterval);
            window.clearTimeout(timeoutId);
            void audioContext.close();
        };
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 1,
                    },
                });
            } catch {
                if (isMounted) {
                    setStatusText("Microphone access denied. Please allow it and refresh.");
                }
                return;
            }

            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const ws = new WebSocket(`${protocol}//${window.location.host}/ai-call?session=${sessionId}`);
            wsRef.current = ws;

            ws.onopen = () => {
                if (isMounted) {
                    setStatusText("Connected. Please wait...");
                }
            };

            ws.onclose = () => {
                if (!callEndedRef.current && isMounted) {
                    setStatusText("Call ended.");
                    setMicStatus("off");
                    isAISpeakingRef.current = false;
                    setIsAISpeaking(false);
                    stopRecording();
                }
            };

            ws.onerror = () => {
                if (isMounted) {
                    setStatusText("Connection error. Please refresh.");
                }
            };

            ws.onmessage = async ({ data }) => {
                if (!isMounted || callEndedRef.current) return;

                const message = JSON.parse(data.toString());

                if (message.type === "call-ended") {
                    callEndedRef.current = true;
                    setCallEnded(true);
                    stopRecording();
                    setStatusText("Call ended. Thank you.");
                    setMicStatus("off");
                    isAISpeakingRef.current = false;
                    setIsAISpeaking(false);
                    return;
                }

                if (message.type === "ai-speech") {
                    const item = {
                        audio: message.audio,
                        text: message.text,
                        isFinal: message.isFinal !== false,
                    };

                    if (!startedRef.current) {
                        pendingAudioQueueRef.current.push(item);
                        setStatusText('Click "Start Conversation" when ready');
                        return;
                    }

                    stopRecording();
                    audioQueueRef.current.push(item);
                    void processAudioQueue();
                }
            };
        };

        void init();

        return () => {
            isMounted = false;
            callEndedRef.current = true;
            setCallEnded(true);
            stopRecording();
            wsRef.current?.close();
            localStreamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, [sessionId]);

    const handleStartConversation = () => {
        startedRef.current = true;
        setStarted(true);

        if (pendingAudioQueueRef.current.length > 0) {
            audioQueueRef.current = [...pendingAudioQueueRef.current];
            pendingAudioQueueRef.current = [];
            void processAudioQueue();
        }
    };

    const handleEndCall = () => {
        callEndedRef.current = true;
        setCallEnded(true);
        stopRecording();
        wsRef.current?.send(JSON.stringify({ type: "call-ended" }));
        wsRef.current?.close();
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        onClose();
    };

    return (
        <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#1f1f1f] flex flex-col items-center gap-6">
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isAISpeaking ? "bg-blue-500/30 shadow-[0_0_32px_rgba(59,130,246,0.45)]" : micStatus === "listening" ? "bg-green-500/20 shadow-[0_0_28px_rgba(34,197,94,0.35)]" : "bg-blue-500/20"
                    }`}
                >
                    <Bot size={28} className="text-blue-400" />
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-white text-2xl font-bold font-oxanium">AI Call Ready</h1>
                    <p className="text-[#9d9d9d] text-sm font-lexend">{statusText}</p>
                </div>

                <div className="w-full rounded-lg p-4 bg-[#0e0e0e] border-[#717171]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-[#6b6b6b] tracking-widest">SESSION</span>
                        <span className="text-xs font-mono text-blue-400">AI</span>
                    </div>
                    <p className="text-[#dadada] text-sm font-lexend break-all">{sessionId}</p>
                </div>

                <div
                    className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest ${
                        micStatus === "listening"
                            ? "bg-green-500/20 text-green-400"
                            : micStatus === "processing"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-[#1f1f1f] text-[#9d9d9d]"
                    }`}
                >
                    {micStatus === "listening" ? "MIC LISTENING" : micStatus === "processing" ? "PROCESSING" : "MIC OFF"}
                </div>

                <button
                    onClick={handleStartConversation}
                    disabled={started || callEnded}
                    className="w-full py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                    <Mic size={18} />
                    {started ? "Conversation Started" : "Start Conversation"}
                </button>

                <button
                    onClick={handleEndCall}
                    className="w-full py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626] hover:bg-[#b91c1c] flex items-center justify-center gap-2"
                >
                    <PhoneOff size={18} />
                    End Call
                </button>
            </div>
        </div>
    );
};

const CustomerManualCallView = ({
    roomId,
    onClose,
}: {
    roomId: string;
    onClose: () => void;
}) => {
    const [statusText, setStatusText] = useState("Ringing...");
    const [accepted, setAccepted] = useState(false);
    const [connected, setConnected] = useState(false);
    const [errorText, setErrorText] = useState("");

    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    const cleanup = () => {
        pcRef.current?.close();
        pcRef.current = null;
        wsRef.current?.close();
        wsRef.current = null;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        remoteAudioRef.current?.pause();
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        pendingCandidatesRef.current = [];
    };

    const addCandidate = async (candidate: RTCIceCandidateInit) => {
        try {
            if (pcRef.current?.remoteDescription?.type) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        } catch {
            // Ignore bad candidates to keep the call alive.
        }
    };

    const flushCandidates = async () => {
        if (!pcRef.current?.remoteDescription?.type) return;

        for (const candidate of pendingCandidatesRef.current) {
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
                // Ignore queued ICE failures.
            }
        }

        pendingCandidatesRef.current = [];
    };

    const setupPeerConnection = async () => {
        if (pcRef.current) return pcRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.ontrack = ({ streams }) => {
            const [stream] = streams;
            if (!stream) return;

            if (!remoteAudioRef.current) {
                remoteAudioRef.current = new Audio();
                remoteAudioRef.current.autoplay = true;
            }

            remoteAudioRef.current.srcObject = stream;
            void remoteAudioRef.current.play().catch(() => {
                // Autoplay can be blocked until user gesture.
            });

            setConnected(true);
            setStatusText("Connected to agent");
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "ice-candidate", candidate }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setConnected(true);
                setStatusText("Connected to agent");
            }

            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                setStatusText("Call disconnected.");
            }
        };

        pcRef.current = pc;
        return pc;
    };

    const acceptCall = async () => {
        setAccepted(true);
        setStatusText("Connecting...");
        setErrorText("");

        try {
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1,
                },
                video: false,
            });
        } catch {
            setErrorText("Microphone permission was denied.");
            setStatusText("Mic access required");
            return;
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const ws = new WebSocket(`${protocol}//${window.location.host}/webrtc-signal?room=${roomId}&role=customer`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatusText("Waiting for agent...");
        };

        ws.onerror = () => {
            setErrorText("Connection error.");
            setStatusText("Connection failed");
        };

        ws.onclose = () => {
            if (!connected) {
                setStatusText("Call ended.");
            }
        };

        ws.onmessage = async ({ data }) => {
            const msg = JSON.parse(data.toString());

            if (msg.type === "offer") {
                const pc = await setupPeerConnection();
                await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: "answer", answer }));
                await flushCandidates();
                return;
            }

            if (msg.type === "ice-candidate") {
                await addCandidate(msg.candidate);
                return;
            }

            if (msg.type === "call-ended") {
                setStatusText("Call ended.");
                cleanup();
            }
        };
    };

    const endCall = () => {
        cleanup();
        onClose();
    };

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    return (
        <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#1f1f1f] flex flex-col items-center gap-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${connected ? "bg-teal-500/30 shadow-[0_0_28px_rgba(45,212,191,0.35)]" : "bg-teal-500/20"}`}>
                    <Phone size={28} className="text-teal-400" />
                </div>

                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-white text-2xl font-bold font-oxanium">Incoming Call</h1>
                    <p className="text-[#9d9d9d] text-sm font-lexend">{statusText}</p>
                </div>

                <div className="w-full rounded-lg p-4 bg-[#0e0e0e] border-[#717171]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-[#6b6b6b] tracking-widest">ROOM</span>
                        <span className="text-xs font-mono text-teal-400">MANUAL</span>
                    </div>
                    <p className="text-[#dadada] text-sm font-lexend break-all">{roomId}</p>
                </div>

                {errorText && (
                    <div className="w-full rounded-lg p-4 bg-red-500/10 border border-red-500/30">
                        <p className="text-red-300 text-sm font-lexend">{errorText}</p>
                    </div>
                )}

                {!accepted && (
                    <button
                        onClick={acceptCall}
                        className="w-full py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <Mic size={18} />
                        Accept Call
                    </button>
                )}

                <button
                    onClick={endCall}
                    className="w-full py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626] hover:bg-[#b91c1c] flex items-center justify-center gap-2"
                >
                    <PhoneOff size={18} />
                    {connected ? "End Call" : "Decline"}
                </button>
            </div>
        </div>
    );
};

const PatientJoinPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = params.sessionId as string;
    const joinType = searchParams.get("type");

    const [status, setStatus] = useState<"loading" | "ready" | "connected" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    const { joinCall, endCall, isConnected, error: webrtcError } = useWebRTCCall();

    const setCallStatus = useRecordingStore((state) => state.setCallStatus);
    const setSessionId = useRecordingStore((state) => state.setSessionId);

    useEffect(() => {
        if (joinType === "ai" || joinType === "manual") {
            setSessionId(sessionId);
            return;
        }

        if (!sessionId || sessionId.length < 36) {
            setStatus("error");
            setErrorMsg("This link has expired or is invalid.");
            return;
        }

        setSessionId(sessionId);
        setStatus("ready");
    }, [joinType, sessionId, setSessionId]);

    useEffect(() => {
        if (webrtcError) {
            setStatus("error");
            setErrorMsg(webrtcError);
        }
    }, [webrtcError]);

    useEffect(() => {
        if (isConnected) {
            setStatus("connected");
            setCallStatus("connected");
        }
    }, [isConnected, setCallStatus]);

    const handleJoinCall = async () => {
        try {
            setStatus("loading");
            await joinCall(sessionId);
        } catch (err) {
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Failed to join call");
        }
    };

    const handleCancel = () => {
        endCall();
        router.push("/");
    };

    if (joinType === "ai") {
        return <CustomerAICallView sessionId={sessionId} onClose={() => router.push("/")} />;
    }

    if (joinType === "manual") {
        return <CustomerManualCallView roomId={sessionId} onClose={() => router.push("/")} />;
    }

    if (status === "error") {
        return (
            <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#dc2626]/30 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-[#dc2626]/20 flex items-center justify-center">
                        <AlertCircle size={32} className="text-[#dc2626]" />
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-white text-xl font-bold font-oxanium">Link Expired</h2>
                        <p className="text-[#9d9d9d] text-sm font-lexend">{errorMsg}</p>
                    </div>

                    <button
                        onClick={handleCancel}
                        className="w-full py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#1f1f1f] hover:bg-[#2b2b2b]"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === "connected") {
        return (
            <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#1f1f1f] flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-white text-xl font-bold font-oxanium">Connected</h2>
                        <p className="text-[#9d9d9d] text-sm font-lexend">You are now talking with {MOCK_DOCTOR.name}</p>
                    </div>

                    <div className="w-full rounded-lg p-4 bg-[#0e0e0e] border-[#717171]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#6b6b6b] tracking-widest">CALL DURATION</span>
                            <span className="text-sm font-oxanium text-[#10b981]">Live</span>
                        </div>
                        <p className="text-[#dadada] text-sm font-lexend">
                            The call is being recorded and transcribed for medical documentation purposes.
                        </p>
                    </div>

                    <button
                        onClick={handleCancel}
                        className="w-full py-3 rounded-xl text-white font-semibold font-outfit transition-all duration-200 bg-[#dc2626] hover:bg-[#b91c1c]"
                    >
                        End Call
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#080708] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f0e10] rounded-2xl p-8 border border-[#1f1f1f] flex flex-col items-center gap-6">
                {/* VANI Logo */}
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-lg font-bold text-teal-500 font-oxanium">V</span>
                </div>

                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-white text-2xl font-bold font-oxanium">Your Doctor is Calling</h1>
                    <p className="text-[#9d9d9d] text-sm font-lexend">Please join the call when ready</p>
                </div>

                {/* Doctor Info Card */}
                <div className="w-full rounded-lg p-4 bg-[#0e0e0e] border-[#717171] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 border-teal-500/50 flex items-center justify-center">
                        <Stethoscope size={20} className="text-teal-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold font-lexend text-sm">{MOCK_DOCTOR.name}</span>
                        <span className="text-[#6b6b6b] text-xs font-lexend">{MOCK_DOCTOR.hospital}</span>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-500 text-xs font-mono tracking-widest">Ready to connect</span>
                </div>

                {/* Join Button */}
                <button
                    onClick={handleJoinCall}
                    disabled={status !== "ready"}
                    className="w-full py-4 rounded-xl text-white font-semibold text-lg font-outfit transition-all duration-200 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === "loading" ? "Connecting..." : "Join Call"}
                </button>

                {/* Consent Notice */}
                <p className="text-[#6b6b6b] text-[11px] font-lexend text-center leading-relaxed">
                    By joining, you consent to this call being recorded and transcribed
                    for medical documentation.
                </p>

                {/* Cancel Link */}
                <button
                    onClick={handleCancel}
                    className="text-[#6b6b6b] text-xs font-lexend hover:text-[#9d9d9d] transition-colors"
                >
                    Not ready? Close this page
                </button>
            </div>
        </div>
    );
};

export default PatientJoinPage;
