// §19 + §1 — Resend webhook.
//  * email.bounced / email.complained → flag customers.email_status + raise an Alert.
//  * email.opened / email.clicked     → mark the matching sequence_email_logs row.
//
// Deployed via the Supabase dashboard (Edge Functions), Verify-JWT OFF, and
// secured by the publishable key in the webhook URL (?apikey=sb_publishable_...).
//
// NOTE: clearing email_status in the DB is NOT enough to resume delivery — the
// address must also be removed from Resend's suppression list.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let event;
  try { event = await req.json(); } catch { return new Response("Bad payload", { status: 400 }); }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  // ── Open / click tracking → sequence_email_logs (matched by Resend message id)
  if (event.type === "email.opened" || event.type === "email.clicked") {
    const messageId = event.data?.email_id ?? event.data?.id;
    if (!messageId) return new Response(JSON.stringify({ ok: true, no_id: true }), { status: 200 });
    const now = new Date().toISOString();
    const patch = event.type === "email.opened"
      ? { opened: true, opened_date: now }
      : { clicked: true, clicked_date: now };
    const { data } = await supabase
      .from("sequence_email_logs")
      .update(patch)
      .eq("resend_message_id", messageId)
      .select("id");
    return new Response(JSON.stringify({ ok: true, event: event.type, updated: data?.length ?? 0 }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  // ── Bounce / complaint → email_status + Alert
  const status =
    event.type === "email.bounced" ? "bounced" :
    event.type === "email.complained" ? "complained" : null;
  if (!status) return new Response(JSON.stringify({ ok: true, ignored: event.type }), { status: 200 });

  const raw = event.data?.to ?? event.data?.email ?? event.data?.recipient;
  const recipients = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (recipients.length === 0) return new Response(JSON.stringify({ ok: true, no_recipient: true }), { status: 200 });

  let updated = 0;
  for (const email of recipients) {
    const { data: customer } = await supabase
      .from("customers").select("id, name, email").ilike("email", email).maybeSingle();
    if (customer) await supabase.from("customers").update({ email_status: status }).eq("id", customer.id);
    await supabase.from("alerts").insert({
      alert_type: "email_bounce",
      title: status === "complained" ? "⚠️ Spam complaint" : "⚠️ Email bounced",
      message: `Email to ${email} ${status === "complained" ? "was marked as spam" : "bounced"}. Contact this customer by phone. The address is now suppressed by Resend.`,
      customer_id: customer?.id ?? null,
      customer_name: customer?.name ?? null,
      customer_email: email,
      status: "active",
    });
    updated++;
  }
  return new Response(JSON.stringify({ ok: true, status, updated }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
