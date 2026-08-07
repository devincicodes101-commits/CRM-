import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "./emails";
import { resolveExpiredAuctions } from "@/lib/auction-resolve";
import type { AutomationResult } from "./types";

const APP_BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";

// ── Email-sequence shared helpers (§1) ───────────────────────────────────────
type SeqType = "new_lead" | "quote_not_booked" | "invoice_not_paid";

// Replace both {{key}} and {key} placeholders.
function applyPlaceholders(text: string, vars: Record<string, string>): string {
  let out = text ?? "";
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v).replaceAll(`{${k}}`, v);
  }
  return out;
}

// Dedup source for the sequence engine — one send per (type, step, related row).
async function sequenceAlreadyLogged(
  supabase: SupabaseClient, sequenceType: SeqType, step: number, relatedId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("sequence_email_logs")
    .select("id")
    .eq("sequence_type", sequenceType)
    .eq("step_number", step)
    .eq("related_id", relatedId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function logSequenceEmail(
  supabase: SupabaseClient,
  entry: {
    sequenceType: SeqType;
    step: number;
    stepLabel?: string | null;
    recipientEmail: string;
    recipientName?: string | null;
    relatedId: string;
    relatedType: "lead" | "quote" | "invoice";
    subject: string;
    resendMessageId?: string | null;
  },
): Promise<void> {
  await supabase.from("sequence_email_logs").insert({
    sequence_type: entry.sequenceType,
    step_number: entry.step,
    step_label: entry.stepLabel ?? null,
    recipient_email: entry.recipientEmail,
    recipient_name: entry.recipientName ?? null,
    related_id: entry.relatedId,
    related_type: entry.relatedType,
    subject: entry.subject,
    sent_date: new Date().toISOString(),
    resend_message_id: entry.resendMessageId ?? null,
  });
}

// §3 — sweep expired-but-still-live auctions and resolve them (assign winner /
// mark no-bids), so an auction closes even if nobody has the screen open.
export async function resolveAuctionsSweep(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  try {
    const r = await resolveExpiredAuctions(supabase);
    return { ok: true, detail: `resolved ${r.resolved} auction(s)` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Scheduled automation bodies. Each runs from /api/cron/<slug> via the service
// client (no user session) and is IDEMPOTENT — it only sends where a "sent" flag
// is still false, and only flips that flag once the email actually succeeds, so
// re-runs never double-send.

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const REMINDER_GAP_DAYS = 3; // don't re-chase the same invoice more often than this

function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString();
}

// Quotes still "sent" and unaccepted after 2+ days → offer a 5% discount (once).
export async function quoteDiscountReminder(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, customer_name, customer_email, total, public_token")
    .eq("status", "sent")
    .eq("discount_email_sent", false)
    .lte("created_date", daysAgoISO(2));
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  for (const q of data ?? []) {
    if (!q.customer_email) continue;
    const res = await sendEmail({
      to: q.customer_email,
      subject: `A little something off quote ${q.quote_number}`,
      html: brandedEmail({
        heading: "Here's 5% off if you book now",
        body: `<p>Hi ${q.customer_name ?? "there"},</p>
          <p>Your quote <strong>${q.quote_number}</strong> (${money(q.total)}) is still open —
          book now and we'll take <strong>5% off</strong>.</p>`,
        cta: { label: "View & accept", url: `${BASE}/quote/${q.public_token}` },
      }),
    });
    if (res.ok) {
      await supabase.from("quotes").update({ discount_email_sent: true }).eq("id", q.id);
      sent++;
    }
  }
  return { ok: true, detail: `discount reminder: ${sent} sent` };
}

// Completed jobs → thank-you email 24h+ after sign-off (once).
export async function processDailyThankYouEmails(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("job_completions")
    .select("id, customer_name, customer_email, job_title")
    .eq("customer_signed_off", true)
    .eq("thank_you_email_sent", false)
    .lte("completed_date", daysAgoISO(1));
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  for (const c of data ?? []) {
    if (!c.customer_email) continue;
    const res = await sendEmail({
      to: c.customer_email,
      subject: "Thank you from the team",
      html: brandedEmail({
        heading: "Thanks for choosing us",
        body: `<p>Hi ${c.customer_name ?? "there"},</p>
          <p>Thank you for letting us complete ${c.job_title ?? "your job"}. It was a pleasure
          working with you — we'd love a review if you have a moment.</p>`,
      }),
    });
    if (res.ok) {
      await supabase.from("job_completions").update({ thank_you_email_sent: true }).eq("id", c.id);
      sent++;
    }
  }
  return { ok: true, detail: `thank-you: ${sent} sent` };
}

// Unpaid invoices past their due date → chase the customer (every few days).
export async function overdueInvoiceReminder(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const nowISO = new Date().toISOString();
  const gapISO = daysAgoISO(REMINDER_GAP_DAYS);

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, customer_email, total, amount_paid, due_date, status, last_reminder_sent")
    .in("status", ["sent", "overdue", "part_paid"])
    .lt("due_date", nowISO);
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  for (const inv of data ?? []) {
    // Flip sent → overdue once it's past due.
    if (inv.status === "sent") {
      await supabase.from("invoices").update({ status: "overdue" }).eq("id", inv.id);
    }
    if (inv.last_reminder_sent && inv.last_reminder_sent > gapISO) continue; // recently chased
    if (!inv.customer_email) continue;

    const outstanding = Number(inv.total ?? 0) - Number(inv.amount_paid ?? 0);
    const res = await sendEmail({
      to: inv.customer_email,
      subject: `Payment reminder — invoice ${inv.invoice_number}`,
      html: brandedEmail({
        heading: "A quick payment reminder",
        body: `<p>Hi ${inv.customer_name ?? "there"},</p>
          <p>Invoice <strong>${inv.invoice_number}</strong> has an outstanding balance of
          <strong>${money(outstanding)}</strong>${inv.due_date ? `, due ${new Date(inv.due_date).toLocaleDateString("en-GB")}` : ""}.</p>
          <p>Please arrange payment at your earliest convenience. Thank you.</p>`,
      }),
    });
    if (res.ok) {
      await supabase.from("invoices").update({ last_reminder_sent: nowISO }).eq("id", inv.id);
      sent++;
    }
  }
  return { ok: true, detail: `overdue reminder: ${sent} sent` };
}

// Sent commission invoices still unpaid → remind the sales agent (every few days).
export async function chaseCommissionInvoices(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const nowISO = new Date().toISOString();
  const gapISO = daysAgoISO(REMINDER_GAP_DAYS);

  const { data, error } = await supabase
    .from("commission_invoices")
    .select("id, invoice_number, sales_agent_name, sales_agent_email, total_due, last_reminder_sent")
    .eq("status", "sent");
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  for (const ci of data ?? []) {
    if (ci.last_reminder_sent && ci.last_reminder_sent > gapISO) continue;
    if (!ci.sales_agent_email) continue;
    const res = await sendEmail({
      to: ci.sales_agent_email,
      subject: `Commission invoice ${ci.invoice_number} still outstanding`,
      html: brandedEmail({
        heading: "Commission invoice reminder",
        body: `<p>Hi ${ci.sales_agent_name ?? "there"},</p>
          <p>Commission invoice <strong>${ci.invoice_number}</strong> for
          <strong>${money(ci.total_due)}</strong> is still marked unpaid.</p>`,
      }),
    });
    if (res.ok) {
      await supabase.from("commission_invoices").update({ last_reminder_sent: nowISO }).eq("id", ci.id);
      sent++;
    }
  }
  return { ok: true, detail: `commission chase: ${sent} sent` };
}

// §5 — chase unpaid CONTRACTOR (AppyLead agency-fee) commission invoices:
// friendly@2d, second@5d, final@7d, and SUSPEND the contractor@14d. Tracks which
// stages have fired per invoice via reminder_stages_sent; one stage per run.
const CONTRACTOR_CHASE_STAGES = [
  { stage: 1, day: 2, label: "reminder", suspend: false },
  { stage: 2, day: 5, label: "second reminder", suspend: false },
  { stage: 3, day: 7, label: "final reminder", suspend: false },
  { stage: 4, day: 14, label: "suspension", suspend: true },
] as const;

export async function chaseContractorCommissions(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const now = Date.now();

  const { data: settings } = await supabase
    .from("company_settings").select("email").limit(1).maybeSingle<{ email: string | null }>();
  const adminEmail = settings?.email ?? null;

  const { data: invoices } = await supabase
    .from("contractor_commission_invoices")
    .select("id, invoice_number, contractor_id, contractor_name, contractor_email, total_due, status, sent_date, created_date, reminder_stages_sent")
    .in("status", ["draft", "sent"]);

  let acted = 0, suspended = 0;
  for (const inv of invoices ?? []) {
    const anchor = new Date(inv.sent_date ?? inv.created_date).getTime();
    const ageDays = (now - anchor) / 86400_000;
    const done: number[] = inv.reminder_stages_sent ?? [];

    for (const s of CONTRACTOR_CHASE_STAGES) {
      if (done.includes(s.stage) || ageDays < s.day) continue;

      if (s.suspend) {
        // Suspend the contractor (once) for the unpaid fee.
        if (inv.contractor_id) {
          await supabase
            .from("contractors")
            .update({
              suspended: true,
              suspended_at: new Date().toISOString(),
              suspension_reason: `Unpaid commission invoice ${inv.invoice_number}`,
            })
            .eq("id", inv.contractor_id)
            .eq("suspended", false);
        }
        await supabase
          .from("contractor_commission_invoices")
          .update({ suspended_contractor: true, reminder_stages_sent: [...done, s.stage] })
          .eq("id", inv.id);
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `⚠️ Contractor suspended — unpaid commission ${inv.invoice_number}`,
            html: brandedEmail({
              heading: "Contractor suspended",
              body: `<p><strong>${inv.contractor_name ?? "A contractor"}</strong> has been suspended for not paying commission invoice <strong>${inv.invoice_number}</strong> (${money(inv.total_due)}), now 14+ days overdue.</p>`,
            }),
          });
        }
        suspended++;
        break;
      }

      if (!inv.contractor_email) { break; }
      const res = await sendEmail({
        to: inv.contractor_email,
        subject: `Commission invoice ${inv.invoice_number} — ${s.label}`,
        html: brandedEmail({
          heading: "Commission payment reminder",
          body: `<p>Hi ${inv.contractor_name ?? "there"},</p>
            <p>Commission invoice <strong>${inv.invoice_number}</strong> for <strong>${money(inv.total_due)}</strong> is still outstanding${s.stage >= 3 ? " and now overdue" : ""}. Please arrange payment to avoid suspension of new job assignments.</p>`,
        }),
      });
      if (res.ok) {
        await supabase
          .from("contractor_commission_invoices")
          .update({ reminder_stages_sent: [...done, s.stage] })
          .eq("id", inv.id);
        acted++;
      }
      break; // one stage per invoice per run
    }
  }
  return { ok: true, detail: `contractor commission: ${acted} chased, ${suspended} suspended` };
}

// §16 — monthly operative bonuses. For each operative, compute this month's
// jobs done / avg rating / attendance %, match the highest-priority bonus tier
// and create a pending operative_bonuses row (deduped per operative + month).
export async function processMonthlyCommissions(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: tiers } = await supabase
    .from("bonus_settings")
    .select("tier_name, min_star_rating, min_jobs_completed, min_attendance_percentage, bonus_amount_gbp, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });
  if (!tiers || tiers.length === 0) return { ok: true, detail: "no active bonus tiers" };

  const [{ data: operatives }, { data: completions }, { data: attendance }] = await Promise.all([
    supabase.from("users").select("id, full_name").eq("role", "operative"),
    supabase.from("job_completions").select("operative_name, star_rating, completed_date")
      .gte("completed_date", monthStart).lte("completed_date", monthEnd),
    supabase.from("attendance").select("operative_id, status, attendance_date")
      .gte("attendance_date", monthStart.slice(0, 10)).lte("attendance_date", monthEnd.slice(0, 10)),
  ]);

  let created = 0;
  for (const op of operatives ?? []) {
    try {
      const mine = (completions ?? []).filter((c) => c.operative_name === op.full_name);
      const jobsDone = mine.length;
      const ratings = mine.map((c) => c.star_rating).filter((r): r is number => r != null);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const att = (attendance ?? []).filter((a) => a.operative_id === op.id);
      const present = att.filter((a) => a.status === "present" || a.status === "late").length;
      const attendancePct = att.length ? (present / att.length) * 100 : 100;

      const tier = tiers.find(
        (t) =>
          avgRating >= Number(t.min_star_rating ?? 0) &&
          jobsDone >= Number(t.min_jobs_completed ?? 0) &&
          attendancePct >= Number(t.min_attendance_percentage ?? 0),
      );
      if (!tier) continue;

      const { data: existing } = await supabase
        .from("operative_bonuses").select("id").eq("operative_id", op.id).eq("month_year", monthYear).maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("operative_bonuses").insert({
        operative_id: op.id,
        operative_name: op.full_name,
        month_year: monthYear,
        base_bonus: tier.bonus_amount_gbp,
        total_bonus: tier.bonus_amount_gbp,
        status: "pending",
        notes: `Tier: ${tier.tier_name ?? "—"} (${jobsDone} jobs, ${avgRating.toFixed(1)}★, ${attendancePct.toFixed(0)}% attendance)`,
      });
      if (!error) created++;
    } catch (e) {
      console.error("[monthlyBonus] operative failed", op.id, e);
    }
  }
  return { ok: true, detail: `monthly bonuses: ${created} created` };
}

// ── §15 field/ops digests & engagement ──────────────────────────────────────
async function officeEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("company_settings").select("email").limit(1).maybeSingle<{ email: string | null }>();
  return data?.email ?? null;
}
async function staffEmails(supabase: SupabaseClient): Promise<{ email: string; full_name: string | null }[]> {
  const { data } = await supabase
    .from("users").select("email, full_name")
    .in("role", ["admin", "user", "sales", "telesales", "operative"]).not("email", "is", null);
  return (data ?? []).filter((u) => u.email) as { email: string; full_name: string | null }[];
}

