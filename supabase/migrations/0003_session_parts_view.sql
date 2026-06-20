-- ── KWS Session Parts View ────────────────────────────────────────────────────
-- Migration: 0003_session_parts_view
-- One row per collection_session with s3_keys pivoted by step.
-- Used by the /admin session viewer to resolve presigned GET URLs per part.

CREATE OR REPLACE VIEW kws_session_parts AS
SELECT
  s.id                                                                      AS session_id,
  s.contributor_id,
  s.started_at,

  -- Part 1: isolated keyword clips (can be many per session)
  count(r.id)      FILTER (WHERE r.step = 'isolated_keyword')               AS keyword_clip_count,
  array_agg(r.label    ORDER BY r.recorded_at)
    FILTER (WHERE r.step = 'isolated_keyword')                              AS keyword_labels,
  array_agg(r.s3_key   ORDER BY r.recorded_at)
    FILTER (WHERE r.step = 'isolated_keyword')                              AS keyword_s3_keys,

  -- Part 2: Panch-tattva recitation (one per session)
  max(r.s3_key) FILTER (WHERE r.step = 'panch_tattva_recitation')           AS part2_s3_key,

  -- Part 3: Maha-mantra round (one per session)
  max(r.s3_key) FILTER (WHERE r.step = 'mahamantra_round')                  AS part3_s3_key,

  -- Part 4: Full round (one per session)
  max(r.s3_key) FILTER (WHERE r.step = 'panch_tattva_mahamantra_round')     AS part4_s3_key

FROM collection_sessions s
LEFT JOIN recordings r ON r.session_id = s.id
GROUP BY s.id, s.contributor_id, s.started_at
ORDER BY s.started_at DESC;

-- Read-only — aggregate keys only, no PII beyond contributor UUID
GRANT SELECT ON kws_session_parts TO anon, authenticated;
