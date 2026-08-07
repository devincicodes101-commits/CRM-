import type { CronJob } from "./types";
import {
  quoteDiscountReminder,
  processDailyThankYouEmails,
  send24HourJobReminder,
  overdueInvoiceReminder,
  chaseCommissionInvoices,
  chaseContractorCommissions,
  processMonthlyCommissions,
  newLeadSequenceRunner,
  quoteNotBookedRunner,
  invoiceNotPaidRunner,
  resolveAuctionsSweep,
  quoteFollowupReminder1Day,
  highValueCommercialReminder,
  sendOperativeJobSummaryAM,
  sendOperativeJobSummaryPM,
  sendInvoicedJobReminder,
  sendMotivationalQuote,
  sendFridaySpinNotification,
} from "./scheduled";

// Registry of scheduled automations, keyed by the URL slug used at
// /api/cron/<slug>. The schedule strings here MUST match vercel.json.
export const CRON_JOBS: Record<string, CronJob> = {
  // ── Sales / quotes ────────────────────────────────────────
  "quote-followup-1day": { name: "quoteFollowupReminder1Day", schedule: "0 2 * * *", run: quoteFollowupReminder1Day },
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
  "high-value-commercial-reminder": { name: "highValueCommercialReminder", schedule: "0 2 * * 1", run: highValueCommercialReminder },

  // ── Jobs / field ──────────────────────────────────────────
  "job-reminder-24h": {
    name: "send24HourJobReminder",
    schedule: "0 1 * * *",
    run: send24HourJobReminder,
  },
  "operative-job-summary-am": { name: "sendOperativeJobSummaryAM", schedule: "0 5 * * *", run: sendOperativeJobSummaryAM },
  "operative-job-summary-pm": { name: "sendOperativeJobSummaryPM", schedule: "45 16 * * *", run: sendOperativeJobSummaryPM },
  "thank-you-emails": {
    name: "processDailyThankYouEmails",
    schedule: "0 10 * * *",
    run: processDailyThankYouEmails,
  },
  "invoiced-job-reminder": { name: "sendInvoicedJobReminder", schedule: "0 2 * * *", run: sendInvoicedJobReminder },

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
  "monthly-commissions": {
    name: "processMonthlyCommissions",
    schedule: "0 1 30 * *",
    run: processMonthlyCommissions,
  },

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
  "motivational-quote": { name: "sendMotivationalQuote", schedule: "0 8 * * 1-5", run: sendMotivationalQuote },
  "friday-spin-notification": { name: "sendFridaySpinNotification", schedule: "0 7 * * 5", run: sendFridaySpinNotification },
};
