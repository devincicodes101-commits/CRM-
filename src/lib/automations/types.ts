// Shared automation types.
//
// Base44 gave us two automation kinds; we reproduce both:
//   1. Scheduled  → Vercel Cron hits /api/cron/<job>, which runs a CronJob.
//   2. Triggered  → runAutomation() fires inline (fire-and-forget) from a
//      server action after a successful DB write, via next/server `after`.

export type AutomationResult =
  | { ok: true; detail?: string }
  | { ok: false; error: string };

export type CronJob = {
  /** Human-readable name (matches the Base44 function it replaces). */
  name: string;
  /** Cron expression — documentation only; the real schedule lives in vercel.json. */
  schedule: string;
  run: () => Promise<AutomationResult>;
};
