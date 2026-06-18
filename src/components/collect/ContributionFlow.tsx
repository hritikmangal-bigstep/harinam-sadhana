"use client";

import { useState } from "react";
import { getContributorId } from "@/lib/contributor-id";
import { StepIndicator } from "./StepIndicator";

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
    if (onStepComplete) {
      setIsSaving(true);
      try {
        await onStepComplete(currentStep);
      } finally {
        setIsSaving(false);
      }
    }
    advance(true);
  };

  const handleSkip = () => {
    advance(false);
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

        {/* Step content — placeholder until PromptedRecorder is wired in (U5) */}
        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-alt px-4 py-8 text-center font-body text-body-sm text-muted">
          Step {currentStep}: {step.title} capture coming soon
        </div>

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
