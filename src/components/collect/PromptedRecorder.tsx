"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { KEYWORDS, type Keyword } from "@/lib/keywords";

/** First keyword in KEYWORDS order that hasn't reached its target. */
function firstIncomplete(counts: Record<string, number>): Keyword {
  return KEYWORDS.find((kw) => (counts[kw.label] ?? 0) < kw.targetTakes) ?? KEYWORDS[0];
}

/** Next keyword after `currentLabel` in sequential order, skipping completed ones. */
function nextInOrder(currentLabel: string, counts: Record<string, number>): Keyword | null {
  const cur = KEYWORDS.findIndex((k) => k.label === currentLabel);
  for (let i = 1; i <= KEYWORDS.length; i++) {
    const kw = KEYWORDS[(cur + i) % KEYWORDS.length];
    if ((counts[kw.label] ?? 0) < kw.targetTakes) return kw;
  }
  return null; // all done
}

interface PromptedRecorderProps {
  takeCounts: Record<string, number>;
  onTakeComplete: (label: string, audio: Blob, mimeType: string) => void;
  onTakeCountsChange: (updated: Record<string, number>) => void;
}

type Phase = "idle" | "countdown" | "recording" | "feedback" | "done";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

export function PromptedRecorder({
  takeCounts,
  onTakeComplete,
  onTakeCountsChange,
}: PromptedRecorderProps) {
  const [activeKeyword, setActiveKeyword] = useState<Keyword>(() =>
    firstIncomplete(takeCounts),
  );
  const [localCounts, setLocalCounts] = useState<Record<string, number>>(takeCounts);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recSecsLeft, setRecSecsLeft] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  const countsRef = useRef(localCounts);
  const activeKeywordRef = useRef(activeKeyword);
  const runningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const runCycleRef = useRef<() => Promise<void>>();

  countsRef.current = localCounts;
  activeKeywordRef.current = activeKeyword;

  useEffect(() => {
    return () => {
      runningRef.current = false;
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
    // 3 → 2 → 1 countdown (700 ms each, matching Python script)
    for (let i = 3; i >= 1; i--) {
      if (!runningRef.current) return;
      setPhase("countdown");
      setCountdown(i);
      await sleep(700);
    }
    if (!runningRef.current) return;

    // Auto-record for the keyword's fixed window
    const kw = activeKeywordRef.current;
    setPhase("recording");
    setCountdown(null);
    setRecSecsLeft(Math.ceil(kw.recordWindowMs / 1000));

    const result = await recordFor(kw.recordWindowMs);
    if (!runningRef.current || !result) return;

    // Persist take
    const { blob, mimeType } = result;
    const label = kw.label;
    const newCount = (countsRef.current[label] ?? 0) + 1;
    const updated = { ...countsRef.current, [label]: newCount };
    countsRef.current = updated;
    setLocalCounts(updated);
    onTakeComplete(label, blob, mimeType);
    onTakeCountsChange(updated);

    // Brief "✓ Saved" feedback (900 ms, matching Python script)
    setPhase("feedback");
    setFeedbackText("✓ Saved");
    await sleep(900);
    if (!runningRef.current) return;

    // Switch keyword when this one's target is reached
    if (newCount >= kw.targetTakes) {
      const next = nextInOrder(kw.label, updated);
      if (!next) {
        // All keywords complete
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
    try {
      await getMic();
    } catch {
      return; // mic permission denied — stay idle
    }
    runningRef.current = true;
    void runCycle();
  };

  const handlePause = () => {
    runningRef.current = false;
    try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
    setPhase("idle");
    setCountdown(null);
  };

  const handleSkip = () => {
    runningRef.current = false;
    try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
    // Sequential skip (same as Python script)
    const curIdx = KEYWORDS.findIndex((k) => k.label === activeKeywordRef.current.label);
    let nextIdx = (curIdx + 1) % KEYWORDS.length;
    for (let t = 0; t < KEYWORDS.length; t++) {
      if ((countsRef.current[KEYWORDS[nextIdx].label] ?? 0) < KEYWORDS[nextIdx].targetTakes) break;
      nextIdx = (nextIdx + 1) % KEYWORDS.length;
    }
    activeKeywordRef.current = KEYWORDS[nextIdx];
    setActiveKeyword(KEYWORDS[nextIdx]);
    // Resume cycle after state settles
    setTimeout(() => {
      runningRef.current = true;
      void runCycleRef.current?.();
    }, 200);
  };

  const isRunning = phase !== "idle" && phase !== "done";
  const currentCount = localCounts[activeKeyword.label] ?? 0;
  const totalCollected = KEYWORDS.reduce(
    (sum, kw) => sum + Math.min(localCounts[kw.label] ?? 0, kw.targetTakes),
    0,
  );
  const totalTarget = KEYWORDS.reduce((sum, kw) => sum + kw.targetTakes, 0);
  const overallPct = Math.round((totalCollected / totalTarget) * 100);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Overall progress */}
      <div className="w-full max-w-sm">
        <div className="mb-1 flex items-center justify-between text-caption text-muted">
          <span>Overall progress</span>
          <span>{overallPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Keyword prompt card */}
      <div className="card flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <p className="text-caption uppercase tracking-widest text-muted">
          {activeKeyword.keywordSet === "maha_mantra" ? "Maha Mantra" : "Panch Tattva"}
        </p>
        <p
          className="text-5xl font-semibold leading-tight text-[var(--color-heading)]"
          style={{ fontFamily: "var(--font-mantra)" }}
        >
          {activeKeyword.devanagari}
        </p>
        <p className="font-body text-body-sm italic text-muted">
          {activeKeyword.transliteration}
        </p>
        <span className="rounded-pill bg-[var(--color-primary-light)] px-3 py-0.5 text-caption font-medium text-[var(--color-heading)]">
          Take {Math.min(currentCount + 1, activeKeyword.targetTakes)} / {activeKeyword.targetTakes}
        </span>
      </div>

      {/* Status display */}
      <div className="flex min-h-[80px] items-center justify-center">
        {phase === "countdown" && countdown !== null && (
          <span className="text-7xl font-extrabold text-[var(--color-primary)]">{countdown}</span>
        )}
        {phase === "recording" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-red-600 text-white shadow-glow">
              <Mic size={24} aria-hidden="true" />
            </div>
            <span className="font-mono text-body-sm text-muted">{recSecsLeft}s</span>
          </div>
        )}
        {phase === "feedback" && (
          <span className="text-2xl font-semibold text-green-600">{feedbackText}</span>
        )}
        {phase === "idle" && (
          <p className="font-body text-body-sm text-muted">
            Press Start — recording begins automatically
          </p>
        )}
        {phase === "done" && (
          <p className="font-body text-body-sm font-semibold text-green-600">
            ✓ All keywords complete!
          </p>
        )}
      </div>

      {/* Keyword chips */}
      <div className="flex max-w-sm flex-wrap justify-center gap-1.5">
        {KEYWORDS.map((kw) => {
          const count = localCounts[kw.label] ?? 0;
          const done = count >= kw.targetTakes;
          const active = kw.label === activeKeyword.label;
          return (
            <span
              key={kw.label}
              title={`${kw.transliteration}: ${count}/${kw.targetTakes}`}
              className={[
                "rounded-pill px-2 py-0.5 text-caption transition-colors",
                done
                  ? "bg-[var(--color-secondary-light)] text-[var(--color-heading)]"
                  : active
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-alt)] text-muted",
              ].join(" ")}
            >
              {kw.transliteration} {count}/{kw.targetTakes}
            </span>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            type="button"
            onClick={() => void handleStart()}
            className="btn-primary h-10 px-8 text-body-sm"
          >
            ▶ Start
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handlePause}
              className="btn-secondary h-10 px-6 text-body-sm"
            >
              ⏸ Pause
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="btn-secondary h-10 px-5 text-body-sm"
            >
              → Next Word
            </button>
          </>
        )}
      </div>
    </div>
  );
}
