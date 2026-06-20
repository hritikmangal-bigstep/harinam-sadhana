"use client";

import { useState } from "react";
import type { DevoteeSubmission } from "@/types";
import { AudioRecorder, type RecordingValue } from "@/components/recorder/AudioRecorder";
import { SuccessOverlay } from "@/components/state/SuccessOverlay";
import { Field, inputClass } from "./Field";
import { submissionSchema } from "./submission-schema";
import { offerSession } from "./submit-offering";

type IdentityMode = "anonymous" | "named";

type Values = {
  name: string;
  email: string;
  notes: string;
};

export function SubmissionForm() {
  const [identityMode, setIdentityMode] = useState<IdentityMode>("anonymous");
  const [values, setValues] = useState<Values>({ name: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState<RecordingValue | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isActivelyRecording, setIsActivelyRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [offered, setOffered] = useState(false);
  const [recorderKey, setRecorderKey] = useState(0);

  const set = (key: keyof Values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const valuesToValidate =
      identityMode === "anonymous" ? { ...values, name: "", email: "" } : values;

    const parsed = submissionSchema.safeParse(valuesToValidate);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key])
          nextErrors[key] = issue.message;
      }
    }
    setErrors(nextErrors);

    if (!recording) {
      setRecordingError("Please record your chanting before submitting.");
    } else {
      setRecordingError(null);
    }

    if (!parsed.success || !recording) return;

    const submission: DevoteeSubmission = {
      name: parsed.data.name || undefined,
      email: parsed.data.email || undefined,
      notes: parsed.data.notes || undefined,
      durationSeconds: recording.seconds,
    };

    setIsUploading(true);
    setProgress(0);
    try {
      await offerSession({
        submission,
        audio: recording.blob,
        mimeType: recording.mimeType,
        onProgress: setProgress,
      });
      setOffered(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Your submission could not be sent.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">

        {/* Beta access — inline expand */}
        {identityMode === "named" ? (
          <div className="flex flex-col gap-4">
            <Field id="name" label="Name" error={errors.name}>
              <input
                id="name"
                className={inputClass}
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your name or spiritual name"
                aria-invalid={Boolean(errors.name)}
              />
            </Field>
            <Field id="email" label="Email (optional — for beta invite)" error={errors.email}>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="your@email.com"
                aria-invalid={Boolean(errors.email)}
              />
            </Field>
            <button
              type="button"
              onClick={() => { setIdentityMode("anonymous"); set("name", ""); set("email", ""); }}
              className="self-start font-body text-caption text-muted underline-offset-2 hover:underline"
            >
              Stay anonymous instead
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIdentityMode("named")}
            className="self-start font-body text-body-sm font-medium text-primary-dark underline-offset-2 hover:underline"
          >
            📲 Get Beta Access
          </button>
        )}

        {/* Audio Recording */}
        <fieldset className="flex flex-col items-center gap-3 rounded-md bg-surface-alt/60 py-5">
          <legend className="mb-1 px-2 text-center font-heading text-h3 text-heading">
            Your Chanting
          </legend>

          {/* Mic notice */}
          <div className="flex w-full items-start gap-3 rounded-xl border border-secondary bg-secondary-light px-3 py-2 text-left font-body text-body-sm leading-snug text-muted">
            <span className="mt-0.5 shrink-0 text-base">📱</span>
            <p>
              <strong className="text-heading">Keep your phone close to your mouth</strong>{" "}
              while chanting. We need a very clear voice for accurate AI training.
            </p>
          </div>

          <AudioRecorder
            key={recorderKey}
            onChange={(v) => {
              setRecording(v);
              if (v) setRecordingError(null);
            }}
            onRecordingStateChange={setIsActivelyRecording}
            isUploading={isUploading}
            uploadProgress={progress}
          />
          {recordingError && (
            <p role="alert" className="text-caption text-error">
              {recordingError}
            </p>
          )}
        </fieldset>

        {/* Notes */}
        <Field id="notes" label="Remarks">
          <textarea
            id="notes"
            rows={3}
            className={`${inputClass} h-auto resize-y py-3`}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="(Optional) — number of rounds, recitations, or any feedback"
          />
        </Field>

        {submitError && (
          <p role="alert" className="text-body-sm text-error">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isUploading || isActivelyRecording}
          className="btn-primary gap-2 self-center"
        >
          🙏 {isUploading ? "Sending…" : "Submit My Japa"}
        </button>

        <p className="text-center font-body text-caption text-muted -mt-4">
          Used only for AI training · Never shared publicly · Full anonymity respected
        </p>
      </form>

      {offered && (
        <SuccessOverlay
          onDismiss={() => {
            setOffered(false);
            setRecording(null);
            setValues({ name: "", email: "", notes: "" });
            setErrors({});
            setRecordingError(null);
            setSubmitError(null);
            setRecorderKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
