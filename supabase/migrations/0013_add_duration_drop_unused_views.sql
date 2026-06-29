-- Add duration columns to collection_sessions
ALTER TABLE collection_sessions
  ADD COLUMN part1_duration_ms INTEGER,
  ADD COLUMN part2_duration_ms INTEGER;

-- Drop unused analytics views
DROP VIEW IF EXISTS kws_contributor_summary;
DROP VIEW IF EXISTS kws_dataset_health;

-- Recreate kws_session_parts with duration columns
DROP VIEW IF EXISTS kws_session_parts;
CREATE VIEW kws_session_parts AS
SELECT
  id                AS session_id,
  contributor_id,
  started_at,
  name,
  email,
  part1_s3_key,
  part2_s3_key,
  part1_duration_ms,
  part2_duration_ms
FROM collection_sessions
ORDER BY started_at DESC;

GRANT SELECT ON kws_session_parts TO anon, authenticated;
