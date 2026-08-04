# BuildStream CRM — What's Been Built

_Status record for the Base44 → Next.js rebuild. Last updated 2026-08-04._

The full Base44 "Asbestos UK Teams" CRM has been rebuilt in Next.js 16 + Supabase
and deployed on Vercel. Every page and core business flow is live. This document
is the running record of what's done, what's left, and what needs an account/key.

---

## ✅ Core CRM — complete & verified
Every Base44 sidebar page rebuilt and click-through tested live:
Dashboard · Customers · Leads · Quotes · High-Value Commercial · Services · Jobs
(+ full drag-drop calendar) · Invoices · Field app · Fleet · Contractors &
Subcontractors · Comms / Email Sequences · Commissions & Commission Tracking ·
Marketing · Performance · Team Output · Reminders · Templates · Analytics ·
Audit Log · Spin Wheel · Alerts · Staff Mailbox · Bulk Management · Admin ·
Settings.

**Public (no-login) customer pages:** online quote (accept/decline) · customer
portal · job messaging · reschedule · feedback · completion sign-off · website
chat · subcontractor registration.

## ✅ Feature rounds shipped (post-QA)
- **Quote → booking flow** — branded inline quote email + geo date-picker that
  auto-books the job and sends confirmation / reschedule / photo emails.
- **Branded invoice email** with bank details + terms; real **Credit Note**;
  **convert quote → invoice**; **Service Templates** (reusable quote bundles).
- **Book Job dropdowns** (services / operative / vehicle / contractor); 12 real
  services seeded.
- **Calendar dashboard** — status KPI cards, period/operative filters, **Route
  Optimiser** + **Distance Calculator**, contractor colour-coding.
- **Field app** — site photo upload, auto-filled checklist, **Extra Work
  Requests** (request → office approve/reject), **Certificate of Completion**
  with on-screen customer signature, and **offline mode** (works with no signal,
  syncs on reconnect; installable PWA).
- **Realtime live updates** — CRM Inbox, job chat, jobs & leads lists update
  without refresh.
- **Postcode → address lookup** (getukaddress) on job/customer/quote forms.
- **Forgot / Reset password**; **GDPR data export** (per customer).
- **Contractor coverage matching** library (radius / postcode / national).

## ⏳ Built but dormant — need a key (no build work left)
- **AI Tools** (RAMS, survey summary, pricing) + **AI Telesales Agent** — need
  an Anthropic API key.
- **Address lookup** — needs the getukaddress key (being added).

## 🔴 Optional — need an external account (client decision, not code gaps)
- **Gmail inbox sync** — needs Google OAuth setup.
- **Stripe card payments** — payments are recorded manually today (bank transfer).
- **AI image/video previews & Video Templates** — need an AI-media provider.

## 🗺️ In progress — Base44 contractor/auction round (see BASE44_CHANGES_TO_PORT.md)
A further 21-item wave of contractor features is being ported in batches:
- **Batch 1 (done):** coverage matching, contractor calendar colours, View
  Quotation button.
- **Batch 2 (next):** three-way job assignment, live auction + bidding, contractor
  bid invites, smart-assign picker, assignment emails.
- **Batch 3:** white-label PDF invoicing, invoice mode, 50% deposit, reviews +
  portal downloads, customer self-reschedule.
- **Batch 4:** expanded reports, AI-agent lead capture, email bounce handling,
  job-creation lock-down, cross-cutting fixes.

---

_Authoritative record of code changes is the git history (`git log`). This file
summarises status for non-technical readers._
