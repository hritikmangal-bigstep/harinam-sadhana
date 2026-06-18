-- ── KWS Labelled Data Schema ─────────────────────────────────────────────────
-- Migration: 0001_kws_schema
-- Depends on: pgcrypto extension

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE recording_step AS ENUM (
  'isolated_keyword',
  'panch_tattva_recitation',
  'mahamantra_round',
  'panch_tattva_mahamantra_round'
);

CREATE TYPE asr_status AS ENUM ('pending', 'confirmed', 'uncertain');

CREATE TYPE keyword_set AS ENUM ('maha_mantra', 'panch_tattva');

-- ── Tables ────────────────────────────────────────────────────────────────────

-- contributors: one row per anonymous browser session identity
CREATE TABLE contributors (
  id              TEXT PRIMARY KEY,        -- UUID from localStorage (contributorId)
  language        TEXT,
  native_language TEXT,
  age_group       TEXT,
  gender          TEXT,
  region          TEXT,
  device_type     TEXT,
  browser         TEXT,
  os              TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- collection_sessions: one per visit/page-load
CREATE TABLE collection_sessions (
  id              TEXT PRIMARY KEY,        -- UUID (sessionId)
  contributor_id  TEXT NOT NULL REFERENCES contributors(id),
  environment     TEXT,                    -- e.g. "indoor-quiet"
  chanting_speed  TEXT,                    -- e.g. "normal"
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- recordings: one per audio clip submitted
CREATE TABLE recordings (
  id              BIGSERIAL PRIMARY KEY,
  clip_id         TEXT NOT NULL UNIQUE,    -- client-generated UUID (idempotency key)
  session_id      TEXT NOT NULL REFERENCES collection_sessions(id),
  contributor_id  TEXT NOT NULL REFERENCES contributors(id),
  step            recording_step NOT NULL,
  label           TEXT,                    -- NULL for recitation steps; keyword for isolated_keyword
  s3_key          TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  duration_ms     INTEGER,
  sample_rate     INTEGER,
  file_size_bytes INTEGER,
  peak_dbfs       REAL,
  rms_dbfs        REAL,
  clipping        BOOLEAN,
  silence_ratio   REAL,
  snr_estimate    REAL,
  low_quality     BOOLEAN NOT NULL DEFAULT FALSE,
  asr_status      asr_status NOT NULL DEFAULT 'pending',
  asr_confidence  REAL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- keywords: reference catalog — seeded below
CREATE TABLE keywords (
  label           TEXT PRIMARY KEY,
  devanagari      TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  keyword_set     keyword_set NOT NULL,
  target_takes    INTEGER NOT NULL DEFAULT 30
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Deny all by default; the service role key bypasses RLS for backend operations.

ALTER TABLE contributors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords            ENABLE ROW LEVEL SECURITY;

-- ── Seed: Keywords ────────────────────────────────────────────────────────────

INSERT INTO keywords (label, devanagari, transliteration, keyword_set) VALUES
  ('hare',            'हरे',            'hare',             'maha_mantra'),
  ('krishna',         'कृष्ण',          'krishna',          'maha_mantra'),
  ('rama',            'राम',            'rama',             'maha_mantra'),
  ('hare_krishna',    'हरे कृष्ण',      'hare krishna',     'maha_mantra'),
  ('hare_rama',       'हरे राम',        'hare rama',        'maha_mantra'),
  ('krishna_krishna', 'कृष्ण कृष्ण',    'krishna krishna',  'maha_mantra'),
  ('rama_rama',       'राम राम',        'rama rama',        'maha_mantra'),
  ('jaya',            'जय',             'jaya',             'panch_tattva'),
  ('sri',             'श्री',           'sri',              'panch_tattva'),
  ('chaitanya',       'चैतन्य',         'chaitanya',        'panch_tattva'),
  ('nityananda',      'नित्यानन्द',     'nityananda',       'panch_tattva'),
  ('advaita',         'अद्वैत',         'advaita',          'panch_tattva'),
  ('gadadhara',       'गदाधर',          'gadadhara',        'panch_tattva'),
  ('srivasa',         'श्रीवास',        'srivasa',          'panch_tattva');
