-- ── Drop keyword-specific objects ─────────────────────────────────────────────
-- Migration: 0011_drop_keyword_objects
-- The isolated_keyword step has been removed from the contribution flow.
-- These objects are no longer used.

DROP VIEW IF EXISTS kws_clip_counts_by_label;
DROP TABLE IF EXISTS keywords;
