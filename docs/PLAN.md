# BuildStream CRM — Phased Build Plan

> **SPEC:** Save the full functional spec to `docs/SPEC.md` before starting Phase 1.
> Each phase reads only the spec sections listed below — never the whole file.

---

## Phase 0 — Bootstrap ✅
**Spec sections:** §2 (stack), §5 (routes), §7 (auth/RLS overview)

- [x] Next.js 16 + Tailwind v4 + shadcn/ui scaffolded
- [x] Supabase packages installed (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] TanStack Query installed
- [x] `src/lib/supabase/client.ts` + `server.ts`
- [x] `src/lib/query-client.ts`
- [x] `src/middleware.ts` — route protection + auth refresh
- [x] `src/app/(auth)/login` + `register` stubs
- [x] `src/app/(protected)/layout.tsx` — AppLayout (Sidebar + Topbar)
- [x] `src/components/layout/sidebar.tsx` — role-filtered nav
- [x] `src/components/layout/mobile-nav.tsx` — sheet drawer
- [x] `src/components/layout/topbar.tsx` — user avatar + sign out
- [x] Folder structure: `components/{calendar,field,jobs,quotes,invoices,fleet,shared}`
- [x] `supabase/migrations/` directory
- [x] `.env.local.example` updated to Supabase vars
- [x] `CLAUDE.md` written
- [x] `docs/PLAN.md` written (this file)
- [x] Mongoose models from previous iteration left in `src/models/` as Phase 1 reference — convert to Zod + SQL
- [x] Committed: `chore: bootstrap Next.js + Supabase skeleton and build plan`

---

## Phase 1 — Full data model
**Spec sections:** §3 (entities), §4 (relationships)

Split into 3 batches (~12 entities each) to stay within context budget.

**Tables in scope (batch A — core):**
users, companies, customers, leads, services, quotes, quote_items, jobs, job_items, invoices

**Tables in scope (batch B — field/ops):**
job_completions, job_arrivals, job_checklists, materials, attendance, vehicles, job_bids,
extra_work_requests, reschedule_requests, contractors, subcontractors

**Tables in scope (batch C — comms/admin):**
internal_chats, messages, job_chats, job_messages, email_sequences, sequence_email_logs,
alerts, audit_logs, commission_settings, bonus_settings, operative_bonuses, prize_settings,
receipts, feedbacks, integration_connections, website_domains, invited_users, signup_requests,
staff_messages, company_settings

**Checklist:**
- [x] No `docs/SPEC.md` yet — used `src/models/_mongoose-reference/` (prior iteration's Mongoose schemas) as the entity source of truth instead
- [x] 12 SQL migrations in `supabase/migrations/`: enums, functions/triggers, users, core CRM, quotes/invoices, jobs, fleet/attendance, contractors, job-related, comms, admin, RLS
- [x] Zod schemas for all 36 entities in `src/lib/schemas/` (common, users, customers, leads, services, quotes, invoices, jobs, job-related, contractors, fleet, comms, admin)
- [x] RLS policies for all tables — role-based (admin/user/operative/sales/telesales/contractor), single-tenant (no company_id needed)
- [x] `src/lib/schemas/index.ts` barrel export
- [x] Deleted `src/models/` (Mongoose reference no longer needed)
- [ ] Run `npx supabase db push` against a real Supabase project (not yet provisioned — user needs to create one and add `.env.local`)
- [x] Commit: `feat: full data model — Supabase migrations + Zod schemas`

**Note:** When `docs/SPEC.md` is eventually provided, diff it against the migrations/schemas here — they were built from the prior MongoDB iteration's models, which may have drifted from the canonical Base44 spec.

---

## Phase 2 — Auth + roles
**Spec sections:** §5.1 (auth routes), §7 (roles + permissions)

- [ ] Login page (email/password + Google OAuth)
- [ ] Register page + email verification
- [ ] OTP / magic link flow
- [ ] Contractor onboarding redirect (incomplete profile → `/onboarding`)
- [ ] Route guard: role-based redirect (operative → field-only pages)
- [ ] `supabase/migrations/` — auth trigger to insert `users` row on signup
- [ ] Commit

---

## Phase 3 — Core CRM CRUD
**Spec sections:** §3.2–3.4 (customers, leads, services), §3.8 (quotes), §6.1 (quote builder)

- [ ] Customers: list, create, edit, detail pages
- [ ] Leads: list, pipeline view, status update, convert to customer
- [ ] Services: admin CRUD
- [ ] Quotes: list, QuoteBuilder (line items, discounts, PDF preview), send to customer
- [ ] Commit

---

## Phase 4 — Jobs + scheduling
**Spec sections:** §3.5 (jobs), §6.3 (calendar), §6.10 (booking flow)

- [ ] JobCalendar (react-leaflet for address, date picker, assign operative)
- [ ] Job list + status lifecycle (scheduled → in-progress → complete → invoiced)
- [ ] Booking form
- [ ] Reschedule flow + approval
- [ ] Commit

---

## Phase 5 — Invoicing
**Spec sections:** §3.7 (invoices), §6.6 (invoice actions)

- [ ] Invoice list + create from job
- [ ] PDF generation (jsPDF)
- [ ] Mark paid / partial payment
- [ ] Credit notes
- [ ] Commit

---

## Phase 6 — Field App
**Spec sections:** §3.5–3.6 (job + checklist), §3.24 (field ops)

- [ ] GPS check-in (Geolocation API → store in `job_arrivals`)
- [ ] Checklists per job
- [ ] Materials used logging
- [ ] Job completion + signature capture
- [ ] Photo/video upload to Supabase Storage
- [ ] Attendance logging
- [ ] Commit

---

## Phase 7 — Contractors + subcontractors
**Spec sections:** §3.10–3.12 (profiles), §3.19 (bidding), §6.11 (extra-work workflow)

- [ ] Contractor profiles + onboarding
- [ ] Bid workflow (post job → bids → accept/reject)
- [ ] Extra work request flow
- [ ] Subcontractor management
- [ ] Commit

---

## Phase 8 — Public tokenized pages
**Spec sections:** §5.1 (public routes), §6.12 (portals)

- [ ] Quote view (public, token-gated)
- [ ] Completion sign-off (public)
- [ ] Job messaging (public thread)
- [ ] Customer feedback form
- [ ] Customer portal
- [ ] Commit

---

## Phase 9 — Fleet / GPS tracking
**Spec sections:** §3.9 (vehicles), §3.20 (tracking), §6.5 (live map)

- [ ] Vehicle CRUD
- [ ] Live GPS map (react-leaflet, Supabase Realtime)
- [ ] Proximity detection + arrival alert
- [ ] Commit

---

## Phase 10 — Email/SMS + automations
**Spec sections:** §6.2, §6.4, §6.7–6.9, §6.14–6.17, §9

- [ ] Resend integration (transactional emails)
- [ ] Twilio SMS
- [ ] Email sequences + drip scheduler (Supabase Edge Function + pg_cron)
- [ ] Reminder automations
- [ ] Webhook handlers
- [ ] Commit

---

## Phase 11 — AI telesales agent
**Spec sections:** §8

- [ ] Business-hours-aware chatbot
- [ ] Anthropic SDK integration
- [ ] Lead capture from chat
- [ ] Commit

---

## Phase 12 — Dashboards + extras
**Spec sections:** §3.25–3.36, §5.2

- [ ] KPI dashboards (recharts)
- [ ] Commission + bonus calculation
- [ ] Gamification / leaderboard
- [ ] Audit log viewer
- [ ] Marketing tools
- [ ] Admin settings
- [ ] Commit
