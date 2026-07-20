import type { CronJob } from "./types";
import {
  quoteDiscountReminder,
  processDailyThankYouEmails,
  send24HourJobReminder,
} from "./scheduled";

// Registry of scheduled automations, keyed by the URL slug used at
// /api/cron/<slug>. The schedule strings here MUST match vercel.json.
//
// Jobs with a real `run` are ported; `stub(...)` ones still map 1:1 to a Base44
// scheduled function (see docs/PARITY.md) and are filled in as each lands.

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
  "quote-discount-reminder": {
    name: "quoteDiscountReminder",
    schedule: "0 10 * * *",
    run: quoteDiscountReminder,
  },
  "new-lead-sequence": stub("newLeadSequenceRunner", "0 9 * * *"),
  "high-value-commercial-reminder": stub("highValueCommercialReminder", "0 2 * * 1"),

  // ── Jobs / field ──────────────────────────────────────────
  "job-reminder-24h": {
    name: "send24HourJobReminder",
    schedule: "0 1 * * *",
    run: send24HourJobReminder,
  },
  "operative-job-summary-am": stub("sendOperativeJobSummary", "0 5 * * *"),
  "operative-job-summary-pm": stub("sendOperativeJobSummary", "45 16 * * *"),
  "thank-you-emails": {
    name: "processDailyThankYouEmails",
    schedule: "0 10 * * *",
    run: processDailyThankYouEmails,
  },
  "invoiced-job-reminder": stub("sendInvoicedJobReminder", "0 2 * * *"),

  // ── Invoicing / commission ────────────────────────────────
  "overdue-invoice-reminder": stub("sendOverdueInvoiceReminder", "0 3 * * *"),
  "commission-chaser": stub("chaseCommissionInvoices", "0 4 * * *"),
  "monthly-commissions": stub("processMonthlyCommissions", "0 1 30 * *"),

  // ── Staff engagement ──────────────────────────────────────
  "motivational-quote": stub("sendMotivationalQuote", "0 8 * * 1-5"),
  "friday-spin-notification": stub("sendFridaySpinNotification", "0 7 * * 5"),
};
