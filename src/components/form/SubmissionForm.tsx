"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { DevoteeSubmission } from "@/types";
import { AudioRecorder, type RecordingValue } from "@/components/recorder/AudioRecorder";
import { SuccessOverlay } from "@/components/state/SuccessOverlay";
import { Field, inputClass } from "./Field";
import { submissionSchema } from "./submission-schema";
import { offerSession } from "./submit-offering";

type Values = {
  name: string;
  email: string;
  notes: string;
};

export function SubmissionForm() {
  const [values, setValues] = useState<Values>({ name: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState<RecordingValue | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [offered, setOffered] = useState(false);

  const set = (key: keyof Values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = submissionSchema.safeParse(values);
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
      setRecordingError("Please record your chanting before offering.");
    } else {
      setRecordingError(null);
    }

    if (!parsed.success || !recording) return;

    const submission: DevoteeSubmission = {
      name: parsed.data.name,
      email: parsed.data.email,
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
        err instanceof Error ? err.message : "Your offering could not be sent.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        {/* Name & Email */}
        <fieldset className="flex flex-col gap-6">
          <legend className="mb-2 font-heading text-h3 text-heading">
            Your Details
          </legend>

          <Field id="name" label="Name" required error={errors.name}>
            <input
              id="name"
              className={inputClass}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <div className="flex flex-col gap-1">
            <Field id="email" label="Email" required error={errors.email}>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : "email-disclaimer"}
              />
            </Field>
            <p id="email-disclaimer" className="text-caption text-muted">
              Your details will not be used for marketing purposes.
            </p>
          </div>
        </fieldset>

        {/* Audio Recording */}
        <fieldset className="flex flex-col items-center gap-3 rounded-md bg-surface-alt/60 py-5">
          <legend className="mb-2 px-2 text-center font-heading text-h3 text-heading">
            Your Chanting
          </legend>
          <AudioRecorder
            onChange={(v) => {
              setRecording(v);
              if (v) setRecordingError(null);
            }}
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
            rows={4}
            className={`${inputClass} h-auto resize-y py-3`}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="(Optional) — number of rounds you chanted, number of recitations, or any other feedback"
          />
        </Field>

        {submitError && (
          <p role="alert" className="text-body-sm text-error">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="btn-primary gap-2 self-center"
        >
          <Sparkles size={18} aria-hidden="true" />
          {isUploading ? "Offering your session…" : "Offer My Session"}
        </button>
      </form>

      {offered && (
        <SuccessOverlay
          onDismiss={() => {
            setOffered(false);
            setRecording(null);
            setValues({ name: "", email: "", notes: "" });
          }}
        />
      )}
    </>
  );
}
