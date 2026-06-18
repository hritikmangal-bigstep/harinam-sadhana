/** Recording step definitions for KWS labelled audio data collection. */

export const RECORDING_STEPS = [
  "isolated_keyword",
  "panch_tattva_recitation",
  "mahamantra_round",
  "panch_tattva_mahamantra_round",
] as const;

export type RecordingStep = (typeof RECORDING_STEPS)[number];

/** S3 path prefix for each recitation step. */
export const RECITATION_STEP_PREFIXES: Record<string, string> = {
  panch_tattva_recitation: "panch-tattva",
  mahamantra_round: "mahamantra",
  panch_tattva_mahamantra_round: "panch-tattva-mahamantra",
};

export function isRecordingStep(value: string): value is RecordingStep {
  return (RECORDING_STEPS as readonly string[]).includes(value);
}

export function isRecitationStep(step: RecordingStep): boolean {
  return step !== "isolated_keyword";
}
