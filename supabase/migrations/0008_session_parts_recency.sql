-- ── Fix kws_session_parts to use most-recently-recorded clip per step ──────────
-- Migration: 0008_session_parts_recency
-- Previously used max(s3_key) to select the clip for recitation steps.
-- UUID-based keys are not lexicographically time-ordered, so max(s3_key) returns
-- an arbitrary clip when a contributor re-records a step. Replace with a
-- correlated subquery ordered by recorded_at DESC.

CREATE OR REPLACE VIEW kws_session_parts AS
SELECT
  s.id                                                                      AS session_id,
  s.contributor_id,
  s.name,
  s.email,
  s.started_at,

  count(r.id)   FILTER (WHERE r.step = 'isolated_keyword')                 AS keyword_clip_count,
  array_agg(r.label   ORDER BY r.recorded_at)
    FILTER (WHERE r.step = 'isolated_keyword')                              AS keyword_labels,
  array_agg(r.s3_key  ORDER BY r.recorded_at)
    FILTER (WHERE r.step = 'isolated_keyword')                              AS keyword_s3_keys,

  (SELECT r2.s3_key FROM recordings r2
   WHERE r2.session_id = s.id AND r2.step = 'panch_tattva_recitation'
   ORDER BY r2.recorded_at DESC LIMIT 1)                                   AS part2_s3_key,

  (SELECT r2.s3_key FROM recordings r2
   WHERE r2.session_id = s.id AND r2.step = 'mahamantra_round'
   ORDER BY r2.recorded_at DESC LIMIT 1)                                   AS part3_s3_key,

  (SELECT r2.s3_key FROM recordings r2
   WHERE r2.session_id = s.id AND r2.step = 'panch_tattva_mahamantra_round'
   ORDER BY r2.recorded_at DESC LIMIT 1)                                   AS part4_s3_key

FROM collection_sessions s
LEFT JOIN recordings r ON r.session_id = s.id
GROUP BY s.id, s.contributor_id, s.name, s.email, s.started_at
ORDER BY s.started_at DESC;

GRANT SELECT ON kws_session_parts TO anon, authenticated;
