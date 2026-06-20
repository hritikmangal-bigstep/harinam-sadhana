"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KEYWORDS, type Keyword } from "@/lib/keywords";

export type Phase = "idle" | "countdown" | "recording" | "feedback" | "done";

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function firstIncomplete(counts: Record<string, number>): Keyword {
  return KEYWORDS.find((kw) => (counts[kw.label] ?? 0) < kw.targetTakes) ?? KEYWORDS[0];
}

function nextInOrder(currentLabel: string, counts: Record<string, number>): Keyword | null {
  const cur = KEYWORDS.findIndex((k) => k.label === currentLabel);
  for (let i = 1; i <= KEYWORDS.length; i++) {
    const kw = KEYWORDS[(cur + i) % KEYWORDS.length];
    if ((counts[kw.label] ?? 0) < kw.targetTakes) return kw;
  }
  return null;
}

interface UseKeywordCyclerProps {
  initialCounts: Record<string, number>;
  onTakeComplete: (label: string, audio: Blob, mimeType: string) => void;
  onTakeCountsChange: (updated: Record<string, number>) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export interface UseKeywordCyclerResult {
  activeKeyword: Keyword;
  localCounts: Record<string, number>;
  phase: Phase;
  countdown: number | null;
  recSecsLeft: number;
  feedbackText: string;
  isRunning: boolean;
  handleStart: () => Promise<void>;
  handlePause: () => void;
  handleSkip: () => void;
}

export function useKeywordCycler({
  initialCounts,
  onTakeComplete,
  onTakeCountsChange,
  onRecordingChange,
}: UseKeywordCyclerProps): UseKeywordCyclerResult {
  const [activeKeyword, setActiveKeyword] = useState<Keyword>(() => firstIncomplete(initialCounts));
  const [localCounts, setLocalCounts] = useState<Record<string, number>>(initialCounts);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recSecsLeft, setRecSecsLeft] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const countsRef = useRef(localCounts);
  const activeKeywordRef = useRef(activeKeyword);
  const runningRef = useRef(false);
  const isStartingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const runCycleRef = useRef<() => Promise<void>>();
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  countsRef.current = localCounts;
  activeKeywordRef.current = activeKeyword;

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (skipTimerRef.current !== null) clearTimeout(skipTimerRef.current);
      try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const getMic = async (): Promise<MediaStream> => {
    if (streamRef.current) return streamRef.current;
    const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    streamRef.current = s;
    return s;
  };

  const recordFor = (durationMs: number): Promise<{ blob: Blob; mimeType: string } | null> =>
    new Promise((resolve) => {
      const s = streamRef.current;
      if (!s) { resolve(null); return; }
      const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = new MediaRecorder(s, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () =>
        resolve({ blob: new Blob(chunks, { type: mimeType || "audio/webm" }), mimeType: mimeType || "audio/webm" });
      mr.start(100);
      const start = Date.now();
      const timer = setInterval(() => {
        const left = Math.ceil((durationMs - (Date.now() - start)) / 1000);
        setRecSecsLeft(Math.max(0, left));
        if (!runningRef.current) { clearInterval(timer); if (mr.state !== "inactive") mr.stop(); }
      }, 100);
      setTimeout(() => { clearInterval(timer); if (mr.state !== "inactive") mr.stop(); }, durationMs);
    });

  const runCycle = useCallback(async () => {
    for (let i = 3; i >= 1; i--) {
      if (!runningRef.current) return;
      setPhase("countdown");
      setCountdown(i);
      await new Promise<void>((r) => setTimeout(r, 700));
    }
    if (!runningRef.current) return;

    const kw = activeKeywordRef.current;
    setPhase("recording");
    setCountdown(null);
    setRecSecsLeft(Math.ceil(kw.recordWindowMs / 1000));

    const result = await recordFor(kw.recordWindowMs);
    if (!runningRef.current || !result) return;

    const { blob, mimeType } = result;
    const label = kw.label;
    const newCount = (countsRef.current[label] ?? 0) + 1;
    const updated = { ...countsRef.current, [label]: newCount };
    countsRef.current = updated;
    setLocalCounts(updated);
    onTakeComplete(label, blob, mimeType);
    onTakeCountsChange(updated);

    setPhase("feedback");
    setFeedbackText("✓ Saved");
    await new Promise<void>((r) => setTimeout(r, 900));
    if (!runningRef.current) return;

    if (newCount >= kw.targetTakes) {
      const next = nextInOrder(kw.label, updated);
      if (!next) {
        setPhase("done");
        runningRef.current = false;
        return;
      }
      activeKeywordRef.current = next;
      setActiveKeyword(next);
    }

    if (runningRef.current) void runCycleRef.current?.();
  }, [onTakeComplete, onTakeCountsChange]);

  runCycleRef.current = runCycle;

  const handleStart = async () => {
    if (runningRef.current || isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      await getMic();
    } catch {
      isStartingRef.current = false;
      return;
    }
    isStartingRef.current = false;
    runningRef.current = true;
    void runCycle();
  };

  const handlePause = () => {
    runningRef.current = false;
    try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("idle");
    setCountdown(null);
  };

  const handleSkip = () => {
    runningRef.current = false;
    if (skipTimerRef.current !== null) clearTimeout(skipTimerRef.current);
    try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
    const curIdx = KEYWORDS.findIndex((k) => k.label === activeKeywordRef.current.label);
    let nextIdx = (curIdx + 1) % KEYWORDS.length;
    for (let t = 0; t < KEYWORDS.length; t++) {
      if ((countsRef.current[KEYWORDS[nextIdx].label] ?? 0) < KEYWORDS[nextIdx].targetTakes) break;
      nextIdx = (nextIdx + 1) % KEYWORDS.length;
    }
    activeKeywordRef.current = KEYWORDS[nextIdx];
    setActiveKeyword(KEYWORDS[nextIdx]);
    skipTimerRef.current = setTimeout(() => {
      skipTimerRef.current = null;
      runningRef.current = true;
      void runCycleRef.current?.();
    }, 200);
  };

  const isRunning = phase !== "idle" && phase !== "done";

  useEffect(() => {
    onRecordingChange?.(isRunning);
  }, [isRunning, onRecordingChange]);

  return {
    activeKeyword,
    localCounts,
    phase,
    countdown,
    recSecsLeft,
    feedbackText,
    isRunning,
    handleStart,
    handlePause,
    handleSkip,
  };
}
