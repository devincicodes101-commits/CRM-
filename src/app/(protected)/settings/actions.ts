"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/automations/emails";

// §9 — white-label vs company-direct invoicing mode.
export async function setInvoiceMode(
  mode: "white_label" | "company_direct",
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { error } = existing
    ? await supabase.from("company_settings").update({ invoice_mode: mode }).eq("id", existing.id)
    : await supabase.from("company_settings").insert({ invoice_mode: mode });
  if (error) return { error: error.message };

  revalidatePath("/settings/invoicing");
  return { ok: true };
}

export async function sendTestEmail(
  to: string
): Promise<{ ok: true; id?: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!to.trim()) return { error: "Enter a recipient address" };

  const res = await sendEmail({
    to: to.trim(),
    subject: "Test email from your CRM",
    html: brandedEmail({
      heading: "It works ✅",
      body: `<p>If you're reading this, Resend is connected and your CRM can send emails —
        receipts, booking confirmations, quote follow-ups and reminders will all go out
        automatically.</p>`,
    }),
  });

  if (!res.ok) {
    if (res.error === "email_not_configured") {
      return { error: "RESEND_API_KEY isn't set on the server (redeploy after adding it)." };
    }
    return { error: res.error };
  }
  return { ok: true, id: res.id };
}
