-- ── Restrict anon access to contributor summary ────────────────────────────────
-- Migration: 0007_anon_access
-- kws_contributor_summary surfaces contributor_id (a persistent pseudonymous ID)
-- plus clip counts and total duration per speaker to the anon role. Any Supabase
-- anon-key client can enumerate all contributor UUIDs. Revoke to prevent linkage.

REVOKE SELECT ON kws_contributor_summary FROM anon;
