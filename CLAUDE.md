# harinam-sadhana — CLAUDE.md

> This file is read by Claude Code at the start of every session.
> Keep it updated. Every correction → a CLAUDE.md update.

## Tech Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, AWS S3 (audio + form data storage), Web Audio API (WhatsApp-style recorder)

## Architecture
Simple Next.js frontend with a devotee submission form. Audio recorded client-side via Web Audio API with MediaRecorder (WhatsApp-style press-and-hold). On submit, audio file and devotee details uploaded to AWS S3 via presigned URLs generated in a Next.js API route. No database — all data lives in S3 with structured key naming. No auth required.

## File Structure
```
src/app/                     – pages and layouts
src/app/api/upload/          – presigned URL generator (keeps AWS keys server-side)
src/components/recorder/     – WhatsApp-style audio recorder component
src/components/form/         – devotee submission form fields
src/components/ui/           – Shadcn base components
src/lib/s3.ts                – AWS S3 presigned URL helpers
src/types/index.ts           – shared TypeScript types (DevoteeSubmission, etc.)
```

## Commands
```bash
npm run dev      – start dev server (localhost:3000)
npm run build    – production build
npm run lint     – ESLint check
npm run typecheck – tsc --noEmit type check
```

## Conventions
- TypeScript strict mode, no `any` types
- Functional components with hooks only
- Server Components by default; "use client" only for recorder and form interactions
- Tailwind for all styling — no inline styles, no CSS modules
- Use Shadcn/ui primitives before writing custom UI
- AWS S3 uploads always via presigned URLs — never expose credentials client-side
- S3 key structure: submissions/{devotee-name}/{YYYY-MM-DD}/{timestamp}.webm
- Zod for form input validation before upload
- Warm saffron/gold color palette — use CSS variables defined in globals.css

## Do NOT
- Never expose AWS_SECRET_ACCESS_KEY or AWS_ACCESS_KEY_ID to the client
- Don't upload audio directly from the browser to S3 without a presigned URL from the API route
- Don't store audio blobs anywhere except S3
- Don't accept audio files other than audio/webm or audio/mp4
- Don't add auth, login, or database — out of scope for this phase
- Don't use console.log in production code
- Don't create files over 300 lines
- Never commit .env or .env.local

## Known Mistakes to Watch For
- Claude forgets presigned URLs must be generated server-side — always in /api/upload route
- Claude sometimes skips audio MIME type validation before S3 upload
- Claude forgets to stop and release MediaRecorder stream tracks on component unmount (mic stays active)
- Claude hardcodes S3 bucket name or region — always use environment variables
- Claude sometimes adds a backend database unnecessarily — this project is S3-only
- Claude neglects cross-browser MediaRecorder codec support (use webm/opus with mp4 fallback)

## Testing
- Jest + React Testing Library for component tests
- Test files co-located as __tests__/ next to each component
- Mock AWS S3 presigned URL API in all tests
- Test recorder flows: start, stop, discard, rerecord
- Test form validation with valid and invalid inputs
- Run before any PR: npm run test

## Notes & References
- Audio recorder UX: press-and-hold to record (WhatsApp-style), slide left to cancel, release to submit, slide upward to lock the recording.
- Design: warm saffron/gold palette, lotus motifs, calm spiritual aesthetic
- S3 bucket must be private — no public access, presigned URLs only
- Presigned URL expiry: 8 minutes (upload), enough for one submission flow
- Form fields to collect: devotee name, location, chanting rounds count, date, notes (optional)
- Future phase will add Claude AI analysis and chatbot on top of stored S3 data.
- Creating a single page website

---
*Generated with the Claude Code Workshop CLAUDE.md Builder*