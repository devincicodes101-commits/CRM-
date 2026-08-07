"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quoteInsertSchema, quoteUpdateSchema } from "@/lib/schemas/quotes";
import { onQuoteCreated } from "@/lib/automations/triggers";
import { logAuditEntry } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { getBranding, quoteEmailHtml, type QuoteEmailData } from "@/lib/email-templates";

export async function createQuote(values: unknown): Promise<{ error: string } | void> {
  const parsed = quoteInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Record which rep created the quote (unless already stamped, e.g. the AI agent).
  const { data: me } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle<{ full_name: string | null }>();
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      ...parsed.data,
      created_by_id: user.id,
      sales_agent_id: parsed.data.sales_agent_id ?? user.id,
      sales_agent_name: parsed.data.sales_agent_name ?? me?.full_name ?? user.email ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  onQuoteCreated({ ...parsed.data, id: data.id, created_by_id: user.id });
  await logAuditEntry(supabase, { action: "create", entityType: "Quote", entityId: data.id, entityName: parsed.data.customer_name ?? null });

  revalidatePath("/quotes");
  redirect(`/quotes/${data.id}`);
}

export async function updateQuote(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = quoteUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  await logAuditEntry(supabase, { action: "update", entityType: "Quote", entityId: id, entityName: parsed.data.customer_name ?? null, changedFields: Object.keys(parsed.data) });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function sendQuote(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: quote, error: fetchErr } = await supabase
    .from("quotes")
    .select(
      "public_token, customer_email, customer_name, customer_address, quote_number, valid_until, items, subtotal, discount_amount, vat_rate, vat_amount, total",
    )
    .eq("id", id)
    .single<
      {
        public_token: string;
        customer_email: string | null;
        customer_name: string | null;
        customer_address: string | null;
      } & QuoteEmailData
    >();
  if (fetchErr || !quote) return { error: fetchErr?.message ?? "Quote not found" };

  const { error } = await supabase
    .from("quotes")
    .update({ status: "sent", sent_date: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  // Email the customer the full branded quote, rendered inline, with a
  // "View Your Quote Online" button to the token-guarded public page.
  if (quote.customer_email) {
    const branding = await getBranding(supabase);
    const link = `${branding.appBaseUrl}/quote/${quote.public_token}`;
    await sendEmail({
      to: quote.customer_email,
      from: branding.from,
      subject: `Your Quote - ${quote.quote_number} from ${branding.companyName}`,
      html: quoteEmailHtml(quote, branding, link),
    });
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function updateQuoteStatus(
  id: string,
  status: "draft" | "sent" | "accepted" | "declined" | "expired"
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuote(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAuditEntry(supabase, { action: "delete", entityType: "Quote", entityId: id });

  revalidatePath("/quotes");
  redirect("/quotes");
}