export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const { sessionId, contributorId, name, email } = raw;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  if (typeof contributorId !== "string" || !contributorId.trim()) {
    return NextResponse.json({ error: "contributorId is required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("collection_sessions").upsert(
    {
      id: sessionId,
      contributor_id: contributorId,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      email: typeof email === "string" && email.trim() ? email.trim() : null,
    },
    { onConflict: "id" },
  );

  if (error) {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
