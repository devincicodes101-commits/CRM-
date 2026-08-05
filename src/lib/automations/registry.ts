import type { CronJob } from "./types";
import {
  quoteDiscountReminder,
  processDailyThankYouEmails,
  send24HourJobReminder,
  overdueInvoiceReminder,
  chaseCommissionInvoices,
  chaseContractorCommissions,
  newLeadSequenceRunner,
  quoteNotBookedRunner,
  invoiceNotPaidRunner,
  resolveAuctionsSweep,
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
  "new-lead-sequence": {
    name: "newLeadSequenceRunner",
    schedule: "0 9 * * *",
    run: newLeadSequenceRunner,
  },
  "quote-not-booked-sequence": {
    name: "quoteNotBookedRunner",
    schedule: "0 11 * * *",
    run: quoteNotBookedRunner,
  },
  "invoice-not-paid-sequence": {
    name: "invoiceNotPaidRunner",
    schedule: "0 12 * * *",
    run: invoiceNotPaidRunner,
  },
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
  "overdue-invoice-reminder": {
    name: "sendOverdueInvoiceReminder",
    schedule: "0 3 * * *",
    run: overdueInvoiceReminder,
  },
  "commission-chaser": {
    name: "chaseCommissionInvoices",
    schedule: "0 4 * * *",
    run: chaseCommissionInvoices,
  },
  "contractor-commission-chaser": {
    name: "chaseContractorCommissions",
    schedule: "0 8 * * *",
    run: chaseContractorCommissions,
  },
  "monthly-commissions": stub("processMonthlyCommissions", "0 1 30 * *"),

  // ── Auctions ──────────────────────────────────────────────
  // Hobby plan caps crons at once/day; the auction sweep is only a backstop
  // (resolve-on-load + per-bid expiry handle live auctions). Upgrade to Pro +
  // a sub-minute schedule for hands-off live auctions.
  "resolve-auctions": {
    name: "resolveAuctionsSweep",
    schedule: "0 6 * * *",
    run: resolveAuctionsSweep,
  },

  // ── Staff engagement ──────────────────────────────────────
  "motivational-quote": stub("sendMotivationalQuote", "0 8 * * 1-5"),
  "friday-spin-notification": stub("sendFridaySpinNotification", "0 7 * * 5"),
};
