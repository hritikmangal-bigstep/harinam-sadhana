export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { runConfirmForClip } from "@/lib/asr-confirm";

interface ConfirmBody {
  clipId: string;
  label: string;
}

function isValidBody(body: unknown): body is ConfirmBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b["clipId"] === "string" && b["clipId"].trim().length > 0 &&
    typeof b["label"] === "string" && b["label"].trim().length > 0
  );
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

  await runConfirmForClip(body.clipId, body.label);
  return NextResponse.json({}, { status: 200 });
}
