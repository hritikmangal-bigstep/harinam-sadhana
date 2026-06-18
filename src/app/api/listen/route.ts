import { NextResponse } from "next/server";
import { createPresignedGetUrl } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || (!key.startsWith("submissions/") && !key.startsWith("kws-collection/"))) {
    return NextResponse.json({ error: "Invalid key." }, { status: 400 });
  }

  try {
    const url = await createPresignedGetUrl(key);
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not generate audio link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
