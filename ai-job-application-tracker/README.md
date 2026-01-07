## AI-Powered Job Application Tracker

Next.js + Tailwind prototype focused on reducing job-search anxiety with clarity and automation.

### Features
- Pipeline board (Applied → Interview → Offer) with drag-and-drop cards.
- Email parsing API endpoint (/api/parse-email) to auto-create applications from inbox snippets.
- Interview prep mode: company brief, signals, and questions.
- Salary negotiation calculator using city multipliers + market percentile (live from /api/market-data with fallback).
- Rejection analytics patterns with actionable tips.
- Mental health check-ins with mood-based nudges and focus console.
- Pipeline persistence via /api/pipeline (in-memory by default; ready for Supabase swap-in).

### Getting Started
- Install deps: `npm install` (already installed by scaffold).
- Dev server: `npm run dev` (or VS Code task "dev").
- Lint: `npm run lint` (or VS Code task "lint").
- App URL: http://localhost:3000

### API Endpoints
- `POST /api/parse-email` — body `{ text }`, returns `{ company, role, location, source, confidence }`.
- `GET /api/market-data` — returns `{ multipliers, lastUpdated }`; used by salary calculator.
- `GET|POST /api/pipeline?userId=demo-user` — persistence for pipeline cards. If Supabase env vars are set and table exists, data is stored there; otherwise it falls back to in-memory.

### Config notes
- Supabase (optional but recommended):
	- Copy `.env.example` to `.env.local` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
	- Create table `pipeline_states`:
		```sql
		create table if not exists public.pipeline_states (
			user_id text primary key,
			applications jsonb not null default '[]'::jsonb
		);
		```
	- RLS: either keep disabled for this prototype or add policy `using (auth.uid() = user_id)` and use service role in the route (already wired).
	- Auth: send `Authorization: Bearer <supabase-jwt>` to /api/pipeline to bind to the authenticated user; otherwise it falls back to `userId` query param.

### Notes
- Data sources are mocked; swap in real email/parsing/market APIs as needed.
- UI lives in `src/app/page.tsx`; typography and theming in `src/app/globals.css`.
