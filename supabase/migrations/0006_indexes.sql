-- ── Performance indexes on FK columns ─────────────────────────────────────────
-- Migration: 0006_indexes
-- PostgreSQL does not auto-index FK columns. Both session_id and contributor_id
-- are join/filter keys in every count view and kws_session_parts.
-- Sequential scans on recordings degrade all view queries as the dataset grows.

CREATE INDEX IF NOT EXISTS idx_recordings_session_id
  ON recordings(session_id);

CREATE INDEX IF NOT EXISTS idx_recordings_contributor_id
  ON recordings(contributor_id);

CREATE INDEX IF NOT EXISTS idx_sessions_contributor_id
  ON collection_sessions(contributor_id);
