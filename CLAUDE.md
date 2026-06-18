# harinam-sadhana — CLAUDE.md

> This file is read by Claude Code at the start of every session.
> Keep it updated. Every correction → a CLAUDE.md update.

## Tech Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, AWS S3 (audio + metadata storage), Supabase (KWS metadata), Web Audio API (WhatsApp-style recorder + quality metrics)

## Architecture
Two distinct surfaces share the same repo:

1. **Offering flow** — devotee chanting-session form. Audio + metadata go to S3 via presigned PUT URLs. No database, no auth.
2. **KWS contribution flow** (`/contribute`) — four-step no-login flow that collects labelled audio for keyword-spotting model training. Audio goes to S3, per-clip metadata goes to Supabase via a backend-mediated route. An anonymous `contributorId` (UUID in localStorage) ties clips to a speaker. IndexedDB autosave ensures no clip is lost on refresh/close/offline.

## File Structure
```
src/app/                          – pages and layouts
src/app/api/upload/               – presigned URL generator (S3 PUT, both offering + KWS)
src/app/api/recordings/           – POST /api/recordings (KWS clip metadata → Supabase)
src/app/api/confirm/              – POST /api/confirm (non-blocking ASR backfill, Step 1 only)
src/app/api/sheets/kws/           – POST /api/sheets/kws (Step 4 summary → Google Sheets)
src/app/contribute/               – KWS contribution page
src/components/recorder/          – WhatsApp-style audio recorder + quality metrics hook
src/components/collect/           – KWS contribution flow components
  ContributionFlow.tsx            – 4-step wizard with autosave + demographics gate
  PromptedRecorder.tsx            – Step 1: prompted keyword cycling (both mantra sets)
  RecitationStep.tsx              – Steps 2–4: single recitation capture
  DemographicsStep.tsx            – Skippable demographics form (shown before Step 1)
  StepIndicator.tsx               – Step progress indicator
src/components/form/              – Devotee offering form fields
src/components/ui/                – Shadcn base components
src/lib/s3.ts                     – AWS S3 presigned URL helpers (offering + KWS)
src/lib/supabase.ts               – Cached server-side Supabase client (service role key)
src/lib/steps.ts                  – RecordingStep type, RECORDING_STEPS, step↔number maps
src/lib/keywords.ts               – 14 KWS keyword catalog with take targets
src/lib/quality-metrics.ts        – Per-clip quality metrics (peak dBFS, RMS, clipping, SNR)
src/lib/autosave/store.ts         – IndexedDB clip persistence
src/lib/autosave/upload-queue.ts  – Background upload queue (retry, drain, rehydrate)
src/lib/contributor-id.ts         – Anonymous contributor UUID (localStorage)
src/lib/build-env.ts              – Compile-time env var baking for Amplify deployments
src/types/index.ts                – Shared TypeScript types
supabase/migrations/              – SQL migrations (0001: schema, 0002: count views)
scripts/export-manifest.ts        – NDJSON manifest export from Supabase
```

## Commands
```bash
npm run dev       – start dev server (localhost:3000)
npm run build     – production build
npm run lint      – ESLint check
npm run typecheck – tsc --noEmit type check
npm run test      – Jest + React Testing Library
```

## Conventions
- TypeScript strict mode, no `any` types
- Functional components with hooks only
- Server Components by default; "use client" only for recorder and form interactions
- Tailwind for all styling — no inline styles, no CSS modules
- Use Shadcn/ui primitives before writing custom UI
- AWS S3 uploads always via presigned URLs — never expose credentials client-side
- S3 key structure (offering): `submissions/{devotee-name}/{YYYY-MM-DD}/{timestamp}.webm`
- S3 key structure (KWS Step 1): `kws-collection/clips/{label}/{contributorId}__{clipId}.{ext}`
- S3 key structure (KWS Steps 2–4): `kws-collection/recitations/{prefix}/{contributorId}/{clipId}.{ext}`
- Supabase writes always via `/api/recordings` route — never client-side service key
- Warm saffron/gold color palette — use CSS variables defined in globals.css
- ESLint rule `@typescript-eslint/no-explicit-any` is NOT in the project config — use `unknown` or type assertions instead

## Environment Variables
All server-only vars use the `S3_` or bare prefix — NOT `AWS_` (reserved by Amplify):
```
S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_SHEETS_ID
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
TRANSCRIPTION_SERVICE_URL   – optional; if unset, asr_status stays 'pending'
```

## Do NOT
- Never expose AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID, or SUPABASE_SERVICE_ROLE_KEY to the client
- Don't upload audio directly from the browser to S3 without a presigned URL from the API route
- Don't store audio blobs anywhere except S3 (IndexedDB is a transient pre-upload buffer only)
- Don't accept audio files other than audio/webm or audio/mp4
- Don't add auth, login — out of scope for this phase
- Don't use console.log in production code (use process.stderr.write in scripts)
- Don't create files over 300 lines
- Never commit .env or .env.local
- Don't store ASR transcripts — only asr_status + asr_confidence may be persisted

## Known Mistakes to Watch For
- Claude forgets presigned URLs must be generated server-side — always in /api/upload route
- Claude sometimes skips audio MIME type validation before S3 upload
- Claude forgets to stop and release MediaRecorder stream tracks on component unmount (mic stays active)
- Claude hardcodes S3 bucket name or region — always use environment variables (S3_ prefix)
- Claude sometimes adds a backend database unnecessarily — Supabase is approved for KWS metadata only
- Claude neglects cross-browser MediaRecorder codec support (use webm/opus with mp4 fallback)
- Claude may add `eslint-disable @typescript-eslint/no-explicit-any` or `no-require-imports` — these rules are NOT in the ESLint config and cause lint errors; use `unknown` casts instead
- API route tests require `/** @jest-environment node */` at the top
- Fire-and-forget `fetch` calls in components need `global.fetch = jest.fn()` in tests (jsdom has no fetch)
- Supabase mock must propagate `mockUpsert` return value: `const override = mockUpsert(...); return override ?? { data: null, error: null }`

## Testing
- Jest + React Testing Library for component tests
- Test files co-located as `__tests__/` next to each component
- API route tests: add `/** @jest-environment node */` at the top
- Mock Supabase client, AWS S3 presigned URL API in all relevant tests
- Mock fire-and-forget fetch calls with `global.fetch = jest.fn().mockResolvedValue({ ok: true })`
- Test recorder flows: start, stop, discard, rerecord
- Test form validation with valid and invalid inputs
- Run before any PR: `npm run test && npm run lint && npm run typecheck`

## Notes & References
- Audio recorder UX: press-and-hold to record (WhatsApp-style), slide left to cancel, release to submit, slide upward to lock.
- KWS contribution flow: Demographics gate → Step 1 (keywords) → Step 2 (Panch-tattva) → Step 3 (Maha-mantra) → Step 4 (full round). Every step skippable.
- Step 4 completion writes a summary row to `KWS!A:D` in Google Sheets (fire-and-forget).
- Design: warm saffron/gold palette, lotus motifs, calm spiritual aesthetic
- S3 bucket must be private — no public access, presigned URLs only
- Presigned URL expiry: 8 minutes (upload), enough for one submission flow
- ASR confirmation: Step 1 only, non-blocking, no transcript stored ever
- Supabase count views (0002_count_views.sql): kws_clip_counts_by_label, kws_recitation_counts, kws_contributor_summary, kws_dataset_health

---
*Updated after KWS labelled data collection feature (feat/kws-labelling)*
