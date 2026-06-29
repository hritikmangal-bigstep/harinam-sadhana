import { notFound } from "next/navigation";
import { timingSafeEqual, createHash } from "crypto";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  name: string | null;
  email: string | null;
  started_at: string;
  part1_s3_key: string | null;
  part2_s3_key: string | null;
  part1_duration_s: number | null;
  part2_duration_s: number | null;
}

interface ResolvedSession {
  sessionId: string;
  name: string | null;
  email: string | null;
  startedAt: string;
  part1Key: string | null;
  part2Key: string | null;
  part1DurationMs: number | null;
  part2DurationMs: number | null;
}

// ── Auth ───────────────────────────────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchSessions(): Promise<ResolvedSession[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("collection_sessions")
    .select("id,name,email,started_at,part1_s3_key,part2_s3_key,part1_duration_s,part2_duration_s")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return (data as SessionRow[]).map((s) => ({
    sessionId: s.id,
    name: s.name,
    email: s.email,
    startedAt: s.started_at,
    part1Key: s.part1_s3_key,
    part2Key: s.part2_s3_key,
    part1DurationMs: s.part1_duration_s,
    part2DurationMs: s.part2_duration_s,
  }));
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyCell() {
  return <span className="text-muted text-xs">—</span>;
}

function formatDuration(s: number | null): string {
  if (!s) return "";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ListenLink({ s3Key, durationMs }: { s3Key: string | null; durationMs: number | null }) {
  if (!s3Key) return <EmptyCell />;
  const dur = formatDuration(durationMs);
  return (
    <a
      href={`/api/listen?key=${encodeURIComponent(s3Key)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
    >
      ▶ Listen{dur ? ` (${dur})` : ""}
    </a>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = Array.isArray(searchParams.token)
    ? searchParams.token[0]
    : searchParams.token;

  // Constant-time comparison prevents timing oracle brute-force.
  // Note: token in query string is logged by CDN — rotate if exposed.
  if (!adminToken || !provided || !constantTimeEqual(provided, adminToken)) {
    notFound();
  }

  const sessions = await fetchSessions();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-heading text-2xl text-foreground mb-1">
          KWS Session Viewer
        </h1>
        <p className="text-sm text-muted mb-6">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>

        {sessions.length === 0 ? (
          <p className="text-muted">No sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Part 1 · Panch-tattva</th>
                  <th className="px-4 py-3">Part 2 · Maha-mantra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr key={s.sessionId} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-xs text-foreground font-medium">
                      {s.name ?? <span className="text-muted italic">Anonymous</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {s.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">
                      {new Date(s.startedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <ListenLink s3Key={s.part1Key} durationMs={s.part1DurationMs} />
                    </td>
                    <td className="px-4 py-3">
                      <ListenLink s3Key={s.part2Key} durationMs={s.part2DurationMs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
