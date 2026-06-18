import { NextResponse } from "next/server";
import {
  createPresignedUploadUrls,
  createKwsPresignedUploadUrl,
  isAcceptedAudioType,
} from "@/lib/s3";
import { isRecordingStep } from "@/lib/steps";
import type { KwsPresignResponse, PresignResponse } from "@/types";

/** Presigned URLs must be generated server-side — AWS keys never reach the client. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  // --- KWS path: detected by presence of a `step` field ---
  if ("step" in raw) {
    return handleKwsRequest(raw);
  }

  // --- Legacy path: { name, contentType } ---
  return handleLegacyRequest(raw);
}

async function handleKwsRequest(
  raw: Record<string, unknown>,
): Promise<NextResponse> {
  const { step, contentType, contributorId, clipId, label } = raw;

  if (typeof step !== "string" || !isRecordingStep(step)) {
    return NextResponse.json(
      { error: "Invalid step. Must be one of: isolated_keyword, panch_tattva_recitation, mahamantra_round, panch_tattva_mahamantra_round." },
      { status: 400 },
    );
  }

  if (typeof contentType !== "string" || !isAcceptedAudioType(contentType)) {
    return NextResponse.json(
      { error: "Only audio/webm or audio/mp4 recordings are accepted." },
      { status: 415 },
    );
  }

  if (typeof contributorId !== "string" || contributorId.trim().length === 0) {
    return NextResponse.json(
      { error: "contributorId is required." },
      { status: 400 },
    );
  }

  if (typeof clipId !== "string" || clipId.trim().length === 0) {
    return NextResponse.json(
      { error: "clipId is required." },
      { status: 400 },
    );
  }

  if (step === "isolated_keyword") {
    if (typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json(
        { error: "label is required for isolated_keyword step." },
        { status: 400 },
      );
    }
  }

  const resolvedLabel =
    step === "isolated_keyword" && typeof label === "string"
      ? label.trim()
      : undefined;

  try {
    const result = await createKwsPresignedUploadUrl(
      step,
      contributorId.trim(),
      clipId.trim(),
      contentType,
      resolvedLabel,
    );
    const response: KwsPresignResponse = result;
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not prepare the KWS clip upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleLegacyRequest(
  raw: Record<string, unknown>,
): Promise<NextResponse> {
  const { name, contentType } = raw;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "A name is required." }, { status: 400 });
  }

  // Reject any audio type other than webm/mp4 (CLAUDE.md hard requirement).
  if (typeof contentType !== "string" || !isAcceptedAudioType(contentType)) {
    return NextResponse.json(
      { error: "Only audio/webm or audio/mp4 recordings are accepted." },
      { status: 415 },
    );
  }

  // Date and time stamp are always derived server-side — never trusted from
  // the client. One instant drives both the S3 key and the stored metadata.
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const offeredAt = now.toISOString();

  try {
    const result = await createPresignedUploadUrls(
      name,
      date,
      contentType,
      now.getTime(),
    );
    const response: PresignResponse = { ...result, offeredAt };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not prepare the offering.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