// Heads-up digest: quotes that went out ~1 day ago and haven't been answered.
export async function quoteFollowupReminder1Day(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const to = await officeEmail(supabase);
  if (!to) return { ok: true, detail: "no office email" };
  const { data } = await supabase
    .from("quotes").select("quote_number, customer_name, total")
    .eq("status", "sent").gte("sent_date", daysAgoISO(2)).lte("sent_date", daysAgoISO(1));
  if (!data?.length) return { ok: true, detail: "none due" };
  const rows = data.map((q) => `<li>${q.quote_number} — ${q.customer_name ?? ""} (${money(q.total)})</li>`).join("");
  const res = await sendEmail({ to, subject: `${data.length} quote(s) awaiting a response`,
    html: brandedEmail({ heading: "Quotes to follow up", body: `<p>These went out yesterday and are still unanswered — worth a call:</p><ul>${rows}</ul>` }) });
  return { ok: true, detail: `quote follow-up: ${data.length}` };
}

// Weekly digest of open high-value commercial quotes.
export async function highValueCommercialReminder(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const to = await officeEmail(supabase);
  if (!to) return { ok: true, detail: "no office email" };
  const { data } = await supabase
    .from("quotes").select("quote_number, customer_name, total, client_type")
    .eq("status", "sent").gte("total", 3000);
  const list = (data ?? []).filter((q) => q.client_type === "commercial");
  if (!list.length) return { ok: true, detail: "none" };
  const rows = list.map((q) => `<li>${q.quote_number} — ${q.customer_name ?? ""} (${money(q.total)})</li>`).join("");
  const res = await sendEmail({ to, subject: `${list.length} high-value commercial quote(s) still open`,
    html: brandedEmail({ heading: "High-value commercial pipeline", body: `<p>These £3,000+ commercial quotes are still awaiting a decision:</p><ul>${rows}</ul>` }) });
  return { ok: true, detail: `high-value: ${list.length}` };
}

