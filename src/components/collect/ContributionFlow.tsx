"use client";

import { useState } from "react";
import { getContributorId } from "@/lib/contributor-id";
import { saveAndEnqueue, drainStep } from "@/lib/autosave/upload-queue";
import type { ClipRecord } from "@/lib/autosave/store";
import type { RecordingStep } from "@/lib/steps";
import { StepIndicator } from "./StepIndicator";
import { PromptedRecorder } from "./PromptedRecorder";
import { RecitationStep } from "./RecitationStep";
import { DemographicsStep } from "./DemographicsStep";
import type { DemographicsData } from "./DemographicsStep";

export interface ClipMeta {
  step: RecordingStep;
  label?: string;
  durationMs?: number;
}

export type OnClipReady = (
  clipId: string,
  blob: Blob,
  mimeType: string,
  meta: ClipMeta,
) => void;

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
    description:
      "Recite the Panch-tattva mantra at a clear, measured pace.",
  },
  3: {
    title: "Maha-mantra",
    description:
      "Chant one round of the Hare Krishna Maha-mantra.",
  },
  4: {
    title: "Full round",
    description:
      "Record a complete, uninterrupted round on your japa beads.",
  },
};

interface ContributionFlowProps {
  onStepComplete?: (step: number) => Promise<void>;
}

export function ContributionFlow({ onStepComplete }: ContributionFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [contributorId] = useState(() => getContributorId());
  const [isSaving, setIsSaving] = useState(false);

  // Demographics gate — shown before Step 1 on first render.
  const [demographicsSubmitted, setDemographicsSubmitted] = useState(false);

  // Step 1 keyword take counts.
  const [takeCounts, setTakeCounts] = useState<Record<string, number>>({});

  const [sessionId] = useState<string>(() => {
    if (typeof localStorage === "undefined") return generateUUID();
    const stored = localStorage.getItem("kws_session_id");
    if (stored) return stored;
    const id = generateUUID();
    localStorage.setItem("kws_session_id", id);
    return id;
  });

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

  // Step 1 keyword take handler — generates a clipId and calls handleClipReady.
  const handleTakeComplete = (label: string, audio: Blob, mimeType: string) => {
    const clipId = generateUUID();
    handleClipReady(clipId, audio, mimeType, { step: "isolated_keyword", label });
  };

  const advance = (completed: boolean) => {
    if (completed) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
    }
    if (currentStep === 4) {
      setIsComplete(true);
      return;
    }
    setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await drainStep(currentStep);
      if (onStepComplete) await onStepComplete(currentStep);

      // Step 4 completion: fire-and-forget summary row to Google Sheets.
      if (currentStep === 4) {
        void fetch("/api/sheets/kws", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributorId,
            sessionId,
            completedSteps: Array.from(completedSteps),
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } finally {
      setIsSaving(false);
    }
    advance(true);
  };

  const handleSkip = () => {
    advance(false);
  };

  // Demographics handlers
  const handleDemographicsSave = async (_data: DemographicsData) => {
    // TODO: pass demographics to upload queue (follow-up task)
    setDemographicsSubmitted(true);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8 text-center shadow-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-4xl">
          🙏
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-h2 text-heading">
            Thank you for contributing!
          </h2>
          <p className="font-body text-body text-muted">
            {completedSteps.size === 0
              ? "Your session has been recorded."
              : completedSteps.size === 1
              ? "You completed 1 step. Every contribution helps!"
              : `You completed ${completedSteps.size} steps. Your recordings help train the AI.`}
          </p>
        </div>
        <p className="font-body text-caption text-muted">
          Contributor ID: <span className="font-mono text-xs">{contributorId}</span>
        </p>
      </div>
    );
  }

  // Demographics gate — render before the step content on first visit.
  if (!demographicsSubmitted) {
    return (
      <DemographicsStep
        onSave={handleDemographicsSave}
        onSkip={() => setDemographicsSubmitted(true)}
      />
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-md">
        <div className="flex flex-col gap-1">
          <p className="font-body text-caption uppercase tracking-wider text-muted">
            Step {currentStep} of 4
          </p>
          <h2 className="font-heading text-h2 text-heading">{step.title}</h2>
          <p className="font-body text-body text-muted">{step.description}</p>
        </div>

        {/* Step content */}
        {currentStep === 1 ? (
          <PromptedRecorder
            takeCounts={takeCounts}
            onTakeComplete={handleTakeComplete}
            onTakeCountsChange={setTakeCounts}
          />
        ) : (
          <RecitationStep
            step={currentStep as 2 | 3 | 4}
            onClipReady={handleClipReady}
          />
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="btn-primary w-full max-w-xs gap-2"
          >
            {isSaving
              ? "Saving…"
              : currentStep === 4
              ? "Save & Finish"
              : "Save & Continue"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="font-body text-body-sm text-muted underline-offset-2 transition-colors hover:text-primary-dark hover:underline"
          >
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}
