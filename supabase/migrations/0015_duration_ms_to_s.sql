ALTER TABLE collection_sessions
  RENAME COLUMN part1_duration_ms TO part1_duration_s;

ALTER TABLE collection_sessions
  RENAME COLUMN part2_duration_ms TO part2_duration_s;
