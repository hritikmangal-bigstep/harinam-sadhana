-- kws_session_parts was a thin alias over collection_sessions (id→session_id only).
-- Now that recordings has been folded in, the view adds no value.
DROP VIEW IF EXISTS kws_session_parts;
