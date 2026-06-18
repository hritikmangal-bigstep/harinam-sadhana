-- ── KWS Dataset Monitoring Views ──────────────────────────────────────────────
-- Migration: 0002_count_views
-- Read-only aggregate views for dataset health monitoring.
-- No PII is exposed — only counts, durations, and quality flags.

-- ── 1. kws_clip_counts_by_label ───────────────────────────────────────────────
-- Isolated-keyword step only: clip counts per keyword label.
CREATE OR REPLACE VIEW kws_clip_counts_by_label AS
SELECT
  label,
  COUNT(*)                                           AS total_clips,
  COUNT(*) FILTER (WHERE low_quality = false)        AS clean_clips,
  COUNT(*) FILTER (WHERE asr_status = 'confirmed')   AS confirmed_clips
FROM recordings
WHERE step = 'isolated_keyword' AND label IS NOT NULL
GROUP BY label
ORDER BY label;

-- ── 2. kws_recitation_counts ──────────────────────────────────────────────────
-- Recitation steps only: clip counts and distinct contributor counts per step.
CREATE OR REPLACE VIEW kws_recitation_counts AS
SELECT
  step,
  COUNT(*)                                           AS total_clips,
  COUNT(*) FILTER (WHERE low_quality = false)        AS clean_clips,
  COUNT(DISTINCT contributor_id)                     AS contributors
FROM recordings
WHERE step != 'isolated_keyword'
GROUP BY step
ORDER BY step;

-- ── 3. kws_contributor_summary ────────────────────────────────────────────────
-- Per-contributor clip counts, session counts, total duration, and quality stats.
CREATE OR REPLACE VIEW kws_contributor_summary AS
SELECT
  r.contributor_id,
  COUNT(*)                                           AS total_clips,
  COUNT(DISTINCT r.session_id)                       AS total_sessions,
  COALESCE(SUM(r.duration_ms), 0)                    AS total_duration_ms,
  COUNT(*) FILTER (WHERE r.low_quality = false)      AS clean_clips
FROM recordings r
GROUP BY r.contributor_id
ORDER BY total_clips DESC;

-- ── 4. kws_dataset_health ─────────────────────────────────────────────────────
-- Single-row dashboard summary across all recordings.
CREATE OR REPLACE VIEW kws_dataset_health AS
SELECT
  COUNT(*)                                               AS total_recordings,
  COUNT(DISTINCT contributor_id)                         AS total_contributors,
  COUNT(DISTINCT session_id)                             AS total_sessions,
  COUNT(*) FILTER (WHERE low_quality = false)            AS clean_recordings,
  COUNT(*) FILTER (WHERE step = 'isolated_keyword')      AS keyword_clips,
  COUNT(*) FILTER (WHERE step != 'isolated_keyword')     AS recitation_clips,
  COUNT(*) FILTER (WHERE asr_status = 'confirmed')       AS asr_confirmed,
  COUNT(*) FILTER (WHERE asr_status = 'uncertain')       AS asr_uncertain,
  COUNT(*) FILTER (WHERE asr_status = 'pending')         AS asr_pending,
  ROUND(AVG(duration_ms)::numeric, 0)::integer           AS avg_duration_ms
FROM recordings;

-- ── Grants ────────────────────────────────────────────────────────────────────
-- Views aggregate counts only — safe to expose to anon and authenticated roles.
GRANT SELECT ON kws_clip_counts_by_label  TO anon, authenticated;
GRANT SELECT ON kws_recitation_counts     TO anon, authenticated;
GRANT SELECT ON kws_contributor_summary   TO anon, authenticated;
GRANT SELECT ON kws_dataset_health        TO anon, authenticated;
