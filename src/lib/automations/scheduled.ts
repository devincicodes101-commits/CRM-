import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "./emails";
import type { AutomationResult } from "./types";

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

// New-lead nurture sequence — sends each configured step once its delay elapses.
export async function newLeadSequenceRunner(): Promise<AutomationResult> {
  const supabase = await createServiceClient();

  const { data: steps } = await supabase
    .from("email_sequences")
    .select("step, delay_days, subject, body")
    .eq("sequence_type", "new_lead")
    .eq("is_active", true)
    .order("step");
  if (!steps || steps.length === 0) return { ok: true, detail: "no active new_lead sequence" };

  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, created_date, seq_steps_sent, status")
    .not("status", "in", '("won","lost")');

  let sent = 0;
  for (const lead of leads ?? []) {
    if (!lead.email) continue;
    const already: number[] = lead.seq_steps_sent ?? [];
    for (const step of steps) {
      if (already.includes(step.step)) continue;
      if (lead.created_date > daysAgoISO(step.delay_days)) continue; // not due yet
      const fill = (t: string) => (t ?? "").replaceAll("{name}", lead.name ?? "there");
      const res = await sendEmail({
        to: lead.email,
        subject: fill(step.subject),
        html: brandedEmail({ heading: fill(step.subject), body: fill(step.body) }),
      });
      if (res.ok) {
        already.push(step.step);
        await supabase.from("leads").update({ seq_steps_sent: already }).eq("id", lead.id);
        sent++;
      }
      break; // one step per lead per run
    }
  }
  return { ok: true, detail: `lead sequence: ${sent} sent` };
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
