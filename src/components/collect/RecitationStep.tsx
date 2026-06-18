"use client";

import { useCallback, useState } from "react";
import { AudioRecorder, type RecordingValue } from "@/components/recorder/AudioRecorder";
import { STEP_TO_RECORDING_STEP } from "@/lib/steps";
import type { ClipMeta } from "./ContributionFlow";

export interface RecitationStepProps {
  step: 2 | 3 | 4;
  onClipReady: (clipId: string, blob: Blob, mimeType: string, meta: ClipMeta) => void;
}

interface StepContent {
  heading: string;
  prompt: string;
}

const STEP_CONTENT: Record<2 | 3 | 4, StepContent> = {
  2: {
    heading: "Panch-tattva invocation",
    prompt: "Please recite the Panch-tattva mantra once at a clear, measured pace.",
  },
  3: {
    heading: "Hare Krishna Maha-mantra",
    prompt: "Please chant one full round of the Hare Krishna maha-mantra.",
  },
  4: {
    heading: "Full round (Panch-tattva + Maha-mantra)",
    prompt:
      "Please chant the Panch-tattva invocation followed by one complete round of the maha-mantra.",
  },
};

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function RecitationStep({ step, onClipReady }: RecitationStepProps) {
  const [pending, setPending] = useState<RecordingValue | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);

  const handleChange = useCallback((value: RecordingValue | null) => {
    if (!value) {
      // Recorder reset internally (e.g. internal Re-record pressed)
      setPending(null);
      return;
    }
    setPending(value);
  }, []);

  const handleSave = useCallback(() => {
    if (!pending) return;
    const clipId = generateUUID();
    const meta: ClipMeta = {
      step: STEP_TO_RECORDING_STEP[step],
      durationMs: pending.seconds * 1000,
    };
    onClipReady(clipId, pending.blob, pending.mimeType, meta);
    setPending(null);
    setRecorderKey((k) => k + 1);
  }, [pending, step, onClipReady]);

  const handleReRecord = useCallback(() => {
    setPending(null);
    setRecorderKey((k) => k + 1);
  }, []);

  const content = STEP_CONTENT[step];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Prompt card */}
      <div className="card flex w-full max-w-sm flex-col gap-2 text-center">
        <p className="text-caption uppercase tracking-widest text-muted">
          {content.heading}
        </p>
        <p className="font-body text-body text-foreground">{content.prompt}</p>
      </div>

      {/* Recorder */}
      <AudioRecorder key={recorderKey} onChange={handleChange} />

      {/* Confirm / re-record actions shown once a recording is captured */}
      {pending && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary h-10 px-6 text-body-sm"
          >
            Save recording
          </button>
          <button
            type="button"
            onClick={handleReRecord}
            className="btn-secondary h-10 px-5 text-body-sm"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
