-- ── Add name + email to collection_sessions ──────────────────────────────────
-- Migration: 0005_session_name

ALTER TABLE collection_sessions ADD COLUMN IF NOT EXISTS name  TEXT;
ALTER TABLE collection_sessions ADD COLUMN IF NOT EXISTS email TEXT;

-- Rebuild kws_session_parts to include name + email
DROP VIEW IF EXISTS kws_session_parts;
CREATE VIEW kws_session_parts AS
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

  max(r.s3_key) FILTER (WHERE r.step = 'panch_tattva_recitation')          AS part2_s3_key,
  max(r.s3_key) FILTER (WHERE r.step = 'mahamantra_round')                 AS part3_s3_key,
  max(r.s3_key) FILTER (WHERE r.step = 'panch_tattva_mahamantra_round')    AS part4_s3_key

FROM collection_sessions s
LEFT JOIN recordings r ON r.session_id = s.id
GROUP BY s.id, s.contributor_id, s.name, s.email, s.started_at
ORDER BY s.started_at DESC;

GRANT SELECT ON kws_session_parts TO anon, authenticated;
