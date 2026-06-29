-- ── Drop unused columns ────────────────────────────────────────────────────────
-- Migration: 0009_drop_unused_columns
-- These columns were defined but never populated:
--   recordings.sample_rate          — never sent by the client
--   collection_sessions.environment — demographics step always skipped
--   collection_sessions.chanting_speed — demographics step always skipped
--   collection_sessions.updated_at  — never updated after insert

ALTER TABLE recordings          DROP COLUMN IF EXISTS sample_rate;
ALTER TABLE collection_sessions DROP COLUMN IF EXISTS environment;
ALTER TABLE collection_sessions DROP COLUMN IF EXISTS chanting_speed;
ALTER TABLE collection_sessions DROP COLUMN IF EXISTS updated_at;
