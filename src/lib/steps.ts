/** Recording step definitions for KWS labelled audio data collection. */

export const RECORDING_STEPS = [
  "isolated_keyword",
  "panch_tattva_recitation",
  "mahamantra_round",
  "panch_tattva_mahamantra_round",
] as const;

export type RecordingStep = (typeof RECORDING_STEPS)[number];

/** S3 path prefix for each recitation step. */
export const RECITATION_STEP_PREFIXES: Record<Exclude<RecordingStep, "isolated_keyword">, string> = {
  panch_tattva_recitation: "panch-tattva",
  mahamantra_round: "mahamantra",
  panch_tattva_mahamantra_round: "panch-tattva-mahamantra",
};

/** Numeric step index (1–4) → RecordingStep value. */
export const STEP_TO_RECORDING_STEP: Record<1 | 2 | 3 | 4, RecordingStep> = {
  1: "isolated_keyword",
  2: "panch_tattva_recitation",
  3: "mahamantra_round",
  4: "panch_tattva_mahamantra_round",
};

/** RecordingStep value → numeric step index. */
export const RECORDING_STEP_TO_NUMBER: Record<RecordingStep, 1 | 2 | 3 | 4> = {
  isolated_keyword: 1,
  panch_tattva_recitation: 2,
  mahamantra_round: 3,
  panch_tattva_mahamantra_round: 4,
};

export function isRecordingStep(value: string): value is RecordingStep {
  return (RECORDING_STEPS as readonly string[]).includes(value);
}

export function isRecitationStep(step: RecordingStep): boolean {
  return step !== "isolated_keyword";
}
