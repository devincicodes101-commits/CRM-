# Base44 → Next.js Port — Changes to Replicate (last ~10 days, to 2026-08-04)

Everything below was built/fixed on the **live Base44 CRM** (crmazzy.com, "Asbestos UK Teams Ltd") after the point the Next.js parity (`PARITY.md`, migrations up to `20260725*`) captured. Port each into this repo using the stack conventions in `CLAUDE.md`.

## Base44 → this stack mapping (apply throughout)
| Base44 | This repo |
|---|---|
| Entity (`.jsonc`) | Supabase table (`supabase/migrations/*.sql`) + type in `src/types/` + Zod in `src/lib/schemas/` |
| Backend function (`functions/*/entry.ts`) called from UI | **Server Action** (`app/(protected)/<f>/actions.ts`) |
| Backend function on a schedule / webhook | **Edge Function** (`supabase/functions/<name>/index.ts`) + Vercel Cron (`vercel.json`) |
| `base44.entities.X.create/update/filter` | Supabase client query (browser or `server.ts`) |
| `base44.asServiceRole...` | `createServiceClient()` (server-only, bypasses RLS) |
| `Core.InvokeLLM` | Anthropic SDK |
| `Core.UploadFile` | Supabase Storage bucket + signed URL |
| Resend send | Resend (same) |
| Entity RLS in `.jsonc` | RLS policy in a migration |
| Tokenized public page (`message_token`) | Public route `app/(public)/<x>/[token]/page.tsx` + service-role read verifying the token |

Every new table: `id uuid`, `created_date`, `updated_date`, `created_by_id`. Enable RLS. Mirror enum values **exactly**.

---

## 1. Contractor coverage area + job→contractor matching
**Table `contractors` — add:**
- `coverage_mode` enum `'radius' | 'postcodes' | 'national'`
- `base_postcode text`, `coverage_radius_miles numeric`, `coverage_postcodes text[]`
- (already present from earlier: `licence_type 'licenced'|'non_licenced'`, insurance/licence doc + expiry fields, `logo_url`, bank fields, `registration_completed`, `suspended*`)

**Coverage helper** (`src/lib/coverage.ts`) — `checkCoverage(contractor, jobPostcode) => { covers, distanceMiles, mode }`:
- `national` → always `{ covers: true }`.
- `radius` → geocode both postcodes (postcodes.io), Haversine distance ≤ `coverage_radius_miles`.
- `postcodes` → match the **outward code / district** of the job postcode against `coverage_postcodes` (e.g. job `LS1 4DY` → district `LS1`/`LS` vs list).
- Missing postcode → not matched (graceful, never throw).
- `getCoveringContractors(jobPostcode)` → filter all contractors through `checkCoverage`.

**UI:** Coverage Area section in the contractor onboarding form (`ContractorProfileForm`): 3 toggle buttons Radius / Postcode districts / National; show only the relevant input per mode.

---

## 2. Three-way "Book a job" assignment (from a quote)
When booking a job from a **quote**, the staff picks ONE of three modes in an `AssignmentSelector` inside the booking panel (`BookJobPanel`). **Gotcha we hit:** the quote page's "Book Job" originally opened a *date-only* picker (`CustomerBookingPanel`) that never mounted `AssignmentSelector` — so the Auction/Contractor tabs were unreachable. Make sure the quote page's **"Book Job in Diary"** button opens the panel that contains the 3-way selector.

