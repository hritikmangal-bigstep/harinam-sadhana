import { NextResponse } from "next/server";
import { appendSubmissionRow } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { timestamp, name, email, notes, durationSeconds, audioS3Path } =
    (body ?? {}) as Record<string, unknown>;

  try {
    await appendSubmissionRow({
      timestamp: String(timestamp ?? ""),
      name: String(name ?? "Anonymous"),
      email: String(email ?? ""),
      notes: String(notes ?? ""),
      durationSeconds: Number(durationSeconds ?? 0),
      audioS3Path: String(audioS3Path ?? ""),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
