"use client";

import { Mic } from "lucide-react";
import { KEYWORDS } from "@/lib/keywords";
import { useKeywordCycler } from "./useKeywordCycler";

interface PromptedRecorderProps {
  takeCounts: Record<string, number>;
  onTakeComplete: (label: string, audio: Blob, mimeType: string) => void;
  onTakeCountsChange: (updated: Record<string, number>) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function PromptedRecorder({
  takeCounts,
  onTakeComplete,
  onTakeCountsChange,
  onRecordingChange,
}: PromptedRecorderProps) {
  const {
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
  } = useKeywordCycler({
    initialCounts: takeCounts,
    onTakeComplete,
    onTakeCountsChange,
    onRecordingChange,
  });

  const currentCount = localCounts[activeKeyword.label] ?? 0;
  const totalCollected = KEYWORDS.reduce(
    (sum, kw) => sum + Math.min(localCounts[kw.label] ?? 0, kw.targetTakes),
    0,
  );
  const totalTarget = KEYWORDS.reduce((sum, kw) => sum + kw.targetTakes, 0);
  const overallPct = Math.round((totalCollected / totalTarget) * 100);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
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

      <div className="card flex w-full max-w-sm flex-col items-center gap-2 py-4 text-center sm:gap-3 sm:py-6">
        <p className="text-caption uppercase tracking-widest text-muted">
          {activeKeyword.keywordSet === "maha_mantra" ? "Maha Mantra" : "Panch Tattva"}
        </p>
        <p
          className="text-4xl font-semibold leading-tight text-[var(--color-heading)] sm:text-5xl"
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

      <div className="flex min-h-[60px] items-center justify-center sm:min-h-[80px]">
        {phase === "countdown" && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-semibold tracking-wide text-[var(--color-primary)]">Please Wait…</span>
            <span className="font-mono text-body-sm text-muted">{countdown}s</span>
          </div>
        )}
        {phase === "recording" && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-red-600 text-white shadow-glow">
              <Mic size={24} aria-hidden="true" />
            </div>
            <span className="text-2xl font-semibold text-red-600">Speak Now</span>
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
