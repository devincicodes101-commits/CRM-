import { runAutomation } from "./run";

// Entity-triggered automations (Base44 "when X is created/updated" automations).
// Call the matching dispatcher from a server action AFTER the DB write succeeds.
// Each runs fire-and-forget so it never blocks or breaks the user's action.
//
// Example (in jobs/actions.ts, after inserting a job):
//   import { onJobCreated } from "@/lib/automations/triggers";
//   onJobCreated(newJob);
//
// The bodies below are STUBS mapping 1:1 to Base44 automations (docs/PARITY.md).
// Port them by filling in each runAutomation() callback — email/sms/storage libs
// are ready to use.

type Row = Record<string, unknown> & { id: string };

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
  runAutomation("createCustomerFromQuote", async () => {
    /* TODO: upsert a Customer from the quote */
  });
}

export function onLeadCreated(lead: Row): void {
  runAutomation("notifyTelesalesNewLead", async () => {
    /* TODO: smsTelesalesTeam(...) + email alert */
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
