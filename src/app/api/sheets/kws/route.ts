import { NextResponse } from "next/server";
import { google } from "googleapis";
import { buildEnv } from "@/lib/build-env";

/** KWS contribution summary sheet write — fire-and-forget from the client. */
export const runtime = "nodejs";

interface KwsSheetPayload {
  contributorId: string;
  sessionId: string;
  completedSteps: number[];
  timestamp: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const payload: KwsSheetPayload = {
    contributorId: typeof raw.contributorId === "string" ? raw.contributorId : "",
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId : "",
    completedSteps: Array.isArray(raw.completedSteps)
      ? (raw.completedSteps as unknown[]).filter((s): s is number => typeof s === "number")
      : [],
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
  };

  try {
    await appendKwsRow(payload);
  } catch (err) {
    // Log server-side but never surface to client — this is fire-and-forget.
    if (process.env.NODE_ENV !== "test") {
      process.stderr.write(
        `[sheets/kws] Failed to write row: ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function appendKwsRow(payload: KwsSheetPayload): Promise<void> {
  const email =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || buildEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    buildEnv.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEETS_ID || buildEnv.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !sheetId) {
    // Sheets not configured — skip silently.
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "KWS!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        payload.timestamp,
        payload.contributorId,
        payload.sessionId,
        payload.completedSteps.join(","),
      ]],
    },
  });
}
