import "server-only";

import { getSupabaseClient } from "@/lib/supabase";
import { createPresignedGetUrl } from "@/lib/s3";
import { KEYWORDS } from "@/lib/keywords";

const CONFIDENCE_THRESHOLD = 0.5;
const ASR_GET_EXPIRY_SECONDS = 60;

function normalizeText(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function acceptedFormsFor(label: string): string[] {
  const kw = KEYWORDS.find((k) => k.label === label);
  if (kw) {
    return [normalizeText(kw.devanagari), normalizeText(kw.transliteration)];
  }
  return [label.toLowerCase().replace(/_/g, " ").trim()];
}

function transcriptMatchesLabel(transcript: string, label: string): boolean {
  return acceptedFormsFor(label).some((form) => form === normalizeText(transcript));
}

/**
 * Server-side ASR confirmation for Step 1 clips.
 *
 * Looks up the s3_key from the database using clipId — never trusts a
 * client-supplied key (prevents arbitrary S3 object exfiltration).
 * Silently no-ops when TRANSCRIPTION_SERVICE_URL is unset or any step fails;
 * the clip stays at asr_status='pending' in that case.
 */
export async function runConfirmForClip(clipId: string, label: string): Promise<void> {
  const serviceUrl = process.env.TRANSCRIPTION_SERVICE_URL;
  if (!serviceUrl) return;

  try {
    const supabase = getSupabaseClient();

    const { data } = await supabase
      .from("recordings")
      .select("s3_key")
      .eq("clip_id", clipId)
      .single();

    const s3Key = (data as { s3_key: string } | null)?.s3_key;
    if (!s3Key) return;

    const getUrl = await createPresignedGetUrl(s3Key, ASR_GET_EXPIRY_SECONDS);
    const audioRes = await fetch(getUrl, { signal: AbortSignal.timeout(30_000) });
    if (!audioRes.ok) return;

    const audiob64 = Buffer.from(await audioRes.arrayBuffer()).toString("base64");
    const asrRes = await fetch(`${serviceUrl}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_b64: audiob64, sample_rate: 16000 }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!asrRes.ok) return;

    const { transcript, confidence } = (await asrRes.json()) as {
      transcript: string;
      confidence: number;
    };
    const matched = transcriptMatchesLabel(transcript, label);
    const asrStatus = confidence >= CONFIDENCE_THRESHOLD && matched ? "confirmed" : "uncertain";

    await supabase
      .from("recordings")
      .update({ asr_status: asrStatus, asr_confidence: confidence })
      .eq("clip_id", clipId);
  } catch {
    // Any failure leaves asr_status as 'pending'. Never propagate to the caller.
  }
}