async function operativeSummary(dayOffset: number, label: string): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const target = new Date(); target.setDate(target.getDate() + dayOffset);
  const dayStr = target.toISOString().slice(0, 10);
  const { data: ops } = await supabase.from("users").select("full_name, email").eq("role", "operative").not("email", "is", null);
  const { data: jobs } = await supabase
    .from("jobs").select("title, address, start_date, assigned_team, status")
    .gte("start_date", `${dayStr}T00:00:00`).lte("start_date", `${dayStr}T23:59:59`)
    .not("status", "in", '("cancelled","completed")');
  let sent = 0;
  for (const op of ops ?? []) {
    const mine = (jobs ?? []).filter((j) => j.assigned_team === op.full_name);
    if (!mine.length || !op.email) continue;
    const rows = mine.map((j) => `<li><strong>${j.title}</strong>${j.address ? ` — ${j.address}` : ""}</li>`).join("");
    const res = await sendEmail({ to: op.email, subject: `Your jobs for ${label}`,
      html: brandedEmail({ heading: `Your schedule — ${label}`, body: `<p>Hi ${op.full_name ?? "there"}, here's what's on:</p><ul>${rows}</ul>` }) });
    if (res.ok) sent++;
  }
  return { ok: true, detail: `operative summary (${label}): ${sent} sent` };
}
export const sendOperativeJobSummaryAM = () => operativeSummary(0, "today");
export const sendOperativeJobSummaryPM = () => operativeSummary(1, "tomorrow");

