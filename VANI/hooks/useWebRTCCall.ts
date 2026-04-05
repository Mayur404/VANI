'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebRTCCallReturn {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (sessionId: string) => Promise<void>;
    joinCall: (sessionId: string) => Promise<void>;
    endCall: () => void;
    isConnected: boolean;
    error: string | null;
}

const STUN_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

type CallRole = 'agent' | 'customer';

export function useWebRTCCall(): UseWebRTCCallReturn {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const roomIdRef = useRef<string | null>(null);
    const roleRef = useRef<CallRole | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const recorderStopTimeoutRef = useRef<number | null>(null);
    const transcriptLoopActiveRef = useRef(false);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    const cleanupTranscriptLoop = useCallback(() => {
        transcriptLoopActiveRef.current = false;
        if (recorderStopTimeoutRef.current) {
            window.clearTimeout(recorderStopTimeoutRef.current);
            recorderStopTimeoutRef.current = null;
        }
    }, []);

    const cleanup = useCallback(() => {
        cleanupTranscriptLoop();

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.pause();
            remoteAudioRef.current.srcObject = null;
            remoteAudioRef.current = null;
        }

        remoteStreamRef.current = null;
        pendingCandidatesRef.current = [];
        roomIdRef.current = null;
        roleRef.current = null;

        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
    }, [cleanupTranscriptLoop]);

    const sendSignal = useCallback((message: object) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        }
    }, []);

    const flushCandidates = useCallback(async () => {
        if (!peerConnectionRef.current?.remoteDescription?.type) return;

        for (const candidate of pendingCandidatesRef.current) {
            try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
                // Ignore invalid queued candidates.
            }
        }

        pendingCandidatesRef.current = [];
    }, []);

    const addCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        if (!peerConnectionRef.current) return;

        try {
            if (peerConnectionRef.current.remoteDescription?.type) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                pendingCandidatesRef.current.push(candidate);
            }
        } catch {
            // Ignore ICE candidate failures and continue signaling.
        }
    }, []);

    const startTranscriptLoop = useCallback(() => {
        if (roleRef.current !== 'agent' || transcriptLoopActiveRef.current || !localStreamRef.current) return;

        transcriptLoopActiveRef.current = true;

        const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', ''];
        const mimeType = preferredTypes.find((type) => !type || MediaRecorder.isTypeSupported(type)) || '';

        const recordChunk = () => {
            if (!transcriptLoopActiveRef.current || peerConnectionRef.current?.connectionState !== 'connected' || !localStreamRef.current) {
                return;
            }

            const recorder = mimeType
                ? new MediaRecorder(localStreamRef.current, { mimeType })
                : new MediaRecorder(localStreamRef.current);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                if (!transcriptLoopActiveRef.current || chunks.length === 0) {
                    if (transcriptLoopActiveRef.current) recordChunk();
                    return;
                }

                const blob = new Blob(chunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', blob, 'audio.webm');

                try {
                    const response = await fetch('/transcribe-manual', {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();

                    if (data.transcript?.trim()) {
                        sendSignal({
                            type: 'transcript-chunk',
                            role: 'agent',
                            text: data.transcript,
                        });
                    }
                } catch {
                    // Keep the call running if transcription fails.
                }

                if (transcriptLoopActiveRef.current) {
                    recordChunk();
                }
            };

            recorder.start();
            recorderStopTimeoutRef.current = window.setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }, 5000);
        };

        recordChunk();
    }, [sendSignal]);

    const initializePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                sendSignal({ type: 'ice-candidate', candidate });
            }
        };

        pc.ontrack = ({ streams }) => {
            const [stream] = streams;
            if (!stream) return;

            remoteStreamRef.current = stream;
            setRemoteStream(stream);

            if (!remoteAudioRef.current) {
                remoteAudioRef.current = new Audio();
                remoteAudioRef.current.autoplay = true;
            }

            remoteAudioRef.current.srcObject = stream;
            void remoteAudioRef.current.play().catch(() => {
                // Ignore autoplay failures; user gesture typically fixes them.
            });
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                startTranscriptLoop();
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                setIsConnected(false);
                cleanupTranscriptLoop();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [cleanupTranscriptLoop, sendSignal, startTranscriptLoop]);

    const getLocalAudio = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                channelCount: 1,
            },
            video: false,
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
    }, []);

    const connectSocket = useCallback(async (roomId: string, role: CallRole) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.host}/webrtc-signal?room=${roomId}&role=${role}`);

        socketRef.current = socket;
        roomIdRef.current = roomId;
        roleRef.current = role;

        socket.onmessage = async ({ data }) => {
            const msg = JSON.parse(data.toString());

            if (msg.type === 'peer-joined' && role === 'agent') {
                const pc = initializePeerConnection();
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((track) => {
                        if (!pc.getSenders().some((sender) => sender.track === track)) {
                            pc.addTrack(track, localStreamRef.current!);
                        }
                    });
                }

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: 'offer', offer });
                return;
            }

            if (msg.type === 'offer' && role === 'customer') {
                const pc = initializePeerConnection();
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach((track) => {
                        if (!pc.getSenders().some((sender) => sender.track === track)) {
                            pc.addTrack(track, localStreamRef.current!);
                        }
                    });
                }

                await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({ type: 'answer', answer });
                await flushCandidates();
                return;
            }

            if (msg.type === 'answer' && role === 'agent' && peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
                await flushCandidates();
                return;
            }

            if (msg.type === 'ice-candidate') {
                await addCandidate(msg.candidate);
                return;
            }

            if (msg.type === 'call-ended') {
                cleanup();
            }
        };

        socket.onerror = () => {
            setError('Manual call signaling failed.');
        };

        return new Promise<void>((resolve, reject) => {
            let opened = false;

            socket.onopen = () => {
                opened = true;
                resolve();
            };

            socket.onclose = () => {
                if (!opened) {
                    reject(new Error('Signaling connection closed.'));
                }
            };
        });
    }, [addCandidate, cleanup, flushCandidates, initializePeerConnection, sendSignal]);

    const startCall = useCallback(async (sessionId: string) => {
        try {
            setError(null);
            cleanup();
            await getLocalAudio();
            await connectSocket(sessionId, 'agent');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start call');
            cleanup();
        }
    }, [cleanup, connectSocket, getLocalAudio]);

    const joinCall = useCallback(async (sessionId: string) => {
        try {
            setError(null);
            cleanup();
            await getLocalAudio();
            await connectSocket(sessionId, 'customer');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join call');
            cleanup();
        }
    }, [cleanup, connectSocket, getLocalAudio]);

    const endCall = useCallback(() => {
        if (roleRef.current === 'agent') {
            sendSignal({ type: 'end-call' });
        }
        cleanup();
    }, [cleanup, sendSignal]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        localStream,
        remoteStream,
        startCall,
        joinCall,
        endCall,
        isConnected,
        error,
    };
}

export default useWebRTCCall;
