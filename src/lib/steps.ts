/** Step type definitions for the KWS labelled data collection flow. */

/** The four recording steps in the contribution flow. */
export type RecordingStep =
  | "isolated_keyword"
  | "panch_tattva_recitation"
  | "mahamantra_round"
  | "panch_tattva_mahamantra_round";

/** Numeric step index (1–4) mapped to its RecordingStep value. */
export const STEP_TO_RECORDING_STEP: Record<1 | 2 | 3 | 4, RecordingStep> = {
  1: "isolated_keyword",
  2: "panch_tattva_recitation",
  3: "mahamantra_round",
  4: "panch_tattva_mahamantra_round",
};

/** Reverse map: RecordingStep → numeric step index. */
export const RECORDING_STEP_TO_NUMBER: Record<RecordingStep, 1 | 2 | 3 | 4> = {
  isolated_keyword: 1,
  panch_tattva_recitation: 2,
  mahamantra_round: 3,
  panch_tattva_mahamantra_round: 4,
};