// Chase digest for jobs invoiced 3+ days ago that still aren't paid.
export async function sendInvoicedJobReminder(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const to = await officeEmail(supabase);
  if (!to) return { ok: true, detail: "no office email" };
  const { data } = await supabase
    .from("jobs").select("title, customer_name, total_value, updated_date")
    .eq("status", "invoiced").lte("updated_date", daysAgoISO(3));
  if (!data?.length) return { ok: true, detail: "none" };
  const rows = data.map((j) => `<li>${j.title} — ${j.customer_name ?? ""} (${money(j.total_value)})</li>`).join("");
  const res = await sendEmail({ to, subject: `${data.length} invoiced job(s) awaiting payment`,
    html: brandedEmail({ heading: "Invoiced but unpaid", body: `<p>These jobs were invoiced 3+ days ago and haven't been marked paid:</p><ul>${rows}</ul>` }) });
  return { ok: true, detail: `invoiced reminder: ${data.length}` };
}

const MOTIVATION = [
  "Great work starts before the first cup of coffee — let's make today count.",
  "Every job done well is another happy customer and another referral.",
  "Small wins stack up. Keep the momentum going.",
  "Safety first, quality always — you've got this.",
  "The best teams show up for each other. Thanks for being one of them.",
];
export async function sendMotivationalQuote(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const staff = await staffEmails(supabase);
  if (!staff.length) return { ok: true, detail: "no staff" };
  const line = MOTIVATION[new Date().getDate() % MOTIVATION.length];
  let sent = 0;
  for (const u of staff) {
    const res = await sendEmail({ to: u.email, subject: "A little Monday motivation ☀️",
      html: brandedEmail({ heading: "Good morning!", body: `<p>${line}</p>` }) });
    if (res.ok) sent++;
  }
  return { ok: true, detail: `motivation: ${sent} sent` };
}

