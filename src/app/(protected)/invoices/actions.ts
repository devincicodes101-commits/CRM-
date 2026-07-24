"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoiceInsertSchema, invoiceUpdateSchema } from "@/lib/schemas/invoices";
import { onInvoicePaid } from "@/lib/automations/triggers";
import { sendEmail } from "@/lib/email";
import { getBranding, invoiceEmailHtml, type InvoiceEmailData } from "@/lib/email-templates";

export async function createInvoice(values: unknown): Promise<{ error: string } | void> {
  const parsed = invoiceInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}`);
}

export async function updateInvoice(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = invoiceUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function createInvoiceFromJob(jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobError || !job) return { error: jobError?.message ?? "Job not found" };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: job.customer_id ?? null,
      customer_name: job.customer_name ?? "Unknown",
      customer_email: job.customer_email ?? null,
      customer_address: job.address ?? null,
      items: job.total_value > 0
        ? [{ service_name: job.title, quantity: 1, unit_price: job.total_value, total: job.total_value }]
        : [],
      subtotal: job.total_value ?? 0,
      vat_rate: 20,
      vat_amount: (job.total_value ?? 0) * 0.2,
      total: (job.total_value ?? 0) * 1.2,
      status: "draft",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}/edit`);
}

export async function sendInvoice(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: invoice, error: fetchErr } = await supabase
    .from("invoices")
    .select(
      "invoice_number, customer_email, customer_name, customer_address, due_date, items, subtotal, vat_rate, vat_amount, total, amount_paid",
    )
    .eq("id", id)
    .single<{ customer_email: string | null } & InvoiceEmailData>();
  if (fetchErr || !invoice) return { error: fetchErr?.message ?? "Invoice not found" };

  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_date: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  // Send the full branded invoice (line items, Amount Due, bank details, terms).
  if (invoice.customer_email) {
    const branding = await getBranding(supabase);
    await sendEmail({
      to: invoice.customer_email,
      from: branding.from,
      subject: `Invoice ${invoice.invoice_number} from ${branding.companyName}`,
      html: invoiceEmailHtml(invoice, branding),
    });
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

// Convert to Invoice from a quote (mirrors createInvoiceFromJob).
export async function createInvoiceFromQuote(quoteId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select(
      "customer_id, customer_name, customer_email, customer_address, items, subtotal, discount_amount, vat_rate, vat_amount, total",
    )
    .eq("id", quoteId)
    .single();
  if (quoteErr || !quote) return { error: quoteErr?.message ?? "Quote not found" };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: quote.customer_id ?? null,
      customer_name: quote.customer_name ?? "Unknown",
      customer_email: quote.customer_email ?? null,
      customer_address: quote.customer_address ?? null,
      items: quote.items ?? [],
      subtotal: quote.subtotal ?? 0,
      discount_amount: quote.discount_amount ?? 0,
      vat_rate: quote.vat_rate ?? 20,
      vat_amount: quote.vat_amount ?? 0,
      total: quote.total ?? 0,
      status: "draft",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}/edit`);
}

export async function recordPayment(
  id: string,
  amount: number,
  method: "bank_transfer" | "credit_card" | "direct_debit",
  total: number
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const isPaid = amount >= total;
  const { error } = await supabase
    .from("invoices")
    .update({
      amount_paid: amount,
      payment_method: method,
      status: isPaid ? "paid" : "part_paid",
      paid_date: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  if (isPaid) onInvoicePaid(id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function markOverdue(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function deleteInvoice(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  redirect("/invoices");
}
