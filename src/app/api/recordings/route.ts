export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isRecordingStep, isRecitationStep } from "@/lib/steps";
import type { RecordingPayload } from "@/types";

const MAX_STRING_LENGTH = 500;
const ALLOWED_MIME_TYPES = ["audio/webm", "audio/mp4"] as const;

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

function isShortString(val: string): boolean {
  return val.length <= MAX_STRING_LENGTH;
}

function isFiniteNumberOrUndefined(val: unknown): val is number | undefined {
  if (val === undefined || val === null) return true;
  return typeof val === "number" && isFinite(val);
}

function parseUserAgent(ua: string): {
  deviceType: string;
  browser: string;
  os: string;
} {
  let deviceType = "desktop";
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    deviceType = "mobile";
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    deviceType = "tablet";
  }

  let browser = "unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { deviceType, browser, os };
}

type ValidationResult =
  | { payload: RecordingPayload; error: null }
  | { payload: null; error: string };

function validatePayload(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { payload: null, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  for (const field of [
    "clipId",
    "sessionId",
    "contributorId",
    "s3Key",
    "mimeType",
  ] as const) {
    if (!isNonEmptyString(b[field])) {
      return {
        payload: null,
        error: `Field '${field}' is required and must be a non-empty string`,
      };
    }
    if (!isShortString(b[field] as string)) {
      return {
        payload: null,
        error: `Field '${field}' exceeds maximum length of ${MAX_STRING_LENGTH}`,
      };
    }
  }

  if (!isNonEmptyString(b["step"])) {
    return { payload: null, error: "Field 'step' is required" };
  }
  if (!isRecordingStep(b["step"] as string)) {
    return {
      payload: null,
      error: "Field 'step' must be a valid RecordingStep",
    };
  }

  const step = b["step"] as RecordingPayload["step"];

  if (
    !(ALLOWED_MIME_TYPES as readonly string[]).includes(b["mimeType"] as string)
  ) {
    return {
      payload: null,
      error: `Field 'mimeType' must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  if (step === "isolated_keyword") {
    if (!isNonEmptyString(b["label"])) {
      return {
        payload: null,
        error: "Field 'label' is required for step 'isolated_keyword'",
      };
    }
    if (!isShortString(b["label"] as string)) {
      return {
        payload: null,
        error: `Field 'label' exceeds maximum length of ${MAX_STRING_LENGTH}`,
      };
    }
  }

  for (const field of [
    "durationMs",
    "sampleRate",
    "fileSizeBytes",
    "peakDbfs",
    "rmsDbfs",
    "silenceRatio",
    "snrEstimate",
  ] as const) {
    if (!isFiniteNumberOrUndefined(b[field])) {
      return {
        payload: null,
        error: `Field '${field}', if provided, must be a finite number`,
      };
    }
  }

  for (const field of ["clipping", "lowQuality"] as const) {
    if (
      b[field] !== undefined &&
      b[field] !== null &&
      typeof b[field] !== "boolean"
    ) {
      return {
        payload: null,
        error: `Field '${field}', if provided, must be a boolean`,
      };
    }
  }

  const payload: RecordingPayload = {
    clipId: b["clipId"] as string,
    sessionId: b["sessionId"] as string,
    contributorId: b["contributorId"] as string,
    step,
    label: step === "isolated_keyword" ? (b["label"] as string) : undefined,
    s3Key: b["s3Key"] as string,
    mimeType: b["mimeType"] as string,
    durationMs: b["durationMs"] as number | undefined,
    sampleRate: b["sampleRate"] as number | undefined,
    fileSizeBytes: b["fileSizeBytes"] as number | undefined,
    peakDbfs: b["peakDbfs"] as number | undefined,
    rmsDbfs: b["rmsDbfs"] as number | undefined,
    clipping: b["clipping"] as boolean | undefined,
    silenceRatio: b["silenceRatio"] as number | undefined,
    snrEstimate: b["snrEstimate"] as number | undefined,
    lowQuality: b["lowQuality"] as boolean | undefined,
    session: b["session"] as RecordingPayload["session"],
  };

  return { payload, error: null };
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validatePayload(body);
  if (validation.error !== null) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = validation.payload;
  const recordedAt = new Date().toISOString();

  const supabase = getSupabaseClient();

  const { error: sessionError } = await supabase
    .from("collection_sessions")
    .upsert(
      {
        id: payload.sessionId,
        contributor_id: payload.contributorId,
        environment: payload.session?.environment ?? null,
        chanting_speed: payload.session?.chantingSpeed ?? null,
      },
      { onConflict: "id" }
    );

  if (sessionError) {
    return NextResponse.json(
      { error: "Failed to persist session" },
      { status: 500 }
    );
  }

  const { data: recordingData, error: recordingError } = await supabase
    .from("recordings")
    .upsert(
      {
        clip_id: payload.clipId,
        session_id: payload.sessionId,
        contributor_id: payload.contributorId,
        step: payload.step,
        label: payload.label ?? null,
        s3_key: payload.s3Key,
        mime_type: payload.mimeType,
        duration_ms: payload.durationMs ?? null,
        sample_rate: payload.sampleRate ?? null,
        file_size_bytes: payload.fileSizeBytes ?? null,
        peak_dbfs: payload.peakDbfs ?? null,
        rms_dbfs: payload.rmsDbfs ?? null,
        clipping: payload.clipping ?? null,
        silence_ratio: payload.silenceRatio ?? null,
        snr_estimate: payload.snrEstimate ?? null,
        low_quality: payload.lowQuality ?? false,
        recorded_at: recordedAt,
      },
      { onConflict: "clip_id", ignoreDuplicates: true }
    )
    .select("id")
    .single();

  if (recordingError) {
    return NextResponse.json(
      { error: "Failed to persist recording" },
      { status: 500 }
    );
  }

  if (!isRecitationStep(payload.step)) {
    const origin = new URL(request.url).origin;
    void fetch(`${origin}/api/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId: payload.clipId,
        label: payload.label,
        s3Key: payload.s3Key,
      }),
    });
  }

  const id = (recordingData as { id: number } | null)?.id ?? 0;
  return NextResponse.json({ id, clipId: payload.clipId }, { status: 201 });
}
