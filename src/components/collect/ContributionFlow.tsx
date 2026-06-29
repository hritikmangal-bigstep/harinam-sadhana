"use client";

import { useRef, useState } from "react";
import { getContributorId } from "@/lib/contributor-id";
import { generateUUID } from "@/lib/uuid";
import { saveAndEnqueue, drainStep, cancelDrain } from "@/lib/autosave/upload-queue";
import { decodeBlob, computeQualityMetrics } from "@/lib/quality-metrics";
import type { ClipRecord } from "@/lib/autosave/store";
import type { RecordingStep } from "@/lib/steps";
import { SuccessOverlay } from "@/components/state/SuccessOverlay";
import { StepIndicator } from "./StepIndicator";
import { RecitationStep } from "./RecitationStep";

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


interface StepMeta {
  title: string;
  description: string;
}

const STEPS: Record<1 | 2, StepMeta> = {
  1: {
    title: "Panch-tattva",
    description: "Recite the Panch-tattva mantra at a clear, measured pace.",
  },
  2: {
    title: "Maha-mantra",
    description: "Chant one round of the Hare Krishna Maha-mantra.",
  },
};

export function ContributionFlow() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [contributorId] = useState(() => getContributorId());
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [identityMode, setIdentityMode] = useState<"anonymous" | "named">("named");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof localStorage === "undefined") return generateUUID();
    const stored = localStorage.getItem("kws_session_id");
    if (stored) return stored;
    const id = generateUUID();
    localStorage.setItem("kws_session_id", id);
    return id;
  });

  const handleClipReady: OnClipReady = (clipId, blob, mimeType, meta) => {
    void (async () => {
      let metrics = null;
      try {
        const buffer = await decodeBlob(blob);
        if (buffer) metrics = computeQualityMetrics(buffer);
      } catch { /* quality metrics are optional — proceed without them */ }

      const record: ClipRecord = {
        clipId,
        sessionId,
        contributorId,
        step: meta.step,
        label: meta.label,
        blob,
        mimeType,
        durationMs: meta.durationMs,
        fileSizeBytes: blob.size,
        peakDbfs: metrics?.peakDbfs,
        rmsDbfs: metrics?.rmsDbfs,
        clipping: metrics?.clipping,
        silenceRatio: metrics?.silenceRatio,
        snrEstimate: metrics?.snrEstimate,
        lowQuality: metrics?.lowQuality,
        name: name || undefined,
        email: email || undefined,
        status: "queued",
        createdAt: Date.now(),
      };
      void saveAndEnqueue(record);
    })();
  };

  const advance = (completed: boolean) => {
    if (completed) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
    }
    if (currentStep === 2) {
      setIsComplete(true);
      return;
    }
    setCurrentStep((prev) => (prev + 1) as 1 | 2);
  };

  const handleSaveAndContinue = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      // Persist name/email whenever the beta fields are filled, regardless of
      // whether any clips were recorded in this step.
      if (name || email) {
        void fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, contributorId, name, email }),
        });
      }

      // Race drain against a 6s timeout so hung uploads never block the UI.
      let drained = false;
      await Promise.race([
        drainStep(currentStep).then(() => { drained = true; }),
        new Promise<void>((resolve) => setTimeout(resolve, 6000)),
      ]);
      if (!drained) cancelDrain(currentStep);

      // Step 2 completion: fire-and-forget summary row to Google Sheets.
      if (currentStep === 2) {
        void fetch("/api/sheets/kws", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contributorId,
            sessionId,
            name,
            email,
            timestamp: new Date().toISOString(),
          }),
        });
      }
      advance(true);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    advance(false);
  };

  if (isComplete) {
    return (
      <SuccessOverlay
        onDismiss={() => {
          setIsComplete(false);
          setCurrentStep(1);
          setCompletedSteps(new Set());
          setIdentityMode("anonymous");
          setName("");
          setEmail("");
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem("kws_session_id");
          }
          const newId = generateUUID();
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("kws_session_id", newId);
          }
          setSessionId(newId);
        }}
      />
    );
  }

  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-6">
      {/* Identity selection */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        {identityMode === "named" ? (
          <div className="flex flex-col gap-3">
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-body-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or spiritual name"
            />
            <input
              type="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-body text-body-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com (for beta invite)"
            />
            <button
              type="button"
              onClick={() => { setIdentityMode("anonymous"); setName(""); setEmail(""); }}
              className="self-start cursor-pointer font-body text-body-sm font-medium text-primary-dark underline underline-offset-2 hover:opacity-75"
            >
              Stay anonymous instead
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIdentityMode("anonymous")}
              className="flex-1 rounded-lg border-2 border-primary bg-primary-light py-2 font-body text-body-sm font-semibold text-primary-dark transition-colors"
            >
              Stay Anonymous
            </button>
            <button
              type="button"
              onClick={() => setIdentityMode("named")}
              className="flex-1 rounded-lg border-2 border-border bg-background py-2 font-body text-body-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary-dark"
            >
              📲 Get Beta Access
            </button>
          </div>
        )}
      </div>

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-md">
        <div className="flex flex-col gap-1">
          <p className="font-body text-caption uppercase tracking-wider text-muted">
            Step {currentStep} of 2
          </p>
          <h2 className="font-heading text-h2 text-heading">{step.title}</h2>
          <p className="font-body text-body text-muted">{step.description}</p>
        </div>

        {/* Step content */}
        <RecitationStep
          key={currentStep}
          step={currentStep}
          onClipReady={handleClipReady}
          onRecordingChange={setIsRecording}
        />

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSaveAndContinue()}
            disabled={isSaving || isRecording}
            className="btn-primary w-full max-w-xs gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? "Saving…"
              : currentStep === 2
              ? "Save & Finish"
              : "Save & Continue"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isRecording}
            className="font-body text-body-sm text-muted underline-offset-2 transition-colors hover:text-primary-dark hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}
