/** Shared domain types for Harinam Sadhana. */

/** Audio formats we accept — webm/opus primary, mp4 cross-browser fallback. */
export type AudioMimeType = "audio/webm" | "audio/mp4";

/** A single devotee's chanting-session offering. */
export interface DevoteeSubmission {
  name?: string;
  email?: string;
  notes?: string;
  /** Recording length in seconds (informational; stored with metadata). */
  durationSeconds?: number;
}

/** Body sent to POST /api/upload to obtain presigned URLs. */
export interface PresignRequest {
  name: string;
  contentType: AudioMimeType;
}

/** Response from POST /api/upload. */
export interface PresignResponse {
  /** PUT the audio blob here. */
  audioUrl: string;
  /** PUT the submission metadata JSON here. */
  metadataUrl: string;
  /** Final S3 key of the audio object (for reference/logging). */
  audioKey: string;
  /** Permanent S3 HTTPS URL for the audio object (used for Sheets hyperlink). */
  audioStorageUrl: string;
  /** Server-generated ISO 8601 timestamp of when the offering was received. */
  offeredAt: string;
}

/** The record persisted to S3 alongside the audio (metadata JSON sidecar). */
export interface StoredOffering extends DevoteeSubmission {
  /** Server-generated ISO 8601 date-time stamp, stored automatically. */
  offeredAt: string;
}

export interface PresignError {
  error: string;
}
