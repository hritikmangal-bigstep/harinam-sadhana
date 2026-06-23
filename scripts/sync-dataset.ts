// Downloads new KWS clips from S3 since the last run (incremental).
// Usage:
//   npx ts-node scripts/sync-dataset.ts [--output ./dataset] [--clean-only] [--concurrency 5]
//
// Cron (every hour):
//   0 * * * * cd /path/to/project && bash scripts/run-sync.sh >> /var/log/kws-sync.log 2>&1
//
// State is kept in <output>/.sync-state.json — delete it to do a full re-sync.

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import {
  appendFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, extname, join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { buildEnv } from "../src/lib/build-env";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SyncState {
  last_synced_at: string;
}

interface RecordingRow {
  clip_id: string;
  contributor_id: string;
  session_id: string;
  step: string;
  label: string | null;
  s3_key: string;
  mime_type: string;
  duration_ms: number | null;
  file_size_bytes: number | null;
  peak_dbfs: number | null;
  rms_dbfs: number | null;
  clipping: boolean | null;
  silence_ratio: number | null;
  snr_estimate: number | null;
  low_quality: boolean;
  asr_status: string;
  asr_confidence: number | null;
  recorded_at: string;
}

// ── CLI args ───────────────────────────────────────────────────────────────────

function getArg(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= argv.length) return undefined;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
const outputDir  = getArg(argv, "--output") ?? "./dataset";
const cleanOnly  = argv.includes("--clean-only");
const concurrency = parseInt(getArg(argv, "--concurrency") ?? "5", 10);
const stateFile   = join(outputDir, ".sync-state.json");
const manifestFile = join(outputDir, "manifest.ndjson");

// ── Config ─────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || buildEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || buildEnv.SUPABASE_SERVICE_ROLE_KEY;
const s3Region    = process.env.S3_REGION    || buildEnv.S3_REGION;
const s3Bucket    = process.env.S3_BUCKET    || buildEnv.S3_BUCKET;
const s3AccessKey = process.env.S3_ACCESS_KEY_ID     || buildEnv.S3_ACCESS_KEY_ID;
const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY || buildEnv.S3_SECRET_ACCESS_KEY;

if (!supabaseUrl || !supabaseKey || !s3Region || !s3Bucket || !s3AccessKey || !s3SecretKey) {
  process.stderr.write(
    "Error: missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
    "S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.\n"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const s3 = new S3Client({
  region: s3Region,
  credentials: { accessKeyId: s3AccessKey, secretAccessKey: s3SecretKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
});

// ── State ──────────────────────────────────────────────────────────────────────

function loadState(): SyncState {
  if (existsSync(stateFile)) {
    return JSON.parse(readFileSync(stateFile, "utf8")) as SyncState;
  }
  return { last_synced_at: new Date(0).toISOString() };
}

function saveState(state: SyncState): void {
  writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n", "utf8");
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function localPath(row: RecordingRow): string {
  const ext = extname(row.s3_key) || (row.mime_type === "audio/mp4" ? ".m4a" : ".webm");
  if (row.step === "isolated_keyword" && row.label) {
    return join(outputDir, "isolated_keyword", row.label, `${row.clip_id}${ext}`);
  }
  return join(outputDir, row.step, `${row.clip_id}${ext}`);
}

async function downloadOne(row: RecordingRow): Promise<void> {
  const dest = localPath(row);
  if (existsSync(dest)) return; // idempotent

  mkdirSync(dirname(dest), { recursive: true });

  const { Body } = await s3.send(
    new GetObjectCommand({ Bucket: s3Bucket, Key: row.s3_key })
  );
  if (!Body) throw new Error(`Empty S3 body for key ${row.s3_key}`);

  // AWS SDK v3 returns a Node.js Readable in server context
  const nodeStream = Body instanceof Readable
    ? Body
    : Readable.fromWeb(Body as Parameters<typeof Readable.fromWeb>[0]);

  await pipeline(nodeStream, createWriteStream(dest));
}

// Run `fn` over `items` with at most `limit` concurrent workers.
async function withPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<{ failed: number }> {
  let idx = 0;
  let failed = 0;
  const worker = async (): Promise<void> => {
    while (idx < items.length) {
      const item = items[idx++];
      try {
        await fn(item);
      } catch (err) {
        failed++;
        process.stderr.write(`  ✗ ${String(err)}\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return { failed };
}

// ── Fetch from Supabase ────────────────────────────────────────────────────────

const PAGE_SIZE = 500;

const SELECT_COLS = [
  "clip_id", "contributor_id", "session_id", "step", "label",
  "s3_key", "mime_type", "duration_ms", "file_size_bytes",
  "peak_dbfs", "rms_dbfs", "clipping", "silence_ratio", "snr_estimate",
  "low_quality", "asr_status", "asr_confidence", "recorded_at",
].join(", ");

async function fetchNewRecordings(since: string): Promise<RecordingRow[]> {
  const rows: RecordingRow[] = [];
  let page = 0;

  while (true) {
    let query = supabase
      .from("recordings")
      .select(SELECT_COLS)
      .gt("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (cleanOnly) query = query.eq("low_quality", false);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as RecordingRow[]));
    page++;
  }

  return rows;
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
  mkdirSync(outputDir, { recursive: true });

  const state = loadState();
  const since = state.last_synced_at;

  process.stdout.write(`[kws-sync] Starting — clips after ${since}${cleanOnly ? " (clean only)" : ""}\n`);

  const rows = await fetchNewRecordings(since);
  process.stdout.write(`[kws-sync] ${rows.length} new clip(s) found.\n`);

  if (rows.length === 0) {
    process.stdout.write("[kws-sync] Nothing to do.\n");
    return;
  }

  let done = 0;
  const { failed } = await withPool(rows, concurrency, async (row) => {
    await downloadOne(row);
    done++;
    if (done % 20 === 0 || done === rows.length) {
      process.stdout.write(`[kws-sync] ${done}/${rows.length} downloaded\n`);
    }
  });

  // Append new metadata rows to the manifest
  const newLines = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(manifestFile, newLines, "utf8");

  const lastRow = rows[rows.length - 1];
  saveState({ last_synced_at: lastRow.recorded_at });

  process.stdout.write(
    `[kws-sync] Done. ${done - failed} downloaded, ${failed} failed. ` +
    `Next run starts from ${lastRow.recorded_at}\n`
  );
})().catch((err) => {
  process.stderr.write(`[kws-sync] Fatal: ${String(err)}\n`);
  process.exit(1);
});
