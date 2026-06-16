import { NextResponse } from "next/server";
import { createPresignedUploadUrls, isAcceptedAudioType } from "@/lib/s3";
import type { PresignResponse } from "@/types";

/** Presigned URLs must be generated server-side — AWS keys never reach the client. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, contentType } = (body ?? {}) as Record<string, unknown>;

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
