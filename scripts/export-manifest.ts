// Usage:
//   npx ts-node scripts/export-manifest.ts [--output ./manifest.ndjson] [--step isolated_keyword] [--clean-only]
//
// Exports the KWS recordings table as newline-delimited JSON (NDJSON).
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env,
// falling back to buildEnv baked values.  Throws if both sources are absent.
//
// Options:
//   --output <path>   Output file path          (default: ./manifest.ndjson)
//   --step   <step>   Filter by recording_step  (optional)
//   --clean-only      Exclude low_quality clips  (optional)

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { buildEnv } from "../src/lib/build-env";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ManifestRow {
  clip_id: string;
  contributor_id: string;
  session_id: string;
  step: string;
  label: string | null;
  s3_key: string;
  mime_type: string;
  duration_ms: number | null;
  sample_rate: number | null;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

// ── CLI args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const outputPath = getArg(args, "--output") ?? "./manifest.ndjson";
const stepFilter = getArg(args, "--step");
const cleanOnly = args.includes("--clean-only");

// ── Supabase client ────────────────────────────────────────────────────────────

const url = process.env.SUPABASE_URL || buildEnv.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || buildEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  process.stderr.write(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.\n" +
      "Set them in your environment or .env.local file.\n"
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// ── Paginated fetch ────────────────────────────────────────────────────────────

const SELECT_COLUMNS = [
  "clip_id",
  "contributor_id",
  "session_id",
  "step",
  "label",
  "s3_key",
  "mime_type",
  "duration_ms",
  "sample_rate",
  "file_size_bytes",
  "peak_dbfs",
  "rms_dbfs",
  "clipping",
  "silence_ratio",
  "snr_estimate",
  "low_quality",
  "asr_status",
  "asr_confidence",
  "recorded_at",
].join(", ");

const PAGE_SIZE = 1000;
let page = 0;
const rows: ManifestRow[] = [];

(async () => {
  while (true) {
    const query = supabase
      .from("recordings")
      .select(SELECT_COLUMNS)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order("recorded_at", { ascending: true });

    if (stepFilter) query.eq("step", stepFilter);
    if (cleanOnly) query.eq("low_quality", false);

    const { data, error } = await query;

    if (error) {
      process.stderr.write(`Error: Supabase query failed: ${error.message}\n`);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as ManifestRow[]));
    page++;
  }

  const ndjson = rows.map((r) => JSON.stringify(r)).join("\n");
  writeFileSync(outputPath, ndjson, "utf8");
  process.stdout.write(`Exported ${rows.length} recordings to ${outputPath}\n`);
})();
