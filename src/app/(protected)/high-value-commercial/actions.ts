"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail, money } from "@/lib/automations/emails";

const THRESHOLD = 3000;

// "Send Weekly Reminder Emails" — nudges customers on open, high-value commercial
// quotes that are still awaiting a response.
export async function sendHighValueReminders(): Promise<{ sent: number } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!me || !["admin", "user", "sales", "telesales"].includes(me.role)) return { error: "Forbidden" };

  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, customer_name, customer_email, total, public_token")
    .eq("client_type", "commercial")
    .eq("status", "sent")
    .gte("total", THRESHOLD);
  if (error) return { error: error.message };

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  let sent = 0;
  for (const q of data ?? []) {
    if (!q.customer_email) continue;
    const res = await sendEmail({
      to: q.customer_email,
      subject: `Following up on your quote ${q.quote_number}`,
      html: brandedEmail({
        heading: "Just following up",
        body: `<p>Hi ${q.customer_name ?? "there"},</p>
          <p>We wanted to follow up on your quote <strong>${q.quote_number}</strong>
          (${money(q.total)}). We'd be glad to answer any questions.</p>`,
        cta: { label: "View your quote", url: `${base}/quote/${q.public_token}` },
      }),
    });
    if (res.ok) sent++;
  }

  revalidatePath("/high-value-commercial");
  return { sent };
}