// Friday: let staff know the spin wheel is live.
export async function sendFridaySpinNotification(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const staff = await staffEmails(supabase);
  if (!staff.length) return { ok: true, detail: "no staff" };
  let sent = 0;
  for (const u of staff) {
    const res = await sendEmail({ to: u.email, subject: "🎡 Friday Spin is live!",
      html: brandedEmail({ heading: "It's spin day!", body: `<p>Hi ${u.full_name ?? "there"} — the Friday prize wheel is open. Give it a spin and see what you win.</p>`,
        cta: { label: "Spin the wheel", url: `${APP_BASE}/spin-wheel` } }) });
    if (res.ok) sent++;
  }
  return { ok: true, detail: `friday spin: ${sent} sent` };
}

// New-lead nurture sequence — sends each configured step once its delay elapses.
export async function newLeadSequenceRunner(): Promise<AutomationResult> {
  const supabase = await createServiceClient();

  const { data: steps } = await supabase
    .from("email_sequences")
    .select("step, delay_days, subject, body, label")
    .eq("sequence_type", "new_lead")
    .eq("is_active", true)
    .order("step");
  if (!steps || steps.length === 0) return { ok: true, detail: "no active new_lead sequence" };

  // Enrolment cutoff: only leads created on/after new_lead_sequence_start_date are
  // enrolled — so switching the sequence on never retroactively emails the whole
  // back catalogue. Unset → default to today (only new leads going forward).
  const { data: settings } = await supabase
    .from("company_settings").select("new_lead_sequence_start_date").limit(1).maybeSingle<{ new_lead_sequence_start_date: string | null }>();
  const cutoffISO = settings?.new_lead_sequence_start_date
    ? new Date(`${settings.new_lead_sequence_start_date.slice(0, 10)}T00:00:00.000Z`).toISOString()
    : new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`).toISOString();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, service_interest, created_date, seq_steps_sent, status")
    .gte("created_date", cutoffISO)
    .not("status", "in", '("won","lost")');

  let sent = 0;
  for (const lead of leads ?? []) {
    if (!lead.email) continue;
    const already: number[] = lead.seq_steps_sent ?? [];
    for (const step of steps) {
      if (already.includes(step.step)) continue;
      if (lead.created_date > daysAgoISO(step.delay_days)) continue; // not due yet
      const vars = {
        name: lead.name ?? "there",
        lead_name: lead.name ?? "there",
        customer_name: lead.name ?? "there",
        service_interest: lead.service_interest ?? "",
      };
      const subject = applyPlaceholders(step.subject, vars);
      const res = await sendEmail({
        to: lead.email,
        subject,
        html: brandedEmail({ heading: subject, body: applyPlaceholders(step.body, vars) }),
      });
      if (res.ok) {
        already.push(step.step);
        await supabase.from("leads").update({ seq_steps_sent: already }).eq("id", lead.id);
        await logSequenceEmail(supabase, {
          sequenceType: "new_lead", step: step.step, stepLabel: step.label,
          recipientEmail: lead.email, recipientName: lead.name,
          relatedId: lead.id, relatedType: "lead", subject, resendMessageId: res.id,
        });
        sent++;
      }
      break; // one step per lead per run
    }
  }
  return { ok: true, detail: `lead sequence: ${sent} sent` };
}

// §1 — quote_not_booked sequence: chase 'sent' quotes that haven't been accepted.
export async function quoteNotBookedRunner(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const { data: steps } = await supabase
    .from("email_sequences")
    .select("step, delay_days, subject, body, label")
    .eq("sequence_type", "quote_not_booked")
    .eq("is_active", true)
    .order("step");
  if (!steps || steps.length === 0) return { ok: true, detail: "no active quote_not_booked sequence" };

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, customer_name, customer_email, total, public_token, sent_date, created_date, status")
    .eq("status", "sent");

  let sent = 0;
  for (const q of quotes ?? []) {
    if (!q.customer_email) continue;
    const anchor = q.sent_date ?? q.created_date;
    for (const step of steps) {
      if (anchor > daysAgoISO(step.delay_days)) continue;
      if (await sequenceAlreadyLogged(supabase, "quote_not_booked", step.step, q.id)) continue;
      const vars = {
        name: q.customer_name ?? "there",
        customer_name: q.customer_name ?? "there",
        quote_number: q.quote_number ?? "",
        total: money(q.total),
      };
      const subject = applyPlaceholders(step.subject, vars);
      const res = await sendEmail({
        to: q.customer_email,
        subject,
        html: brandedEmail({
          heading: subject,
          body: applyPlaceholders(step.body, vars),
          cta: q.public_token ? { label: "View Your Quote", url: `${APP_BASE}/quote/${q.public_token}` } : undefined,
        }),
      });
      if (res.ok) {
        await logSequenceEmail(supabase, {
          sequenceType: "quote_not_booked", step: step.step, stepLabel: step.label,
          recipientEmail: q.customer_email, recipientName: q.customer_name,
          relatedId: q.id, relatedType: "quote", subject, resendMessageId: res.id,
        });
        sent++;
      }
      break;
    }
  }
  return { ok: true, detail: `quote sequence: ${sent} sent` };
}

// §1 — invoice_not_paid sequence: chase unpaid/overdue invoices.
export async function invoiceNotPaidRunner(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const { data: steps } = await supabase
    .from("email_sequences")
    .select("step, delay_days, subject, body, label")
    .eq("sequence_type", "invoice_not_paid")
    .eq("is_active", true)
    .order("step");
  if (!steps || steps.length === 0) return { ok: true, detail: "no active invoice_not_paid sequence" };

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, customer_email, total, due_date, sent_date, created_date, status")
    .in("status", ["sent", "part_paid", "overdue"]);

  let sent = 0;
  for (const inv of invoices ?? []) {
    if (!inv.customer_email) continue;
    const anchor = inv.due_date ?? inv.sent_date ?? inv.created_date;
    for (const step of steps) {
      if (anchor > daysAgoISO(step.delay_days)) continue;
      if (await sequenceAlreadyLogged(supabase, "invoice_not_paid", step.step, inv.id)) continue;
      const vars = {
        name: inv.customer_name ?? "there",
        customer_name: inv.customer_name ?? "there",
        invoice_number: inv.invoice_number ?? "",
        total: money(inv.total),
        due_date: inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB") : "",
      };
      const subject = applyPlaceholders(step.subject, vars);
      const res = await sendEmail({
        to: inv.customer_email,
        subject,
        html: brandedEmail({ heading: subject, body: applyPlaceholders(step.body, vars) }),
      });
      if (res.ok) {
        await logSequenceEmail(supabase, {
          sequenceType: "invoice_not_paid", step: step.step, stepLabel: step.label,
          recipientEmail: inv.customer_email, recipientName: inv.customer_name,
          relatedId: inv.id, relatedType: "invoice", subject, resendMessageId: res.id,
        });
        sent++;
      }
      break;
    }
  }
  return { ok: true, detail: `invoice sequence: ${sent} sent` };
}

// Scheduled jobs starting in the next ~24h → remind the customer (once).
export async function send24HourJobReminder(): Promise<AutomationResult> {
  const supabase = await createServiceClient();
  const nowISO = new Date().toISOString();
  const in48hISO = new Date(Date.now() + 2 * 86400_000).toISOString();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, customer_name, customer_email, address, start_date, message_token")
    .eq("status", "scheduled")
    .eq("reminder_24h_sent", false)
    .gte("start_date", nowISO)
    .lte("start_date", in48hISO);
  if (error) return { ok: false, error: error.message };

  let sent = 0;
  for (const j of data ?? []) {
    if (!j.customer_email) continue;
    const when = j.start_date
      ? new Date(j.start_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "soon";
    const res = await sendEmail({
      to: j.customer_email,
      subject: `Reminder: ${j.title ?? "your job"} on ${when}`,
      html: brandedEmail({
        heading: "See you soon",
        body: `<p>Hi ${j.customer_name ?? "there"},</p>
          <p>A quick reminder that <strong>${j.title ?? "your job"}</strong> is scheduled for
          <strong>${when}</strong>${j.address ? ` at ${j.address}` : ""}.</p>
          <p>Need to change it? Use the reschedule button below.</p>`,
        cta: j.message_token
          ? { label: "Reschedule", url: `${BASE}/reschedule/${j.message_token}` }
          : undefined,
      }),
    });
    if (res.ok) {
      await supabase.from("jobs").update({ reminder_24h_sent: true }).eq("id", j.id);
      sent++;
    }
  }
  return { ok: true, detail: `24h reminder: ${sent} sent` };
}
