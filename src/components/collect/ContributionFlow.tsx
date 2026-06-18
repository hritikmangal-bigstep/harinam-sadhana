"use client";

import { useState } from "react";
import { getContributorId } from "@/lib/contributor-id";
import { StepIndicator } from "./StepIndicator";
import { saveAndEnqueue, drainStep } from "@/lib/autosave/upload-queue";
import type { ClipRecord } from "@/lib/autosave/store";
import type { RecordingStep } from "@/lib/steps";

interface StepMeta {
  title: string;
  description: string;
}

const STEPS: Record<1 | 2 | 3 | 4, StepMeta> = {
  1: {
    title: "Keywords",
    description:
      "Speak individual names and keywords used in Harinam chanting.",
  },
  2: {
    title: "Panch-tattva",
    description: "Recite the Panch-tattva mantra at a clear, measured pace.",
  },
  3: {
    title: "Maha-mantra",
    description: "Chant one round of the Hare Krishna Maha-mantra.",
  },
  4: {
    title: "Full round",
    description:
      "Record a complete, uninterrupted round on your japa beads.",
  },
};

/** Metadata about a completed clip take, passed by child step components. */
export interface ClipMeta {
  step: RecordingStep;
  label?: string;
  durationMs?: number;
}

/** Callback signature that child components call when a take is ready. */
export type OnClipReady = (
  clipId: string,
  blob: Blob,
  mimeType: string,
  meta: ClipMeta,
) => void;

interface ContributionFlowProps {
  onStepComplete?: (step: number) => Promise<void>;
  /** Exposed so child step components can call it when a take is captured. */
  onClipReady?: OnClipReady;
}

/** Generate a UUID using the best available API. */
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

export function ContributionFlow({
  onStepComplete,
}: ContributionFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [contributorId] = useState(() => getContributorId());
  const [isSaving, setIsSaving] = useState(false);

  // Session ID: persisted in localStorage, refreshed each page load
  const [sessionId] = useState<string>(() => {
    if (typeof localStorage === "undefined") return generateUUID();
    const stored = localStorage.getItem("kws_session_id");
    if (stored) return stored;
    const id = generateUUID();
    localStorage.setItem("kws_session_id", id);
    return id;
  });

  /** Called by child step components when a take capture is complete. */
  const handleClipReady: OnClipReady = (clipId, blob, mimeType, meta) => {
    const record: ClipRecord = {
      clipId,
      sessionId,
      contributorId,
      step: meta.step,
      label: meta.label,
      blob,
      mimeType,
      durationMs: meta.durationMs,
      status: "queued",
      createdAt: Date.now(),
    };
    void saveAndEnqueue(record);
  };

  const advance = (markComplete: boolean) => {
    if (markComplete) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
    }
    if (currentStep === 4) {
      setIsComplete(true);
    } else {
      setCurrentStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await drainStep(currentStep);
      if (onStepComplete) await onStepComplete(currentStep);
    } finally {
      setIsSaving(false);
    }
    advance(true);
  };

  const handleSkip = () => {
    advance(false);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="text-5xl">🙏</div>
        <h2 className="text-2xl font-bold text-saffron-800">
          Thank you for your contribution!
        </h2>
        <p className="text-saffron-600 max-w-sm">
          Your recordings will help train the Harinam keyword recognition
          model.
        </p>
        <div className="flex gap-4 mt-2">
          {Array.from({ length: 4 }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={[
                "px-3 py-1 rounded-full text-sm font-medium",
                completedSteps.has(step)
                  ? "bg-saffron-600 text-white"
                  : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              Step {step} {completedSteps.has(step) ? "✓" : "skipped"}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator
        currentStep={currentStep}
        totalSteps={4}
        completedSteps={completedSteps}
      />

      <div className="rounded-2xl border border-saffron-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-saffron-800 mb-1">
          Step {currentStep}: {step.title}
        </h2>
        <p className="text-saffron-600 text-sm mb-6">{step.description}</p>

        {/* Child step components mount here and call handleClipReady */}
        <div className="min-h-32 flex items-center justify-center text-gray-400 text-sm italic">
          Recording interface for step {currentStep}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-saffron-600 hover:bg-saffron-50 disabled:opacity-40 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => void handleSaveAndContinue()}
          disabled={isSaving}
          className="px-6 py-2 rounded-lg bg-saffron-600 text-white font-semibold hover:bg-saffron-700 disabled:opacity-40 transition-colors"
        >
          {isSaving ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}

// Export handleClipReady type and ClipRecord for child components
export type { ClipRecord };
