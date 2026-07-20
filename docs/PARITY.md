# Base44 → Next.js Parity Tracker

Single source of truth for replicating the Base44 BuildStream CRM into this
Next.js + Supabase app. Update the Status column as work lands.

**Status key:** ✅ done · 🟡 partial · ⬜ not started · 🔩 stub/harness ready

**Architecture decisions (locked):**
- Scheduled automations → **Vercel Cron** → `/api/cron/<slug>` (dispatcher in
  `src/app/api/cron/[job]/route.ts`, registry in `src/lib/automations/registry.ts`).
- Entity-triggered automations → **inline fire-and-forget** via
  `runAutomation()` (`src/lib/automations/run.ts`), dispatchers in
  `src/lib/automations/triggers.ts`, called from server actions after the write.
- AI image/video (`Core.GenerateImage/Video`) → **stubbed** (manual upload only).
- Email = Resend (`src/lib/email.ts`) · SMS = Twilio (`src/lib/sms.ts`) ·
  files = Supabase Storage (`src/lib/storage.ts`) · AI text = Anthropic SDK.

---

## Foundation (done this pass)

| Item | Status | Notes |
|---|---|---|
| Security migration (`20260714000001_security_hardening.sql`) | ✅ | search_path pinned; role-escalation trigger; quote `public_token`; staff-only writes on quotes/invoices/messages; audit_logs locked to service-role |
| Register role no longer self-assignable | ✅ | App clamp + DB trigger clamp (only `user`/`contractor`) |
| Public quote flow uses random token + service client | ✅ | Fixes IDOR + broken-under-RLS anon reads |
| Cron harness (dispatcher + registry + vercel.json + secret) | ✅ | 14 schedules wired; job bodies are 🔩 stubs |
| Entity-trigger pattern + email/SMS/storage libs | ✅ | Trigger bodies are 🔩 stubs |
| `.env.example` | ✅ | |
| **Run migrations on a real Supabase project** | ⬜ | **Blocker for everything** — needs a provisioned project + `.env.local` |
| Contractor/operative read-scoping (RLS) | ⬜ | Deliberate follow-up — see TODO in security migration |
| Storage buckets (logos/job-photos/signatures/certificates/receipts) | ⬜ | Create + RLS |
| Auth: forgot/reset password, OTP, Google OAuth wiring, customer login | ⬜ | |

---

## Pages / modules

| Base44 page | Route in repo | Status |
|---|---|---|
| Dashboard | `/dashboard` | ✅ full Base44 parity |
| Leads | `/leads` | 🟡 CRUD + new-lead alert automation ✅ |
| Quotes + builder | `/quotes` | 🟡 CRUD + quote→customer + send-email ✅ |
| Customers | `/customers` | 🟡 |
| Jobs / Calendar | `/jobs` | 🟡 |
| Invoices | `/invoices` | 🟡 |
| Services | `/services` | 🟡 |
| Field App | `/field` | 🟡 |
| Fleet | `/fleet` | 🟡 |
| Contractors / subcontractors / bidding | `/contractors` | 🟡 |
| Comms (internal chat, sequences) | `/comms` | 🟡 |
| Settings (team, bonus, integrations, audit) | `/settings/*` | 🟡 |
| Public: quote / completion / feedback / reschedule | `/(public)/*` | 🟡 (quote hardened ✅) |
| Telesales AI agent | — | ⬜ |
| High-value commercial | — | ⬜ |
| Spin wheel | — | ⬜ |
| Marketing dashboard | — | ⬜ |
| Customer portal + customer login | — | ⬜ |
| Service templates / video templates | — | ⬜ |
| AI tools (pricing, RAMS, survey, docs) | — | ⬜ |
| Commission dashboard + commission invoices | — | ⬜ |
| CRM inbox / staff mailbox / website chat | — | ⬜ |
| SEO / CMS / bulk management / team output | — | ⬜ |
| Reminders view · website domains | — | ⬜ |

---

## Scheduled automations (Vercel Cron)

All registered in `registry.ts` + `vercel.json` as 🔩 stubs — port by replacing each `run` body.

| Slug | Base44 fn | Schedule | Status |
|---|---|---|---|
| quote-discount-reminder | quoteDiscountReminder | 0 10 * * * | ✅ |
| new-lead-sequence | newLeadSequenceRunner | 0 9 * * * | ✅ |
| job-reminder-24h | send24HourJobReminder | 0 1 * * * | ✅ |
| thank-you-emails | processDailyThankYouEmails | 0 10 * * * | ✅ |
| overdue-invoice-reminder | sendOverdueInvoiceReminder | 0 3 * * * | ✅ |
| commission-chaser | chaseCommissionInvoices | 0 4 * * * | ✅ |
| quote-followup-1day | quoteFollowupReminder1Day | 0 2 * * * | 🔩 |
| high-value-commercial-reminder | highValueCommercialReminder | 0 2 * * 1 | 🔩 |
| operative-job-summary-am/pm | sendOperativeJobSummary | 0 5 / 45 16 * * * | 🔩 |
| invoiced-job-reminder | sendInvoicedJobReminder | 0 2 * * * | 🔩 |
| monthly-commissions | processMonthlyCommissions | 0 1 30 * * | 🔩 |
| motivational-quote | sendMotivationalQuote | 0 8 * * 1-5 | 🔩 |
| friday-spin-notification | sendFridaySpinNotification | 0 7 * * 5 | 🔩 |

**Triggers done:** onLeadCreated (SMS+alert) · onQuoteCreated (customer) ·
onFeedbackCreated (low-rating alert, DB-only) · onInvoicePaid (receipt) ·
onJobCreated (booking confirmation). Remaining trigger dispatchers
(onJobArrivalCreated, onJobChatCreated) await their source features being built.

> ⚠️ **Vercel plan limit:** Hobby allows only a couple of cron jobs at daily
> granularity. This full set needs **Vercel Pro**, or consolidate several jobs
> behind one dispatcher slug that runs multiple tasks.
> Base44 also had `proximityNotification` / `sendInvoiceAfterArrival` /
> `initializeUserPermissions` on **every-5-min** schedules — Vercel Cron can't do
> sub-daily on Hobby; revisit (QStash / external scheduler) when those are ported.

---

## Entity-triggered automations (inline)

Dispatchers in `triggers.ts` as 🔩 stubs — call from the matching server action, then fill the body.

| Dispatcher | Base44 automation(s) | Fires from | Status |
|---|---|---|---|
| onJobCreated | syncJobToFieldApp, inviteContractorsForJob | jobs/actions create | 🔩 |
| onJobUpdated | sendJobBookingConfirmation | jobs/actions update | 🔩 |
| onQuoteCreated | createCustomerFromQuote | quotes/actions create | 🔩 |
| onLeadCreated | notifyTelesalesNewLead | leads/actions create | 🔩 |
| onInvoiceUpdated | sendInvoiceReceipt | invoices/actions update | 🔩 |
| onFeedbackCreated | handleLowRatingAlert | feedback action | 🔩 |
| onJobArrivalCreated | sendArrivalNotification | field arrival | 🔩 |
| onJobChatCreated | notifyJobChatMessage | job chat send | 🔩 |
| onServiceCreated | autoGenerateServicePreview (AI stubbed) | services/actions create | 🔩 |

Remaining Base44 backend functions (manual-trigger: PDF gen, gmail, auctions,
GDPR, address lookup, etc.) are ported as server actions/route handlers per
module — track them under each module as they land.
