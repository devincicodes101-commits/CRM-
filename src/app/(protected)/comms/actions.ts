"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmailSequenceInsert } from "@/lib/schemas/comms";

// ─── Email via Resend ─────────────────────────────────────────────────────────

export async function sendEmailResend(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY not configured" };

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@buildstream.app";

  const { error } = await resend.emails.send({
    from,
    to: opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });

  if (error) return { error: (error as { message?: string }).message ?? "Send failed" };
}

// ─── SMS via Twilio ───────────────────────────────────────────────────────────

export async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { error: "Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)" };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  try {
    await client.messages.create({ body, from: fromNumber, to });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "SMS send failed";
    return { error: msg };
  }
}

// ─── Manual email to customer ─────────────────────────────────────────────────

export async function sendCustomerEmail(data: {
  to: string;
  toName: string;
  subject: string;
  body: string;
  jobId?: string;
  quoteId?: string;
}) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <p>${data.body.replace(/\n/g, "<br>")}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">BuildStream — Property Services Management</p>
  </div>`;

  const result = await sendEmailResend({
    to: data.to,
    toName: data.toName,
    subject: data.subject,
    html,
  });

  if (result?.error) return { error: result.error };

  // Log to messages table
  const supabase = await createClient();
  await supabase.from("messages").insert({
    customer_email: data.to,
    customer_name: data.toName,
    content: data.body,
    subject: data.subject,
    sender_type: "admin",
    job_id: data.jobId ?? null,
    quote_id: data.quoteId ?? null,
  });

  revalidatePath("/comms");
}

// ─── Email Sequences ──────────────────────────────────────────────────────────

export async function createSequenceStep(data: EmailSequenceInsert) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/comms/sequences");
}

export async function updateSequenceStep(id: string, data: Partial<EmailSequenceInsert>) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/comms/sequences");
}

export async function deleteSequenceStep(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("email_sequences").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/comms/sequences");
}

export async function toggleSequenceStep(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_sequences")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/comms/sequences");
}

// ─── Mark message read ────────────────────────────────────────────────────────

export async function markMessageRead(id: string) {
  const supabase = await createClient();
  await supabase.from("messages").update({ is_read: true }).eq("id", id);
  revalidatePath("/comms");
}

export async function replyToMessage(id: string, content: string, toEmail: string, toName: string) {
  const result = await sendCustomerEmail({
    to: toEmail,
    toName,
    subject: "Re: Your enquiry",
    body: content,
  });
  if (result?.error) return { error: result.error };

  const supabase = await createClient();
  await supabase.from("messages").update({ status: "answered" }).eq("id", id);
  revalidatePath("/comms");
}