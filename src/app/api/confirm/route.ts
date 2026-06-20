export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { createPresignedGetUrl } from "@/lib/s3";
import { KEYWORDS } from "@/lib/keywords";

/** Confidence threshold below which ASR result is always 'uncertain'. */
const CONFIDENCE_THRESHOLD = 0.5;

/** Presigned GET URL expiry for the transient ASR fetch (60 seconds is plenty). */
const ASR_GET_EXPIRY_SECONDS = 60;

interface ConfirmBody {
  clipId: string;
  label: string;
  s3Key: string;
}

function isValidBody(body: unknown): body is ConfirmBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b["clipId"] === "string" && b["clipId"].trim().length > 0 &&
    typeof b["label"] === "string" && b["label"].trim().length > 0 &&
    typeof b["s3Key"] === "string" && b["s3Key"].trim().length > 0
  );
}

/**
 * Returns all accepted transcript strings for a given label.
 * Includes the devanagari form and the transliteration (both lowercased).
 * Falls back to the label itself (with underscores replaced by spaces).
 */
function acceptedFormsFor(label: string): string[] {
  const kw = KEYWORDS.find((k) => k.label === label);
  if (kw) {
    return [
      kw.devanagari.toLowerCase().trim(),
      kw.transliteration.toLowerCase().trim(),
    ];
  }
  // Fallback: replace underscore separators with spaces
  return [label.toLowerCase().replace(/_/g, " ").trim()];
}

function transcriptMatchesLabel(transcript: string, label: string): boolean {
  const normalised = transcript.toLowerCase().trim();
  return acceptedFormsFor(label).some((form) => form === normalised);
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({}, { status: 200 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({}, { status: 200 });
  }

  const { clipId, label, s3Key } = body;

  const serviceUrl = process.env.TRANSCRIPTION_SERVICE_URL;
  if (!serviceUrl) {
    // Service not configured — leave asr_status as default 'pending', don't update.
    return NextResponse.json({}, { status: 200 });
  }

  try {
    // 1. Fetch the audio from S3 via a short-lived presigned GET URL.
    const getUrl = await createPresignedGetUrl(s3Key, ASR_GET_EXPIRY_SECONDS);
    const audioResponse = await fetch(getUrl, { signal: AbortSignal.timeout(30_000) });
    if (!audioResponse.ok) {
      return NextResponse.json({}, { status: 200 });
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audiob64 = Buffer.from(audioBuffer).toString("base64");

    // 2. POST to the transcription service.
    const asrResponse = await fetch(`${serviceUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_b64: audiob64, sample_rate: 16000 }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!asrResponse.ok) {
      return NextResponse.json({}, { status: 200 });
    }

    const asrJson = (await asrResponse.json()) as {
      transcript: string;
      confidence: number;
    };

    const { transcript, confidence } = asrJson;

    // 3. Determine status — transcript is used only here, never stored.
    const matched = transcriptMatchesLabel(transcript, label);
    const asrStatus =
      confidence >= CONFIDENCE_THRESHOLD && matched ? "confirmed" : "uncertain";

    // 4. Backfill asr_status and asr_confidence — no transcript column.
    const supabase = getSupabaseClient();
    await supabase
      .from("recordings")
      .update({ asr_status: asrStatus, asr_confidence: confidence })
      .eq("clip_id", clipId);
  } catch {
    // Any failure (S3 unreachable, ASR unreachable, Supabase error) —
    // leave asr_status as 'pending'. Never propagate errors to the client.
  }

  return NextResponse.json({}, { status: 200 });
}
