import type { CronJob } from "./types";

// Registry of scheduled automations, keyed by the URL slug used at
// /api/cron/<slug>. The schedule strings here MUST match vercel.json.
//
// Each `run` is currently a STUB that maps 1:1 to a Base44 scheduled function
// (see docs/PARITY.md). Port them one at a time by replacing the stub body —
// the harness (auth, dispatch, error handling, logging) is already done.

function stub(name: string, schedule: string): CronJob {
  return {
    name,
    schedule,
    run: async () => ({ ok: true, detail: `stub — ${name} not yet ported` }),
  };
}

export const CRON_JOBS: Record<string, CronJob> = {
  // ── Sales / quotes ────────────────────────────────────────
  "quote-followup-1day": stub("quoteFollowupReminder1Day", "0 2 * * *"),
  "quote-discount-reminder": stub("quoteDiscountReminder", "0 10 * * *"),
  "new-lead-sequence": stub("newLeadSequenceRunner", "0 9 * * *"),
  "high-value-commercial-reminder": stub("highValueCommercialReminder", "0 2 * * 1"),

  // ── Jobs / field ──────────────────────────────────────────
  "job-reminder-24h": stub("send24HourJobReminder", "0 1 * * *"),
  "operative-job-summary-am": stub("sendOperativeJobSummary", "0 5 * * *"),
  "operative-job-summary-pm": stub("sendOperativeJobSummary", "45 16 * * *"),
  "thank-you-emails": stub("processDailyThankYouEmails", "0 10 * * *"),
  "invoiced-job-reminder": stub("sendInvoicedJobReminder", "0 2 * * *"),

  // ── Invoicing / commission ────────────────────────────────
  "overdue-invoice-reminder": stub("sendOverdueInvoiceReminder", "0 3 * * *"),
  "commission-chaser": stub("chaseCommissionInvoices", "0 4 * * *"),
  "monthly-commissions": stub("processMonthlyCommissions", "0 1 30 * *"),

  // ── Staff engagement ──────────────────────────────────────
  "motivational-quote": stub("sendMotivationalQuote", "0 8 * * 1-5"),
  "friday-spin-notification": stub("sendFridaySpinNotification", "0 7 * * 5"),
};
