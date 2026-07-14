import { Resend } from "resend";

// Thin Resend wrapper. Base44's Core.SendEmail equivalent.
// Degrades gracefully when unconfigured so automations don't hard-crash in dev.

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | undefined }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${input.subject}"`);
    return { ok: false, error: "email_not_configured" };
  }

  const from =
    input.from ?? process.env.RESEND_FROM_EMAIL ?? "BuildStream <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}
