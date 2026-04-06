'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useRecordingStore from '@/store/useRecordingStore';

const MIN_DECIBELS = -60;
const MAX_DECIBELS = -10;
const BAR_WIDTH = 6;
const BAR_SPACING = 4;
const MAX_SEGMENTS = 24;
const SEGMENT_HEIGHT = 3;
const SEGMENT_SPACING = 4;
const BACKGROUND_COLOR = '#070807';
const BAR_COLOR = '#10b981';

const Visualizer = ({
    showButton,
    stream,
    onStart,
    onStop,
}: {
    showButton: boolean;
    stream?: MediaStream | null;
    onStart?: () => void;
    onStop?: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const dataRef = useRef<Uint8Array | null>(null);

    const isRecording = useRecordingStore((state) => state.isRecording);
    const setIsRecording = useRecordingStore((state) => state.setIsRecording);
    const setSessionReady = useRecordingStore((state) => state.setSessionReady);

    const [error, setError] = useState('');

    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const clearCanvas = useCallback(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, []);

    const cleanupAudio = useCallback(
        (preserveExternalStream = false) => {
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }

            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                void audioContextRef.current.close();
                audioContextRef.current = null;
            }

            if (streamRef.current && !preserveExternalStream) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            streamRef.current = null;
            analyserRef.current = null;
            dataRef.current = null;
            cancelAnimation();
            clearCanvas();
        },
        [cancelAnimation, clearCanvas],
    );

    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        const dataArray = dataRef.current;
        if (!canvas || !analyser || !dataArray) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, width, height);

        const numBars = Math.floor(width / (BAR_WIDTH + BAR_SPACING));
        const step = Math.max(1, Math.floor((dataArray.length * 0.75) / numBars));
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.fillStyle = BAR_COLOR;

        for (let i = 0; i < numBars; i += 1) {
            const offsetIndex = i - Math.floor(numBars / 2);
            const x = centerX + offsetIndex * (BAR_WIDTH + BAR_SPACING);
            const freqIndex = Math.min(dataArray.length - 1, Math.abs(offsetIndex) * step);

            let sum = 0;
            for (let j = 0; j < step; j += 1) {
                sum += dataArray[freqIndex + j] ?? 0;
            }

            const amplitude = step > 0 ? sum / step : 0;
            const percentage = Math.pow(amplitude / 255, 1.5);
            const activeSegments = Math.max(1, Math.floor(percentage * MAX_SEGMENTS));
            const barLength = activeSegments * (SEGMENT_HEIGHT + SEGMENT_SPACING);

            ctx.fillRect(x, centerY - barLength, BAR_WIDTH, barLength * 2);
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
    }, []);

    const startFromStream = useCallback(
        async (inputStream: MediaStream) => {
            if (streamRef.current || audioContextRef.current) return;

            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) {
                setError('AudioContext not supported in this browser.');
                return;
            }

            streamRef.current = inputStream;
            audioContextRef.current = new AudioContextClass();

            const analyser = audioContextRef.current.createAnalyser();
            analyser.minDecibels = MIN_DECIBELS;
            analyser.maxDecibels = MAX_DECIBELS;
            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 512;
            analyserRef.current = analyser;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(inputStream);
            sourceRef.current.connect(analyser);

            dataRef.current = new Uint8Array(analyser.frequencyBinCount);
            cancelAnimation();
            animationFrameRef.current = requestAnimationFrame(drawFrame);

            setError('');
        },
        [cancelAnimation, drawFrame],
    );

    const handleStart = useCallback(async () => {
        if (onStart) {
            // External handler owns mic + recording state; we just visualize.
            onStart();
            return;
        }

        // Fallback: self-managed mic for standalone usage
        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            await startFromStream(micStream);
            setSessionReady(true);
            setIsRecording(true);
        } catch (err) {
            console.error('Mic error:', err);
            setError('Could not access microphone. Check permissions.');
        }
    }, [onStart, startFromStream, setIsRecording, setSessionReady]);

    const handleStop = useCallback(() => {
        if (onStop) {
            onStop();
        }
        cleanupAudio(Boolean(stream));
        setIsRecording(false);
        setSessionReady(false);
    }, [onStop, cleanupAudio, stream, setIsRecording, setSessionReady]);

    // When external stream arrives (from the hook), start visualizing
    useEffect(() => {
        if (stream && stream !== streamRef.current) {
            void startFromStream(stream);
        }

        if (!stream && streamRef.current) {
            cleanupAudio(false);
        }
    }, [stream, startFromStream, cleanupAudio]);

    useEffect(() => {
        return () => {
            cleanupAudio(Boolean(stream));
        };
    }, [cleanupAudio, stream]);

    const defaultText = useMemo(() => {
        if (error) return error;
        if (isRecording) return 'Recording...';
        return 'Standing By';
    }, [error, isRecording]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4 relative">
            <canvas ref={canvasRef} width={800} height={300} className="w-full h-auto rounded-lg bg-[#070807]" />
            {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[#dadada] font-mono tracking-widest text-sm uppercase">{defaultText}</span>
                </div>
            )}
            {showButton && (
                <button
                    onClick={isRecording ? handleStop : handleStart}
                    className={`h-fit w-fit p-4 m-4 ${isRecording ? 'bg-[#dc2626]' : 'bg-[#1f1f1f]'} text-[#dadada] text-2xl font-semibold rounded-2xl font-outfit`}
                    type="button"
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
            )}
        </div>
    );
};

export default Visualizer;
