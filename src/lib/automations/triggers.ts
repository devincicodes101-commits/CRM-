import { runAutomation } from "./run";
import { createServiceClient } from "@/lib/supabase/server";
import { smsTelesalesTeam } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

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
  runAutomation("syncJobToFieldApp", async () => {
    /* TODO: POST job to external Field Service App via CRM_SYNC_SECRET */
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

export function onInvoiceUpdated(invoice: Row, previous?: Row): void {
  runAutomation("sendInvoiceReceipt", async () => {
    /* TODO: if status flipped to paid, email receipt */
  });
}

export function onFeedbackCreated(feedback: Row): void {
  runAutomation("handleLowRatingAlert", async () => {
    /* TODO: if star_rating < 3, insert an alert row */
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
