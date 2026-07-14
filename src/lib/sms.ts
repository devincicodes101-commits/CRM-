import twilio from "twilio";

// Thin Twilio wrapper for SMS alerts (new lead / quote sent / invoice sent).
// Degrades gracefully when unconfigured.

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; error: string };

export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  if (!client) {
    console.warn(`[sms] Twilio not configured — skipped SMS to ${to}`);
    return { ok: false, error: "sms_not_configured" };
  }
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) return { ok: false, error: "missing_twilio_from_number" };

  try {
    const msg = await client.messages.create({ to, from, body });
    return { ok: true, sid: msg.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Broadcast to the telesales alert numbers configured in TELESALES_SMS_NUMBERS (comma-separated). */
export async function smsTelesalesTeam(body: string): Promise<SendSmsResult[]> {
  const numbers = (process.env.TELESALES_SMS_NUMBERS ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  return Promise.all(numbers.map((n) => sendSms(n, body)));
}
