export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isRecordingStep } from "@/lib/steps";
import type { RecordingStep } from "@/lib/steps";

const STEP_TO_S3_COLUMN: Record<RecordingStep, "part1_s3_key" | "part2_s3_key"> = {
  panch_tattva_recitation: "part1_s3_key",
  mahamantra_round: "part2_s3_key",
};

const STEP_TO_DURATION_COLUMN: Record<RecordingStep, "part1_duration_s" | "part2_duration_s"> = {
  panch_tattva_recitation: "part1_duration_s",
  mahamantra_round: "part2_duration_s",
};

const MAX_STRING_LENGTH = 500;

function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  for (const field of ["clipId", "sessionId", "contributorId", "s3Key"] as const) {
    if (!isNonEmptyString(b[field])) {
      return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 });
    }
    if ((b[field] as string).length > MAX_STRING_LENGTH) {
      return NextResponse.json(
        { error: `Field '${field}' exceeds maximum length of ${MAX_STRING_LENGTH}` },
        { status: 400 },
      );
    }
  }

  if (!isNonEmptyString(b["step"]) || !isRecordingStep(b["step"] as string)) {
    return NextResponse.json({ error: "Field 'step' must be a valid RecordingStep" }, { status: 400 });
  }

  const step = b["step"] as RecordingStep;
  const sessionId = b["sessionId"] as string;
  const contributorId = b["contributorId"] as string;
  const s3Key = b["s3Key"] as string;
  const clipId = b["clipId"] as string;
  const session = b["session"] as { name?: string; email?: string } | undefined;

  const supabase = getSupabaseClient();

  const { error: sessionError } = await supabase
    .from("collection_sessions")
    .upsert(
      { id: sessionId, contributor_id: contributorId },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (sessionError) {
    return NextResponse.json({ error: "Failed to persist session" }, { status: 500 });
  }

  const updateData: Record<string, string | number> = { [STEP_TO_S3_COLUMN[step]]: s3Key };
  const durationMs = typeof b["durationMs"] === "number" && isFinite(b["durationMs"] as number)
    ? (b["durationMs"] as number)
    : undefined;
  if (durationMs !== undefined) updateData[STEP_TO_DURATION_COLUMN[step]] = Math.round(durationMs / 1000);
  if (session?.name) updateData.name = session.name;
  if (session?.email) updateData.email = session.email;

  const { error: updateError } = await supabase
    .from("collection_sessions")
    .update(updateData)
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to persist recording" }, { status: 500 });
  }

  return NextResponse.json({ clipId }, { status: 201 });
}
