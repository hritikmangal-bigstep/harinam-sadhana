/** Recording step definitions for KWS labelled audio data collection. */

export const RECORDING_STEPS = [
  "panch_tattva_recitation",
  "mahamantra_round",
] as const;

export type RecordingStep = (typeof RECORDING_STEPS)[number];

/** S3 path prefix for each recitation step. */
export const RECITATION_STEP_PREFIXES: Record<RecordingStep, string> = {
  panch_tattva_recitation: "panch-tattva",
  mahamantra_round: "mahamantra",
};

/** Numeric step index (1–2) → RecordingStep value. */
export const STEP_TO_RECORDING_STEP: Record<1 | 2, RecordingStep> = {
  1: "panch_tattva_recitation",
  2: "mahamantra_round",
};

/** RecordingStep value → numeric step index. */
export const RECORDING_STEP_TO_NUMBER: Record<RecordingStep, 1 | 2> = {
  panch_tattva_recitation: 1,
  mahamantra_round: 2,
};

export function isRecordingStep(value: string): value is RecordingStep {
  return (RECORDING_STEPS as readonly string[]).includes(value);
}
