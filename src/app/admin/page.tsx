import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ── Types ──────────────────────────────────────────────────────────────────

interface SessionPartRow {
  session_id: string;
  contributor_id: string;
  name: string | null;
  email: string | null;
  started_at: string;
  keyword_clip_count: number;
  keyword_labels: string[] | null;
  keyword_s3_keys: string[] | null;
  part2_s3_key: string | null;
  part3_s3_key: string | null;
  part4_s3_key: string | null;
}

interface ResolvedSession {
  sessionId: string;
  contributorId: string;
  name: string | null;
  email: string | null;
  startedAt: string;
  keywordClips: { label: string; key: string }[];
  part2Key: string | null;
  part3Key: string | null;
  part4Key: string | null;
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchSessions(): Promise<ResolvedSession[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("kws_session_parts")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return (data as SessionPartRow[]).map((s) => {
    const keys = s.keyword_s3_keys ?? [];
    const labels = s.keyword_labels ?? [];
    return {
      sessionId: s.session_id,
      contributorId: s.contributor_id,
      name: s.name,
      email: s.email,
      startedAt: s.started_at,
      keywordClips: keys.map((key, i) => ({ label: labels[i] ?? "?", key })),
      part2Key: s.part2_s3_key,
      part3Key: s.part3_s3_key,
      part4Key: s.part4_s3_key,
    };
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyCell() {
  return <span className="text-muted text-xs">—</span>;
}

function ListenLink({ s3Key, label }: { s3Key: string | null; label?: string }) {
  if (!s3Key) return <EmptyCell />;
  return (
    <a
      href={`/api/listen?key=${encodeURIComponent(s3Key)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
    >
      ▶ {label ?? "Listen"}
    </a>
  );
}

function KeywordClips({ clips }: { clips: { label: string; key: string }[] }) {
  if (clips.length === 0) return <EmptyCell />;
  return (
    <div className="flex flex-wrap gap-1">
      {clips.map((c, i) => (
        <ListenLink key={i} s3Key={c.key} label={c.label} />
      ))}
    </div>
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
  if (!adminToken || provided !== adminToken) {
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
                  <th className="px-4 py-3">Part 1 · Keywords</th>
                  <th className="px-4 py-3">Part 2 · Panch-tattva</th>
                  <th className="px-4 py-3">Part 3 · Maha-mantra</th>
                  <th className="px-4 py-3">Part 4 · Full round</th>
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
                    <td className="px-4 py-3 max-w-xs">
                      <KeywordClips clips={s.keywordClips} />
                    </td>
                    <td className="px-4 py-3">
                      <ListenLink s3Key={s.part2Key} />
                    </td>
                    <td className="px-4 py-3">
                      <ListenLink s3Key={s.part3Key} />
                    </td>
                    <td className="px-4 py-3">
                      <ListenLink s3Key={s.part4Key} />
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
