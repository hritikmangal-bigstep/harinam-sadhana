export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { buildEnv } from "@/lib/build-env";
import { getSupabaseClient } from "@/lib/supabase";
import { createPresignedGetUrl } from "@/lib/s3";

const LINK_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7-day links
const SHEETS_TIMEOUT_MS = 15_000;

interface KwsSheetPayload {
  contributorId: string;
  sessionId: string;
  name: string;
  email: string;
  timestamp: string;
}

interface SessionPart {
  keyword_s3_keys: string[] | null;
  keyword_labels: string[] | null;
  part2_s3_key: string | null;
  part3_s3_key: string | null;
  part4_s3_key: string | null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const payload: KwsSheetPayload = {
    contributorId: typeof raw.contributorId === "string" ? raw.contributorId : "",
    sessionId:     typeof raw.sessionId     === "string" ? raw.sessionId     : "",
    name:          typeof raw.name          === "string" ? raw.name          : "",
    email:         typeof raw.email         === "string" ? raw.email         : "",
    timestamp:     typeof raw.timestamp     === "string" ? raw.timestamp     : new Date().toISOString(),
  };

  void runAsync(payload);
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function runAsync(payload: KwsSheetPayload): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Persist name/email to collection_sessions
    if (payload.name || payload.email) {
      await supabase.from("collection_sessions").upsert(
        {
          id: payload.sessionId,
          contributor_id: payload.contributorId,
          name: payload.name || null,
          email: payload.email || null,
        },
        { onConflict: "id" },
      );
    }

    // Fetch all S3 keys for this session
    const { data } = await supabase
      .from("kws_session_parts")
      .select("keyword_s3_keys,keyword_labels,part2_s3_key,part3_s3_key,part4_s3_key")
      .eq("session_id", payload.sessionId)
      .single();

    const rec = (data ?? {}) as SessionPart;

    // Generate 7-day presigned GET URLs; any individual failure yields "" rather
    // than aborting the entire Sheets row (Promise.allSettled instead of Promise.all).
    const keywordLinks = (await Promise.allSettled(
      (rec.keyword_s3_keys ?? []).map((key, i) =>
        createPresignedGetUrl(key, LINK_EXPIRY_SECONDS).then(
          (url) => `${rec.keyword_labels?.[i] ?? "kw"}: ${url}`,
        ),
      ),
    )).map((r) => r.status === "fulfilled" ? r.value : "");

    const [part2r, part3r, part4r] = await Promise.allSettled([
      rec.part2_s3_key ? createPresignedGetUrl(rec.part2_s3_key, LINK_EXPIRY_SECONDS) : Promise.resolve(""),
      rec.part3_s3_key ? createPresignedGetUrl(rec.part3_s3_key, LINK_EXPIRY_SECONDS) : Promise.resolve(""),
      rec.part4_s3_key ? createPresignedGetUrl(rec.part4_s3_key, LINK_EXPIRY_SECONDS) : Promise.resolve(""),
    ]);
    const part2 = part2r.status === "fulfilled" ? part2r.value : "";
    const part3 = part3r.status === "fulfilled" ? part3r.value : "";
    const part4 = part4r.status === "fulfilled" ? part4r.value : "";

    // Re-serialize timestamp server-side to prevent formula injection.
    const ts = new Date(payload.timestamp);
    const safeTimestamp = Number.isFinite(ts.getTime()) ? ts.toISOString() : new Date().toISOString();

    await appendSheetRow(
      safeTimestamp,
      payload.name || "Anonymous",
      payload.email,
      payload.sessionId.slice(0, 8),
      keywordLinks.join("\n"),
      part2,
      part3,
      part4,
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      process.stderr.write(`[sheets/kws] ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

function sanitizeCell(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

async function appendSheetRow(
  timestamp: string, name: string, email: string, sessionId: string,
  part1: string, part2: string, part3: string, part4: string,
): Promise<void> {
  const svcEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || buildEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    buildEnv.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEETS_ID || buildEnv.GOOGLE_SHEETS_ID;

  if (!svcEmail || !privateKey || !sheetId) return;

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: svcEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Race against a fixed timeout so a hung Google API call doesn't hold the
  // orphaned async task open indefinitely.
  await Promise.race([
    sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "KWS!A:H",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          sanitizeCell(timestamp),
          sanitizeCell(name),
          sanitizeCell(email),
          sanitizeCell(sessionId),
          part1,
          part2,
          part3,
          part4,
        ]],
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Sheets API timeout")), SHEETS_TIMEOUT_MS)
    ),
  ]);
}
