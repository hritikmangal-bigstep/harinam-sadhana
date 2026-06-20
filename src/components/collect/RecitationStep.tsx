"use client";

import { useCallback, useState } from "react";
import { AudioRecorder, type RecordingValue } from "@/components/recorder/AudioRecorder";
import { STEP_TO_RECORDING_STEP } from "@/lib/steps";
import { generateUUID } from "@/lib/uuid";
import type { ClipMeta } from "./ContributionFlow";

export interface RecitationStepProps {
  step: 2 | 3 | 4;
  onClipReady: (clipId: string, blob: Blob, mimeType: string, meta: ClipMeta) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

interface MantraBlock {
  /** Exactly two Devanagari lines (first half / second half). */
  deva: [string, string];
  /** Exactly two transliteration lines. */
  translit: [string, string];
}

interface StepContent {
  heading: string;
  blocks: MantraBlock[];
}

const PANCH_TATTVA_BLOCK: MantraBlock = {
  deva: [
    "जय श्री कृष्ण चैतन्य प्रभु नित्यानन्द",
    "श्री अद्वैत गदाधर श्रीवासादि गौर भक्त वृन्द",
  ],
  translit: [
    "Jaya Śrī Kṛṣṇa Caitanya Prabhu Nityānanda",
    "Śrī Advaita Gadādhara Śrīvāsādi Gaura Bhakta Vṛnda",
  ],
};

const MAHA_MANTRA_BLOCK: MantraBlock = {
  deva: [
    "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे",
    "हरे राम हरे राम राम राम हरे हरे",
  ],
  translit: [
    "Hare Kṛṣṇa Hare Kṛṣṇa Kṛṣṇa Kṛṣṇa Hare Hare",
    "Hare Rāma Hare Rāma Rāma Rāma Hare Hare",
  ],
};

const STEP_CONTENT: Record<2 | 3 | 4, StepContent> = {
  2: {
    heading: "Panch-tattva invocation",
    blocks: [PANCH_TATTVA_BLOCK],
  },
  3: {
    heading: "Hare Krishna Maha-mantra",
    blocks: [MAHA_MANTRA_BLOCK],
  },
  4: {
    heading: "Full round (Panch-tattva + Maha-mantra)",
    blocks: [PANCH_TATTVA_BLOCK, MAHA_MANTRA_BLOCK],
  },
};

export function RecitationStep({ step, onClipReady, onRecordingChange }: RecitationStepProps) {
  const [pending, setPending] = useState<{ value: RecordingValue; clipId: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [recorderKey, setRecorderKey] = useState(0);

  const handleChange = useCallback((value: RecordingValue | null) => {
    if (!value) { setPending(null); setAccepted(false); return; }
    setPending({ value, clipId: generateUUID() });
    setAccepted(false);
  }, []);

  const handleAccept = useCallback(() => {
    if (!pending || accepted) return;
    const meta: ClipMeta = {
      step: STEP_TO_RECORDING_STEP[step],
      durationMs: pending.value.seconds * 1000,
    };
    onClipReady(pending.clipId, pending.value.blob, pending.value.mimeType, meta);
    setAccepted(true);
  }, [pending, accepted, step, onClipReady]);

  const handleReRecord = useCallback(() => {
    setPending(null);
    setAccepted(false);
    setRecorderKey((k) => k + 1);
  }, []);

  const content = STEP_CONTENT[step];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mantra card */}
      <div className="card flex w-full max-w-sm flex-col gap-4 overflow-hidden text-center">
        <p className="text-caption uppercase tracking-widest text-muted">
          {content.heading}
        </p>

        {content.blocks.map((block, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {/* Devanagari — 2 lines */}
            <div
              className="flex flex-col gap-0.5 leading-snug text-[var(--color-heading)]"
              style={{ fontFamily: "var(--font-mantra)", fontSize: "1.05rem" }}
            >
              <span>{block.deva[0]}</span>
              <span>{block.deva[1]}</span>
            </div>

            {/* Transliteration — 2 lines, each forced to single line */}
            <div className="flex flex-col gap-0 font-body italic text-muted" style={{ fontSize: "0.65rem" }}>
              <span className="whitespace-nowrap">{block.translit[0]}</span>
              <span className="whitespace-nowrap">{block.translit[1]}</span>
            </div>

            {/* Divider between blocks (step 4 only) */}
            {i < content.blocks.length - 1 && (
              <hr className="mt-1 border-border" />
            )}
          </div>
        ))}
      </div>

      {/* Recorder */}
      <AudioRecorder key={recorderKey} onChange={handleChange} onRecordingStateChange={onRecordingChange} hideReRecord />

      {pending && !accepted && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="btn-primary h-10 px-5 text-body-sm"
          >
            ✓ Accept
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
      {accepted && (
        <div className="flex items-center gap-3">
          <span className="font-body text-body-sm font-semibold text-green-600">✓ Accepted</span>
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
