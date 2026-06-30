# BuildStream CRM — Claude Code Guide

## Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Server Components + Server Actions)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives) — `src/components/ui/`
- **Backend/DB:** Supabase — Postgres + RLS, Supabase Auth, Supabase Storage, Supabase Realtime
- **Auth:** Supabase Auth (email/password + OTP + Google OAuth) — middleware in `src/middleware.ts`
- **Data fetching:** TanStack Query (`src/lib/query-client.ts`)
- **Forms:** React Hook Form + Zod
- **Email:** Resend · **SMS:** Twilio · **Maps:** react-leaflet + OpenStreetMap · **Geocoding:** postcodes.io (UK) / IDEAL_POSTCODES
- **PDF:** jsPDF
- **AI:** Anthropic SDK (telesales agent, Phase 11)

## File naming & locations
- Pages: `src/app/(protected)/<feature>/page.tsx`
- Route handlers: `src/app/api/<resource>/route.ts`
- Server Actions: `src/app/(protected)/<feature>/actions.ts`
- Components: `src/components/<domain>/<ComponentName>.tsx`
- Zod schemas: `src/lib/schemas/<entity>.ts`
- Types: `src/types/index.ts`
- Supabase clients: `src/lib/supabase/client.ts` (browser) · `src/lib/supabase/server.ts` (server/SA)
- Supabase migrations: `supabase/migrations/<timestamp>_<name>.sql`
- Edge Functions: `supabase/functions/<name>/index.ts`

## Conventions
- Mirror Base44 entity names + enum values exactly (see `docs/SPEC.md` §3)
- Every table has: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`, `created_date`, `updated_date`, `created_by_id uuid REFERENCES auth.users`
- RLS: enable on every table; write policies in `supabase/migrations/`, don't rely on UI guards
- Server Actions are `async function` files that `"use server"` at the top; return `{ data, error }` shapes
- Edge Functions (scheduled/webhook) live in `supabase/functions/`
- Ask before adding a dependency not in the stack above

## Context rules (READ EVERY SESSION)
1. Never read `docs/SPEC.md` in full — grep for the relevant section only
2. One phase per session; commit at the end; user runs `/clear` before next phase
3. Run `/context` if usage climbs past ~50% on a single phase; tell user to `/compact` or split
4. Use subagents for research so raw file contents stay out of main context
5. Persist decisions to `CLAUDE.md` + `docs/PLAN.md`, not the conversation
6. Keep this file lean — stable rules only

## Supabase client usage
- Browser (Client Components): `import { createClient } from "@/lib/supabase/client"`
- Server (Server Components, Route Handlers, Server Actions): `import { createClient } from "@/lib/supabase/server"`
- Admin (bypass RLS): `import { createServiceClient } from "@/lib/supabase/server"` — server-side only

## Role hierarchy
`admin > manager > operative > contractor > subcontractor > customer`
Nav visibility is filtered in `src/components/layout/sidebar.tsx` and `mobile-nav.tsx`.
RLS policies enforce actual access; UI filtering is cosmetic only.
