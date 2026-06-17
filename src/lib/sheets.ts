import { google } from "googleapis";
import { buildEnv } from "./build-env";

export interface SheetRow {
  timestamp: string;
  name: string;
  email: string;
  notes: string;
  durationSeconds: number;
  audioS3Path: string;
}

export async function appendSubmissionRow(row: SheetRow): Promise<void> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || buildEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || buildEnv.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEETS_ID || buildEnv.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !sheetId) {
    // Sheets not configured — skip silently in dev, warn in prod.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Google Sheets env vars are not configured.");
    }
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        row.timestamp,
        row.name,
        row.email,
        row.audioS3Path,
        row.durationSeconds,
        row.notes,
      ]],
    },
  });
}
