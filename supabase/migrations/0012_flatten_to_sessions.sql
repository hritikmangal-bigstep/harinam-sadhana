-- ── Flatten recordings into collection_sessions ───────────────────────────
-- Migration: 0012_flatten_to_sessions
-- The recordings table is removed. Two s3-key columns are added directly to
-- collection_sessions (one per step), and all views are rebuilt to use that.

ALTER TABLE collection_sessions
  ADD COLUMN part1_s3_key TEXT,
  ADD COLUMN part2_s3_key TEXT;

-- Drop all views that reference recordings
DROP VIEW IF EXISTS kws_session_parts;
DROP VIEW IF EXISTS kws_recitation_counts;
DROP VIEW IF EXISTS kws_contributor_summary;
DROP VIEW IF EXISTS kws_dataset_health;

-- Drop recordings table and now-unused enums
DROP TABLE IF EXISTS recordings;
DROP TYPE IF EXISTS recording_step;
DROP TYPE IF EXISTS asr_status;
DROP TYPE IF EXISTS keyword_set;

-- kws_session_parts: simple select, no JOIN needed
CREATE VIEW kws_session_parts AS
SELECT
  id               AS session_id,
  contributor_id,
  started_at,
  name,
  email,
  part1_s3_key,
  part2_s3_key
FROM collection_sessions
ORDER BY started_at DESC;

GRANT SELECT ON kws_session_parts TO anon, authenticated;

-- kws_dataset_health: session and clip counts
CREATE VIEW kws_dataset_health AS
SELECT
  COUNT(*)                       AS total_sessions,
  COUNT(DISTINCT contributor_id) AS total_contributors,
  COUNT(part1_s3_key)            AS part1_clips,
  COUNT(part2_s3_key)            AS part2_clips
FROM collection_sessions;

GRANT SELECT ON kws_dataset_health TO anon, authenticated;

-- kws_contributor_summary: per-contributor breakdown
CREATE VIEW kws_contributor_summary AS
SELECT
  contributor_id,
  COUNT(*)            AS total_sessions,
  COUNT(part1_s3_key) AS part1_clips,
  COUNT(part2_s3_key) AS part2_clips
FROM collection_sessions
GROUP BY contributor_id
ORDER BY total_sessions DESC;

GRANT SELECT ON kws_contributor_summary TO anon, authenticated;
