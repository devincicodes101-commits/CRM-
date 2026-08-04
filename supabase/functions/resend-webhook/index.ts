// §19 — Resend webhook: on email.bounced / email.complained, flag the customer's
// email_status and raise an Alert so staff know to phone instead.
//
// Deploy:  supabase functions deploy resend-webhook --no-verify-jwt
// Configure the Resend webhook to POST here. Set a shared secret in the function
// env (RESEND_WEBHOOK_SECRET) and add it as a header on the Resend webhook, OR
// leave unset to accept all (dev). Svix signature verification is a future
// hardening step.
//
// NOTE: clearing email_status in the DB is NOT enough to resume delivery — the
// address must also be removed from Resend's suppression list.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ResendEvent = {
  type: string;
  data?: { to?: string[] | string; email?: string; recipient?: string };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (secret) {
    const provided = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization");
    if (provided !== secret && provided !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let event: ResendEvent;
  try {
    event = await req.json();
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const status =
    event.type === "email.bounced" ? "bounced" :
    event.type === "email.complained" ? "complained" : null;
  if (!status) return new Response(JSON.stringify({ ok: true, ignored: event.type }), { status: 200 });

  // Recipient(s)
  const raw = event.data?.to ?? event.data?.email ?? event.data?.recipient;
  const recipients = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean);
  if (recipients.length === 0) return new Response(JSON.stringify({ ok: true, no_recipient: true }), { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let updated = 0;
  for (const email of recipients) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id, name, email")
      .ilike("email", email)
      .maybeSingle();

    if (customer) {
      await supabase.from("customers").update({ email_status: status }).eq("id", customer.id);
    }

    await supabase.from("alerts").insert({
      alert_type: "email_bounce",
      title: status === "complained" ? "⚠️ Spam complaint" : "⚠️ Email bounced",
      message:
        `Email to ${email} ${status === "complained" ? "was marked as spam" : "bounced"}. ` +
        `Contact this customer by phone. The address is now suppressed by Resend.`,
      customer_id: customer?.id ?? null,
      customer_name: customer?.name ?? null,
      customer_email: email,
      status: "active",
    });
    updated++;
  }

  return new Response(JSON.stringify({ ok: true, status, updated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