- **Operative** → sets `jobs.assigned_team` (internal, hourly, no %).
- **Contractor** → dropdown filtered to `getCoveringContractors(jobPostcode)` (national always shown); on select reveal a **"% of job value paid to contractor"** number field → store `jobs.contractor_pay_percent`; on confirm stamp `assigned_contractor_id`+`assigned_contractor_user_id`, `contractor_acceptance='pending'`, then send the assignment email (§7).
- **Auction** → see §3.
- Warn (don't block) if no covering contractors: *"No contractors cover this area — an auction would have no bidders."*

---

## 3. Live auction
**Table `jobs` — add:** `auction_status 'live'|'closed'|'no_bids'`, `auction_start_price numeric`, `auction_current_bid numeric`, `auction_ends_at timestamptz`, `auction_winning_bid numeric`, `auction_winning_bidder_id uuid`, `contractor_pay_amount numeric`, `company_share_amount numeric`.
**Table `job_bids` — add:** `bid_amount numeric`, `is_auction_bid boolean`, `bid_time timestamptz` (on top of the invite fields in §4).

**Flow:**
1. Admin sets **Starting Bid (£)** + **Duration (mins, default 5)** in the Auction tab → create job with `auction_status='live'`, `auction_current_bid=start`, `auction_ends_at=now()+duration`, no contractor. Then call invite (§4) for all covering contractors with an "available to bid" email.
2. **Contractor bidding** (`AuctionPanel` in field app): shows current highest bid + a **live countdown**; "Place Bid" only accepts a value **> current**. Server Action `placeAuctionBid`: validate > current, update `auction_current_bid` + `auction_winning_bidder_id`, upsert the contractor's `job_bids` row (`bid_amount`, `is_auction_bid=true`).
3. **Resolution** `resolveAuction`: for a job past `auction_ends_at` and still `'live'` → set `'closed'`, pick highest bid, **assign that contractor** (`acceptance='pending'`), set `contractor_pay_amount = winning_bid`, `company_share_amount = total_value - winning_bid`, notify winner (§7) + "auction closed" to losers. No bids → `'no_bids'`. **Guard against double-resolution.**

**Real-time gotcha (Base44 had no sub-minute cron):** we resolved via **3-sec polling** on both the contractor panel and the office Bids tab, **plus** call `resolveAuction` when the countdown hits zero on any open screen **AND lazily whenever the job loads** and `now > auction_ends_at`. In this repo you have **Supabase Realtime** — prefer Realtime for live bid updates, but STILL keep a "resolve-on-load" fallback + a Vercel Cron sweep (every 1–2 min) calling `resolveAuction` for expired live auctions, so it closes even if nobody's watching.
**Notifications** = email + in-app only (no native push/SMS unless Twilio wired).

---

## 4. Contractor bid invites — automatic + manual
**Table `job_bids`:** `job_id`, `contractor_id`, `contractor_user_id`, `contractor_name`, `contractor_email`, `status 'invited'|'interested'|'declined'`, `note`, `proposed_price`, `proposed_dates`, `invited_date`, `responded_date` (+ auction fields §3). **RLS:** contractor can read/update **only their own** bids (`contractor_user_id = auth.uid()`); admin full.

**`inviteContractorsForJob(job_id, contractor_ids?)`** (Server Action + reused by auction):
- No `contractor_ids` → **automatic**: invite all `getCoveringContractors(jobPostcode)`.
- With `contractor_ids` → **manual**: invite exactly those, **skip the coverage check** (manual override) but still apply the **licence filter** (for `requires_licence` jobs only invite licenced contractors).
- For each: create a `'invited'` `job_bids` row (dedupe — never a 2nd invite per contractor per job) + branded email + in-app notice with a deep link into the field app.
- Auto-fire on booking when no contractor is pre-assigned.

**UI — office Bids tab (`JobBidsPanel`):** two buttons **"Auto-Invite (All Covering)"** and **"Invite Specific"** (searchable contractor picker with badges: *Covers this area / Outside coverage area / Already invited*, licenced-only for licenced jobs). Lists invited/interested with note+price; **Assign** button per interested bid reuses the direct-assign path (→ §7 email).

---

## 5. Field-app subcontractor actions (`jobs` gains: `contractor_acceptance`, `rejection_reason`, `waste_notes text[]`, `customer_paid`, `customer_paid_at`)
On the contractor's field-app job view:
- **Accept / Reject** (only while `contractor_acceptance='pending'`): Reject asks a reason, **clears the contractor assignment** (so office can reassign) and emails the office (must name the **contractor**, not the customer — bug we fixed).
- **Upload Waste Notes** → `waste_notes` (Supabase Storage, same as photos).
- **Generate & Send Invoice** → on-demand white-label invoice (§8), separate from completion.
- **Mark Customer Paid** → sets `customer_paid`, fires commission invoice (§8/§9).
Auction-invited (unassigned) jobs show a **bid panel**, not the accept/complete tools.

---

## 6. Smart-assign picker (`ContractorSmartPicker`)
When assigning a contractor, show cards per contractor: **★ rating** (avg from `reviews`, else "Not rated yet"), **distance** via `checkCoverage`/postcodes.io (else "Area unknown"), **availability** on the job date (busy if they have a non-cancelled job that day), **insurance valid** (green only if ALL relevant expiry dates are future; else red + which expired), **completion %** (completed ÷ assigned). Sort best-first (insurance-valid → available → nearest → highest completion). "Covers this area" badge from coverage.

---

## 7. Assignment-notification email (`notifyContractorAssignment`)
Fires **only when the assigned contractor changes** (compare previous vs new `assigned_contractor_user_id`; skip normal edits). Branded email to the contractor: job title, date/time, customer area, job value, and — when set — **their % / share** (`contractor_pay_percent` → "Your Share" / "Company Share" rows). Deep-links into the field app to that job (e.g. `?highlightJob=<id>`; guard the deep-link effect so it only runs after jobs load — see §21 TDZ note).

---

## 8. White-label invoicing + real PDF + invoice records
- **Branding resolver** `buildBranding(contractor, company)`: if a contractor is assigned, use the contractor's logo/name/address/bank/VAT/terms; else the company's. (Overridden by invoice mode §9.)
- **`generateAndEmailInvoice`** (Server Action): builds the invoice, generates a **real PDF (jsPDF)** with the resolved branding, **attaches the PDF** to the Resend email (keep the HTML body too), **persists an `invoices` row** and **dedupes by `job_id` (+ `invoice_type`)** so re-sends update rather than duplicate. Then fires the commission invoice if a contractor is assigned (unless company-direct §9).
- **`invoices` add:** `job_id`, `assigned_contractor_id`.
- **BILL TO must come from the customer** (`job/quote.customer_*` or the linked customer), **never** the logged-in user / `created_by` / staff. (We traced a "billed to the sales rep" report — it was **data entry** by the rep, not code, but confirm no staff fallback exists.)
- **Bank details are read LIVE from company settings at render time** — no snapshot on the invoice row. (Base44 lesson: an invoice showing "old" bank details was because the settings **save never persisted**, not a cache. Make the settings save show a success/failure toast; re-sync form from server after save.)

---

## 9. Invoice mode switch (white-label vs company-direct)
**`company_settings` add:** `invoice_mode 'white_label' | 'company_direct'` (default `white_label`), plus admin toggle *"Invoice the customer as: The contractor (white-label) / Our company directly (full value)."*
- `white_label` → current behaviour (contractor-branded invoice + AppyLead commission invoice to contractor).
- `company_direct` → customer invoice ALWAYS uses **company** branding + **full value**, regardless of assignment; **do NOT send the commission invoice** (guard in both the invoice fn and the commission fn). Contractor-payout tracking is a separate future item.
> **Client hasn't finally confirmed white-label vs company-direct.** Default to `white_label`; the switch makes it reversible.

---

## 10. 50% deposit invoice
A **"50% Deposit"** button on the accepted quote AND the booked-job dialog. Calls `generateAndEmailInvoice` with `invoice_type='deposit'`, `deposit_percent=50`: bills **50% of `jobs.total_value`** as a single line "50% Booking Fee / Deposit", labels the email/PDF "DEPOSIT INVOICE", persists with `invoice_type='deposit'`, **dedupes by job + invoice_type** (deposit vs standard coexist — one doesn't overwrite the other). Currently **no VAT added on top** (VAT line £0) — *client to confirm if deposit should add 20% VAT.*

---

## 11. Customer portal — download PDF, review, job report (tokenized, no login)
Reuse the job `message_token` public-page pattern.
- **`reviews` table:** `job_id`, `contractor_id`, customer fields, `rating 1-5`, `comment`, `message_token`. Public create/read; admin update/delete. `submitPublicReview` (verify token, dedupe one per job, resolve contractor from job). Reviews feed the picker ★ rating (§6) + a Contractor-Ratings section on Reports.
- **Download Invoice (PDF)** button on the portal → `downloadInvoice` returns `{ pdf: base64, filename }`; supports a `message_token` for no-login access; white-label branding.
- **Job report** — read-only summary (status, work done, photos, completion date, invoice total).

---

## 12. Customer self-reschedule
- **`sendJobBookingConfirmation`**: the customer booking-confirmation email now has a **"Reschedule My Appointment"** button + wording: *"…all appointments are all-day appointments; we cannot guarantee a specific arrival time unless agreed at booking."* Button links to `/reschedule/<message_token>`.
- **`getPublicJobForReschedule(token)`** + **`publicRescheduleJob(token, newDate)`** (public, service-role, verify token; reject completed/cancelled/past): update the job date, send the customer a fresh confirmation, notify office + assigned contractor. Reuse the same geo date-picker used at quote acceptance.
- **Note:** the calendar's direct "quick book" does NOT email the customer — only the quote-book and public-book paths do. Decide if you want the quick-book to also send the confirmation.

---

## 13. Reports expansion (on the analytics/performance page)
Add sections with a shared date-range filter: **Commission earned** (paid vs unpaid), **Outstanding fees** (unpaid/overdue + past-due count), **Jobs per contractor** (+ "Unassigned"), **Jobs per area** (postcode district), **Cancelled jobs** (count + lost value + rate), **Average invoice value**, **Contractor ratings**. Graceful "no data yet" states.

---

## 14. Calendar colour-code by contractor
`src/lib/contractorColors.ts` — **deterministic** colour from contractor id (never random; same contractor = same colour). Tint job blocks in all calendar views by `assigned_contractor_id`; unassigned = neutral/status colour. Add a legend of contractors-with-jobs-in-view. Keep text legible in light/dark.

---

## 15. AI Tools page (`/ai-tools`, admin/staff)
Via Anthropic SDK: **RAMS / Method Statement generator** (from job service/description/site), **Survey summariser** (paste/upload → summary, never invent findings), **Pricing suggester** (service + area/access → indicative range, labelled estimate), **Missing-docs checker** (pure logic: flag missing/expired contractor compliance docs). Show clear "human must review" disclaimer for RAMS/pricing.

---

## 16. Job creation locked to the CRM quote flow
- **Remove job-creation from the field app** entirely (no create/claim for anyone).
- **`jobs` INSERT RLS:** allow only roles `admin, manager, operative, sales, telesales` — **contractor excluded at the DB layer** (Base44's old rule "any logged-in user" let contractors create).
- Keep quote→book, calendar ad-hoc book, and public customer self-book. **Watch:** tightening insert RLS can break public/customer client-side inserts — route public booking through a service-role Server Action / Edge Function.

---

## 17. View Quotation button
On the booked-job dialog, a **"View Quotation"** button shown only when `jobs.quote_id` is set → opens the quote page (new tab).

---

## 18. AI agent = a sales agent → store quote + create lead (REQUESTED, spec only)
Client requirement (build in port): when the **AI telesales agent** sends a quote:
1. Persist the Quote with `sales_agent = 'AI Sales Agent'` so it shows in the admin quotes list.
2. Create a **`leads` row**: `source='AI Sales Agent'`, `status='quoted'`, `estimated_value=quote total`, quote reference, `assigned_to` unassigned, note "AI agent sent a quote — needs follow-up."
3. Leads visible to **all sales reps**; stays live until a rep changes its status (contacted/…). On customer accept/book → move lead to booked/won.

---

## 19. Email deliverability (bounce/complaint) handling
- **`customers.email_status 'valid' | 'bounced' | 'complained'`** (already exists).
- **Resend webhook Edge Function** (`resendWebhook`): on `email.bounced`/`email.complained` → set the matching customer's `email_status` and create an **Alert** (`alert_type='email_bounce'`).
- **Warning banner** component (`EmailUndeliverableWarning`): render on Customer profile, Job dialog, Quote view when `email_status` is `complained`/`bounced` — *"Emails to this customer may not deliver — contact them by phone."* (read-only; never blocks send). App does NOT block sending; **Resend suppresses** the address provider-side, so clearing `email_status` in the DB is not enough — the address must be removed from **Resend's suppression list** too.

---

## 20. Address lookup (getUKAddress) — the bug to NOT reproduce
`lookupAddress` calls `GET https://getukaddress.com/api/v1/autocomplete?query=&api_key=`. **Bug we fixed:** the response body was read **twice** (`await res.json()` for error-check, then again for data) — a Response stream can only be read once, so the 2nd read returned `{}` and every lookup said "No addresses found". **Read the body once, reuse it.** Requires an active getUKAddress **subscription** (per-account) + the key in an env var; surface the real HTTP status (401 bad key / 403 no plan / 429 cap) instead of a generic error.

---

## 21. Cross-cutting fixes / gotchas to bake in
- **Staff/sales invite:** the invite create was passing an **empty required `name`** → the whole invite threw silently (no user, no email). Always derive a name (e.g. from email). Show a clear **"Invite sent ✓ / failed ✗"** toast. Prefer **Google sign-in** for Gmail invitees (avoids single-use reset-token "expired link" issues — never call two single-use token flows in one invite).
- **Automation payload envelope:** Base44 entity-automations deliver `{ event, data, old_data, changed_fields }`, not the bare id the manual caller sends. Any function used **both** as an automation and a manual call must accept both shapes and **skip gracefully** (return success, don't throw) when conditions aren't met — else it "fails" on every trigger. In this repo: Edge Functions triggered by DB webhooks get the row payload; make manual Server Actions and webhook handlers share one normaliser. Fire "just became X" logic on the **transition** (check `changed_fields`/old vs new), e.g. invoice receipt only on unpaid→paid, booking confirmation only on →scheduled.
- **Blank-page TDZ bug (hit ≥3×):** a `const` (e.g. `jobs`) referenced in a hook/dep-array **above** its declaration → `ReferenceError: Cannot access 'X' before initialization` → the whole route renders blank. First thing to suspect on a blank page.
- **Commission monthly job:** creating `operative_bonus` rows failed because `operative_id` (required) wasn't set — look up the user id first; wrap per-item in try/catch so one failure doesn't kill the batch.
- **Publish/refresh discipline (Base44-only, N/A here):** Base44 needed Publish + hard-refresh and backend runs in prod. In this repo that maps to normal deploy; just note the parity source ran against production data.

---

_Source: live Base44 build session through 2026-08-04. Commission engine, payment-tracking/chasing, and the base contractor/portal fields may already be in `PARITY.md`/migrations — diff before adding._
