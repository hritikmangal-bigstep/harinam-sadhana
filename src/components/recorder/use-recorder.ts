"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioMimeType } from "@/types";
import {
  computeQualityMetrics,
  decodeBlob,
  type QualityMetrics,
} from "@/lib/quality-metrics";

export type RecorderStatus =
  | "idle"
  | "recording"
  | "completed"
  | "uploading"
  | "done";

export const MIN_DURATION_SECONDS = 3;
export const MAX_DURATION_SECONDS = 30 * 60;
/** Number of amplitude bars exposed for the petal waveform visualizer. */
const WAVEFORM_BARS = 12;

interface RecorderState {
  status: RecorderStatus;
  /** Elapsed seconds while recording / final clip length once completed. */
  seconds: number;
  /** Normalized 0–100 amplitudes for the waveform, length WAVEFORM_BARS. */
  amplitudes: number[];
  /** Completed recording, ready to offer. */
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: AudioMimeType | null;
  /** True briefly when a release happened under MIN_DURATION_SECONDS. */
  tooShort: boolean;
  error: string | null;
  /** Quality metrics computed asynchronously after a recording is finalised. Null until available. */
  metrics: QualityMetrics | null;
}

/** Pick the best-supported recording MIME: webm/opus, else mp4 fallback. */
function pickMimeType(): AudioMimeType | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus"))
    return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return null;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    status: "idle",
    seconds: 0,
    amplitudes: new Array(WAVEFORM_BARS).fill(0),
    audioBlob: null,
    audioUrl: null,
    mimeType: null,
    tooShort: false,
    error: null,
    metrics: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const cancelledRef = useRef<boolean>(false);
  const audioUrlRef = useRef<string | null>(null);
  const metricsGenRef = useRef(0);

  /** Stop and fully release the mic stream + audio graph (no lingering mic). */
  const releaseStream = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const sampleAmplitudes = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.floor(data.length / WAVEFORM_BARS) || 1;
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i += 1) {
      bars.push(Math.round((data[i * step] / 255) * 100));
    }
    setState((s) => ({ ...s, amplitudes: bars }));
    rafRef.current = requestAnimationFrame(sampleAmplitudes);
  }, []);

  const start = useCallback(async () => {
    if (state.status === "recording") return;
    const mimeType = pickMimeType();
    if (!mimeType) {
      setState((s) => ({
        ...s,
        error: "Recording is not supported in this browser.",
      }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelledRef.current = false;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        releaseStream();
        if (cancelledRef.current) {
          setState((s) => ({
            ...s,
            status: "idle",
            seconds: 0,
            amplitudes: new Array(WAVEFORM_BARS).fill(0),
          }));
          return;
        }
        if (elapsed < MIN_DURATION_SECONDS) {
          setState((s) => ({
            ...s,
            status: "idle",
            seconds: 0,
            tooShort: true,
            amplitudes: new Array(WAVEFORM_BARS).fill(0),
          }));
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setState((s) => ({
          ...s,
          status: "completed",
          seconds: Math.round(elapsed),
          audioBlob: blob,
          audioUrl: url,
          mimeType,
          metrics: null,
        }));
        const gen = ++metricsGenRef.current;
        void decodeBlob(blob).then((buffer) => {
          if (buffer && metricsGenRef.current === gen) {
            setState((s) => ({ ...s, metrics: computeQualityMetrics(buffer) }));
          }
        });
      };

      // Live amplitude graph for the petal waveform.
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      startTimeRef.current = Date.now();
      recorder.start(200);
      setState((s) => ({
        ...s,
        status: "recording",
        seconds: 0,
        tooShort: false,
        error: null,
      }));

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed >= MAX_DURATION_SECONDS) {
          // Auto-stop at the 30-minute ceiling.
          recorderRef.current?.stop();
          return;
        }
        setState((s) => ({ ...s, seconds: Math.floor(elapsed) }));
      }, 250);
      rafRef.current = requestAnimationFrame(sampleAmplitudes);
    } catch {
      releaseStream();
      setState((s) => ({
        ...s,
        error: "Microphone access was denied.",
      }));
    }
  }, [releaseStream, sampleAmplitudes, state.status]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const reset = useCallback(() => {
    metricsGenRef.current++;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setState({
      status: "idle",
      seconds: 0,
      amplitudes: new Array(WAVEFORM_BARS).fill(0),
      audioBlob: null,
      audioUrl: null,
      mimeType: null,
      tooShort: false,
      error: null,
      metrics: null,
    });
  }, []);

  const clearTooShort = useCallback(() => {
    setState((s) => (s.tooShort ? { ...s, tooShort: false } : s));
  }, []);

  const setStatus = useCallback((status: RecorderStatus) => {
    setState((s) => ({ ...s, status }));
  }, []);

  // Release mic + revoke object URLs on unmount (mic must not stay live).
  useEffect(() => {
    return () => {
      metricsGenRef.current++;
      releaseStream();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [releaseStream]);

  return {
    ...state,
    start,
    stop,
    cancel,
    reset,
    clearTooShort,
    setStatus,
  };
}
