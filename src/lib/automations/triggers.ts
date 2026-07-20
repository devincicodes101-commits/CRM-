import { runAutomation } from "./run";
import { createServiceClient } from "@/lib/supabase/server";
import { smsTelesalesTeam } from "@/lib/sms";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "./emails";

// Entity-triggered automations (Base44 "when X is created/updated" automations).
// Call the matching dispatcher from a server action AFTER the DB write succeeds.
// Each runs fire-and-forget so it never blocks or breaks the user's action.
//
// Example (in jobs/actions.ts, after inserting a job):
//   import { onJobCreated } from "@/lib/automations/triggers";
//   onJobCreated(newJob);
//
// Bodies still marked TODO map 1:1 to Base44 automations (docs/PARITY.md) and
// are ported as each module lands.

type Row = Record<string, unknown> & { id: string };

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function onJobCreated(job: Row): void {
  // Base44: sendJobBookingConfirmation — confirm the new booking to the customer.
  runAutomation("sendJobBookingConfirmation", async () => {
    const email = str(job.customer_email);
    if (!email) return;
    const title = str(job.title) ?? "your job";
    const when = str(job.start_date)
      ? new Date(String(job.start_date)).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "the scheduled date";
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const token = str(job.message_token);

    await sendEmail({
      to: email,
      subject: `Booking confirmed — ${title}`,
      html: brandedEmail({
        heading: "Your booking is confirmed",
        body: `<p>Hi ${str(job.customer_name) ?? "there"},</p>
          <p>We've booked <strong>${title}</strong> for <strong>${when}</strong>.</p>
          ${str(job.address) ? `<p>Address: ${str(job.address)}</p>` : ""}
          <p>Need to change the date? Use the button below.</p>`,
        cta: token ? { label: "Reschedule", url: `${base}/reschedule/${token}` } : undefined,
      }),
    });
  });

  runAutomation("syncJobToFieldApp", async () => {
    /* TODO: POST job to external Field Service App via CRM_SYNC_SECRET (needs URL) */
  });
  runAutomation("inviteContractorsForJob", async () => {
    /* TODO: match contractors by coverage + email invites */
  });
}

export function onJobUpdated(job: Row, previous?: Row): void {
  runAutomation("sendJobBookingConfirmation", async () => {
    /* TODO: branded booking-confirmation email to customer */
  });
}

export function onQuoteCreated(quote: Row): void {
  // Base44: createCustomerFromQuote — ensure a Customer exists for the quote.
  runAutomation("createCustomerFromQuote", async () => {
    const name = str(quote.customer_name);
    if (!name) return;
    if (str(quote.customer_id)) return; // already linked to a customer

    const supabase = await createServiceClient();
    const email = str(quote.customer_email);

    // De-dupe by email if we have one.
    if (email) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existing) return;
    }

    await supabase.from("customers").insert({
      name,
      email,
      address: str(quote.customer_address),
      status: "lead",
      created_by_id: str(quote.created_by_id),
    });
  });
}

export function onLeadCreated(lead: Row): void {
  // Base44: notifyTelesalesNewLead — SMS the telesales team + log an alert.
  runAutomation("notifyTelesalesNewLead", async () => {
    const name = str(lead.name) ?? "New lead";
    const interest = str(lead.service_interest);
    const phone = str(lead.phone);
    const source = str(lead.source);

    const body =
      `🔔 New lead: ${name}` +
      (interest ? ` — ${interest}` : "") +
      (phone ? `\n📞 ${phone}` : "") +
      (source ? `\nSource: ${source}` : "");

    await smsTelesalesTeam(body);

    // Also drop an in-app alert so it's visible without SMS configured.
    const supabase = await createServiceClient();
    await supabase.from("alerts").insert({
      alert_type: "message",
      title: "New lead received",
      message: body,
      status: "active",
    });

    // Optional email nudge to the sales inbox, if configured.
    const salesInbox = str(process.env.SALES_ALERT_EMAIL);
    if (salesInbox) {
      await sendEmail({
        to: salesInbox,
        subject: `New lead: ${name}`,
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      });
    }
  });
}

export function onInvoicePaid(invoiceId: string): void {
  // Base44: sendInvoiceReceipt — email the customer a receipt once paid.
  runAutomation("sendInvoiceReceipt", async () => {
    const supabase = await createServiceClient();
    const { data: inv } = await supabase
      .from("invoices")
      .select("invoice_number, customer_name, customer_email, total, amount_paid")
      .eq("id", invoiceId)
      .single<{
        invoice_number: string;
        customer_name: string | null;
        customer_email: string | null;
        total: number | null;
        amount_paid: number | null;
      }>();
    if (!inv?.customer_email) return;

    await sendEmail({
      to: inv.customer_email,
      subject: `Payment received — ${inv.invoice_number}`,
      html: brandedEmail({
        heading: "Thanks — payment received",
        body: `<p>Hi ${inv.customer_name ?? "there"},</p>
          <p>We've received your payment of <strong>${money(inv.amount_paid)}</strong>
          for invoice <strong>${inv.invoice_number}</strong> (total ${money(inv.total)}).</p>
          <p>Thank you for your business.</p>`,
      }),
    });
  });
}

export function onFeedbackCreated(feedback: Row): void {
  // Base44: handleLowRatingAlert — raise an alert on ratings below 3 stars.
  // Pure DB, works today with no external service.
  runAutomation("handleLowRatingAlert", async () => {
    const rating = Number(feedback.star_rating ?? 5);
    if (!rating || rating >= 3) return;

    const supabase = await createServiceClient();
    const name = str(feedback.customer_name) ?? "A customer";
    await supabase.from("alerts").insert({
      alert_type: "low_rating",
      title: `Low rating (${rating}★) from ${name}`,
      message: str(feedback.feedback) ?? "No comment left.",
      job_id: str(feedback.job_id),
      customer_name: name,
      star_rating: rating,
      feedback_text: str(feedback.feedback),
      status: "active",
    });
  });
}

export function onJobArrivalCreated(arrival: Row): void {
  runAutomation("sendArrivalNotification", async () => {
    /* TODO: notify customer the operative has arrived */
  });
}

export function onJobChatCreated(message: Row): void {
  runAutomation("notifyJobChatMessage", async () => {
    /* TODO: email admins/operatives/customer of the new message */
  });
}

export function onServiceCreated(service: Row): void {
  runAutomation("autoGenerateServicePreview", async () => {
    /* TODO: AI media generation is stubbed — leave as manual upload for now */
  });
}
