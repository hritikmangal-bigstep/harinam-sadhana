-- ── Drop contributors table ───────────────────────────────────────────────────
-- Migration: 0004_drop_contributors
-- Demographics collection is out of scope. contributor_id columns are kept in
-- collection_sessions and recordings for per-speaker grouping; only the FK
-- constraints and the contributors table itself are removed.

ALTER TABLE collection_sessions DROP CONSTRAINT IF EXISTS collection_sessions_contributor_id_fkey;
ALTER TABLE recordings          DROP CONSTRAINT IF EXISTS recordings_contributor_id_fkey;

DROP TABLE IF EXISTS contributors;
