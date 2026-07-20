import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "./emails";
import type { AutomationResult } from "./types";

// Scheduled automation bodies. Each runs from /api/cron/<slug> via the service
// client (no user session) and is IDEMPOTENT — it only sends where a "sent" flag
// is still false, and only flips that flag once the email actually succeeds, so
// re-runs never double-send.

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "";

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
