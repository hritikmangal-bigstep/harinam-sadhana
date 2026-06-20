/** Shared domain types for Harinam Sadhana. */

import type { RecordingStep } from "@/lib/steps";

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

/** Body sent to POST /api/upload for a KWS clip. */
export interface KwsPresignRequest {
  step: RecordingStep;
  contentType: AudioMimeType;
  contributorId: string;
  /** Client-generated UUID identifying this specific clip. */
  clipId: string;
  /** Required for isolated_keyword; absent for recitation steps. */
  label?: string;
}

/** Response from POST /api/upload for a KWS clip. */
export interface KwsPresignResponse {
  /** Presigned PUT URL — upload the audio blob here. */
  audioUrl: string;
  /** Final S3 key of the audio object. */
  audioKey: string;
  /** Permanent HTTPS URL for the audio object. */
  audioStorageUrl: string;
}

/** Body for POST /api/recordings — one clip's metadata. */
export interface RecordingPayload {
  // Identification
  clipId: string;
  sessionId: string;
  contributorId: string;

  // Recording
  step: RecordingStep;
  label?: string;
  s3Key: string;
  mimeType: string;

  // Technical metadata (optional — computed by client)
  durationMs?: number;
  sampleRate?: number;
  fileSizeBytes?: number;

  // Quality metrics (optional — added by U8)
  peakDbfs?: number;
  rmsDbfs?: number;
  clipping?: boolean;
  silenceRatio?: number;
  snrEstimate?: number;
  lowQuality?: boolean;

  session?: {
    environment?: string;
    chantingSpeed?: string;
    name?: string;
    email?: string;
  };
}
