# AI-Powered Job Application Tracker — Whitepaper

## Purpose
Deliver a calm, automation-assisted job-search experience: keep candidates focused on the next best action, reduce anxiety, and surface grounded salary and prep guidance without requiring manual spreadsheet work.

## Product Goals
- Clarity: single dashboard for pipeline, prep, salary guidance, rejection signals, and mood check-ins.
- Momentum: quick capture from emails and tap-to-advance pipeline interactions.
- Confidence: market-grounded salary calculator and structured interview prep.
- Wellbeing: lightweight mental-health nudges to prevent overwhelm.

## System Overview
- **Frontend**: Next.js (App Router) + React + Tailwind CSS. Main experience lives in `src/app/page.tsx` with client-side state for pipeline, mood, prep, and salary logic. Toasts and mobile-friendly affordances keep feedback immediate.
- **APIs (mocked)**:
  - `POST /api/parse-email`: heuristic extractor for company, role, and location from free text; used to auto-create cards.
  - `GET /api/market-data`: cached city multipliers with a `lastUpdated` marker for salary calculator inputs.
  - `GET|POST /api/pipeline?userId=...`: in-memory persistence keyed by `userId` (returns `persistence: "memory"`). Suitable for demos; swap to a database by replacing the Map-backed store.
- **State & Persistence**: Client state initializes with seed applications; pipeline CRUD flows through the API to keep the UI and backend contract aligned, even when mocked.
- **UX Safety Nets**: Optimistic toasts, drag-and-drop plus tap-to-advance, dropzone cues, and focus console tasks to lower cognitive load.

## AI & LLM Posture
- Current build ships with deterministic heuristics and curated copy (no external LLM calls) to keep demos offline-ready and predictable.
- LLM integration hooks: replace `parse-email` with a hosted model, swap `buildPrepPack` with an LLM prompt, and enrich rejection analytics with embeddings or pattern mining.
- Guardrails to consider when adding LLMs: input validation, token budgeting, PII scrubbing, deterministic fallbacks, and user-visible confidence messaging.

## Data Flow (happy path)
1. User loads dashboard → client fetches `/api/pipeline` and `/api/market-data` to hydrate state.
2. Email snippet pasted → client calls `/api/parse-email` → returns structured fields → card auto-created in Applied.
3. Pipeline edits (drag/drop or tap) → local state updates; user can POST to `/api/pipeline` to persist per `userId`.
4. Salary calculator uses fetched multipliers + percentile slider → `recommendedAsk` updates client-side; user can copy rationale.
5. Mood slider and focus console remain client-only, never sent to the server.

## Non-Goals (current scope)
- No external auth or user accounts; `userId` is a client-provided key.
- No real email ingestion; parsing assumes pasted snippets.
- No real market-data feed; multipliers are static mocks.

## Security & Privacy
- All endpoints are mock and stateless; no database writes beyond in-memory Map.
- Validate request bodies server-side; reject malformed pipeline payloads.
- When adding real data sources: enforce auth, apply rate limiting, scrub PII before logging, and set CORS appropriately.

## Operations & Performance
- Lightweight footprint: static assets + minimal API work; suitable for Vercel/Netlify/Node runtimes.
- Tailwind 4 runtime-less setup keeps CSS payload small; no client-side state libraries beyond React hooks.
- Accessibility: hover and tap affordances; gradient/background contrast; consider further a11y checks before production.

## Extensibility Roadmap
- Swap pipeline persistence to a database (e.g., Supabase/Postgres) with RLS and per-user scoping.
- Integrate a hosted LLM for parsing and prep with deterministic templates as fallback.
- Add real email/webhook intake and calendar sync for interview steps.
- Expand analytics with time-to-stage, conversion rates, and rejection clustering.
- Introduce offline-first caching for pipeline state on mobile.

## Runbook (current prototype)
- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- App entry: http://localhost:3000

## Status
Prototype complete with mock APIs, ready to demo and to extend with real data/LLM integrations.
