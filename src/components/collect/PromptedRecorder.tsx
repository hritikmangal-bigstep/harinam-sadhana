"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder, type RecordingValue } from "@/components/recorder/AudioRecorder";
import { pickFewestTaken, KEYWORDS, type Keyword } from "@/lib/keywords";

interface PromptedRecorderProps {
  takeCounts: Record<string, number>;
  onTakeComplete: (label: string, audio: Blob, mimeType: string) => void;
  onTakeCountsChange: (updated: Record<string, number>) => void;
}

export function PromptedRecorder({
  takeCounts,
  onTakeComplete,
  onTakeCountsChange,
}: PromptedRecorderProps) {
  const [activeKeyword, setActiveKeyword] = useState<Keyword>(() =>
    pickFewestTaken(takeCounts),
  );
  // Local counts mirror parent; we keep a ref for the latest value inside callbacks.
  const [localCounts, setLocalCounts] = useState<Record<string, number>>(takeCounts);
  const countsRef = useRef(localCounts);
  countsRef.current = localCounts;

  // Pending take: the recording that has just been captured, awaiting confirmation.
  const [pending, setPending] = useState<RecordingValue | null>(null);
  // Key used to remount AudioRecorder (forces reset to idle after each take).
  const [recorderKey, setRecorderKey] = useState(0);

  // Sync parent takeCounts into local state when parent changes externally.
  useEffect(() => {
    setLocalCounts(takeCounts);
    setActiveKeyword(pickFewestTaken(takeCounts));
  }, [takeCounts]);

  const handleRecordingChange = useCallback((value: RecordingValue | null) => {
    if (!value) return; // idle/reset — nothing to do
    setPending(value);
  }, []);

  const confirmTake = useCallback(() => {
    if (!pending) return;
    const label = activeKeyword.label;
    const updated = {
      ...countsRef.current,
      [label]: (countsRef.current[label] ?? 0) + 1,
    };
    setLocalCounts(updated);
    countsRef.current = updated;
    onTakeComplete(label, pending.blob, pending.mimeType);
    onTakeCountsChange(updated);
    const next = pickFewestTaken(updated);
    setActiveKeyword(next);
    setPending(null);
    setRecorderKey((k) => k + 1);
  }, [pending, activeKeyword.label, onTakeComplete, onTakeCountsChange]);

  const discardTake = useCallback(() => {
    setPending(null);
    setRecorderKey((k) => k + 1);
  }, []);

  const currentCount = localCounts[activeKeyword.label] ?? 0;
  const totalKeywords = KEYWORDS.length;
  const totalCollected = KEYWORDS.reduce(
    (sum, kw) => sum + Math.min(localCounts[kw.label] ?? 0, kw.targetTakes),
    0,
  );
  const totalTarget = KEYWORDS.reduce((sum, kw) => sum + kw.targetTakes, 0);
  const overallPct = Math.round((totalCollected / totalTarget) * 100);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Overall progress strip */}
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
          Take {currentCount + 1} / {activeKeyword.targetTakes}
        </span>
      </div>

      {/* Keyword count chips */}
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
        <span className="sr-only">
          {totalKeywords} keywords, {totalCollected} of {totalTarget} takes recorded
        </span>
      </div>

      {/* Recorder */}
      <AudioRecorder key={recorderKey} onChange={handleRecordingChange} />

      {/* Confirm / re-record actions shown once a take is captured */}
      {pending && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={confirmTake}
            className="btn-primary h-10 px-6 text-body-sm"
          >
            Save take
          </button>
          <button
            type="button"
            onClick={discardTake}
            className="btn-secondary h-10 px-5 text-body-sm"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
