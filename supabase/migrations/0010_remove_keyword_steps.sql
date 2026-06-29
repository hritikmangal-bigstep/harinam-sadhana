-- ── Remove keyword and full-round steps ───────────────────────────────────────
-- Migration: 0010_remove_keyword_steps
-- The isolated_keyword and panch_tattva_mahamantra_round steps are removed from
-- the contribution flow. This migration updates views to reflect the 2-step flow
-- (panch_tattva_recitation = part 1, mahamantra_round = part 2).
-- Existing recordings rows are preserved as-is; only the views change.

-- ── Update kws_session_parts ──────────────────────────────────────────────────
-- Renamed: part2_s3_key → part1_s3_key, part3_s3_key → part2_s3_key.
-- Removed: keyword_clip_count, keyword_labels, keyword_s3_keys, part4_s3_key.

CREATE OR REPLACE VIEW kws_session_parts AS
SELECT
  s.id                                                                      AS session_id,
  s.contributor_id,
  s.started_at,
  s.name,
  s.email,

  -- Part 1: Panch-tattva recitation (one per session)
  max(r.s3_key) FILTER (WHERE r.step = 'panch_tattva_recitation')           AS part1_s3_key,

  -- Part 2: Maha-mantra round (one per session)
  max(r.s3_key) FILTER (WHERE r.step = 'mahamantra_round')                  AS part2_s3_key

FROM collection_sessions s
LEFT JOIN recordings r ON r.session_id = s.id
GROUP BY s.id, s.contributor_id, s.started_at, s.name, s.email
ORDER BY s.started_at DESC;

GRANT SELECT ON kws_session_parts TO anon, authenticated;

-- ── Update kws_recitation_counts ──────────────────────────────────────────────
-- All remaining steps are recitation steps; remove the WHERE filter.

CREATE OR REPLACE VIEW kws_recitation_counts AS
SELECT
  step,
  COUNT(*)                                           AS total_clips,
  COUNT(*) FILTER (WHERE low_quality = false)        AS clean_clips,
  COUNT(DISTINCT contributor_id)                     AS contributors
FROM recordings
WHERE step IN ('panch_tattva_recitation', 'mahamantra_round')
GROUP BY step
ORDER BY step;

GRANT SELECT ON kws_recitation_counts TO anon, authenticated;

-- ── Update kws_dataset_health ─────────────────────────────────────────────────
-- Remove keyword_clips / recitation_clips split; all new clips are recitations.

CREATE OR REPLACE VIEW kws_dataset_health AS
SELECT
  COUNT(*)                                               AS total_recordings,
  COUNT(DISTINCT contributor_id)                         AS total_contributors,
  COUNT(DISTINCT session_id)                             AS total_sessions,
  COUNT(*) FILTER (WHERE low_quality = false)            AS clean_recordings,
  COUNT(*) FILTER (WHERE asr_status = 'confirmed')       AS asr_confirmed,
  COUNT(*) FILTER (WHERE asr_status = 'uncertain')       AS asr_uncertain,
  COUNT(*) FILTER (WHERE asr_status = 'pending')         AS asr_pending,
  ROUND(AVG(duration_ms)::numeric, 0)::integer           AS avg_duration_ms
FROM recordings;

GRANT SELECT ON kws_dataset_health TO anon, authenticated;
