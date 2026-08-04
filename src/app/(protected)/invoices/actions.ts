"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoiceInsertSchema, invoiceUpdateSchema } from "@/lib/schemas/invoices";
import { onInvoicePaid } from "@/lib/automations/triggers";
import { sendEmail } from "@/lib/email";
import { getBranding, invoiceEmailHtml, type InvoiceEmailData } from "@/lib/email-templates";
import {
  buildInvoiceBranding,
  generateInvoicePdfBase64,
  type PdfInvoice,
} from "@/lib/invoice-pdf";
import { createContractorCommissionInvoice } from "@/lib/contractor-commission";

// §8/§9/§10 — generate a white-label invoice for a job, attach a real PDF to the
// email, persist it (deduped by job_id + invoice_type), and honour invoice_mode.
export async function generateAndEmailInvoice(
  jobId: string,
  invoiceType: "standard" | "deposit" = "standard",
): Promise<{ error: string } | { ok: true; invoiceId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, quote_id, customer_id, customer_name, customer_email, address, total_value, assigned_contractor_id")
    .eq("id", jobId)
    .single<{
      id: string; title: string | null; quote_id: string | null; customer_id: string | null;
      customer_name: string | null; customer_email: string | null; address: string | null;
      total_value: number | null; assigned_contractor_id: string | null;
    }>();
  if (!job) return { error: "Job not found" };

  // BILL TO always comes from the customer — never the logged-in / created_by staff.
  let billName = job.customer_name ?? "";
  let billEmail = job.customer_email ?? null;
  let billAddress = job.address ?? null;
  if (job.customer_id) {
    const { data: cust } = await supabase
      .from("customers")
      .select("name, email, address")
      .eq("id", job.customer_id)
      .maybeSingle<{ name: string | null; email: string | null; address: string | null }>();
    if (cust) {
      billName = cust.name ?? billName;
      billEmail = cust.email ?? billEmail;
      billAddress = cust.address ?? billAddress;
    }
  }
  if (!billName.trim()) return { error: "This job has no customer to bill." };

  const { data: settings } = await supabase
    .from("company_settings")
    .select("company_name, logo_url, address, city, postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_and_conditions, invoice_mode")
    .limit(1)
    .maybeSingle();
  const invoiceMode: string = settings?.invoice_mode ?? "company_direct";

  let contractor = null;
  if (job.assigned_contractor_id) {
    const { data } = await supabase
      .from("contractors")
      .select("company_name, contact_name, logo_url, address_line1, address_line2, address_city, address_postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_conditions")
      .eq("id", job.assigned_contractor_id)
      .maybeSingle();
    contractor = data;
  }

  // Amounts. Deposit = 50% of job value, single line, NO VAT (client to confirm).
  const value = Number(job.total_value ?? 0);
  const isDeposit = invoiceType === "deposit";
  const depositAmount = Math.round(value * 0.5 * 100) / 100;
  const items = isDeposit
    ? [{ service_name: "50% Booking Fee / Deposit", quantity: 1, unit_price: depositAmount, total: depositAmount }]
    : [{ service_name: job.title ?? "Works", quantity: 1, unit_price: value, total: value }];
  const subtotal = isDeposit ? depositAmount : value;
  const vatRate = isDeposit ? 0 : 20;
  const vatAmount = isDeposit ? 0 : Math.round(subtotal * 0.2 * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const row = {
    job_id: job.id,
    quote_id: job.quote_id ?? null,
    assigned_contractor_id: job.assigned_contractor_id ?? null,
    customer_id: job.customer_id ?? null,
    customer_name: billName,
    customer_email: billEmail,
    customer_address: billAddress,
    invoice_type: invoiceType,
    deposit_percent: isDeposit ? 50 : null,
    items,
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total,
    status: "sent" as const,
    sent_date: new Date().toISOString(),
    created_by_id: user.id,
  };

  // Dedupe by (job_id, invoice_type): update in place if one already exists.
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("job_id", job.id)
    .eq("invoice_type", invoiceType)
    .maybeSingle<{ id: string }>();

  let invoiceId: string;
  let invoiceNumber: string;
  if (existing) {
    const { data, error } = await supabase
      .from("invoices").update(row).eq("id", existing.id).select("id, invoice_number").single();
    if (error) return { error: error.message };
    invoiceId = data.id; invoiceNumber = data.invoice_number;
  } else {
    const { data, error } = await supabase
      .from("invoices").insert(row).select("id, invoice_number, created_date").single();
    if (error) return { error: error.message };
    invoiceId = data.id; invoiceNumber = data.invoice_number;
  }

  // Resolve branding + PDF, then email it.
  const branding = buildInvoiceBranding({ invoiceMode, contractor, company: settings ?? null });
  const pdfInvoice: PdfInvoice = {
    invoice_number: invoiceNumber,
    invoice_type: invoiceType,
    created_date: new Date().toISOString(),
    due_date: null,
    customer_name: billName,
    customer_email: billEmail,
    customer_address: billAddress,
    items,
    subtotal,
    discount_amount: 0,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total,
    amount_paid: 0,
    notes: null,
  };
  const pdfBase64 = generateInvoicePdfBase64(pdfInvoice, branding);

  if (billEmail) {
    const emailBranding = await getBranding(supabase);
    await sendEmail({
      to: billEmail,
      from: emailBranding.from,
      subject: `${isDeposit ? "Deposit Invoice" : "Invoice"} ${invoiceNumber} from ${branding.name}`,
      html: invoiceEmailHtml(
        { invoice_number: invoiceNumber, customer_name: billName, customer_address: billAddress, due_date: null, items, subtotal, vat_rate: vatRate, vat_amount: vatAmount, total, amount_paid: 0 },
        emailBranding,
      ),
      attachments: [{ filename: `invoice-${invoiceNumber}.pdf`, content: pdfBase64 }],
    });
  }

  // §9 commission guard: raise the contractor agency-fee invoice only under
  // white-label, only on the standard (not deposit) invoice, and only when a
  // contractor is assigned. Best-effort — never blocks the customer invoice.
  if (invoiceMode === "white_label" && job.assigned_contractor_id && !isDeposit) {
    await createContractorCommissionInvoice(supabase, {
      jobId: job.id,
      customerInvoiceId: invoiceId,
      createdById: user.id,
    });
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/invoices");
  return { ok: true, invoiceId };
}


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

// Issue a credit note — a credit_note-type invoice with a negative total.
export async function issueCreditNote(input: {
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  amount: number;
  reason?: string;
}): Promise<{ error: string } | { ok: true; id: string }> {
  if (!input.customerName?.trim()) return { error: "Customer name is required" };
  if (!input.amount || input.amount <= 0) return { error: "Enter a credit amount greater than 0" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const amt = Math.abs(input.amount);
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: input.customerId ?? null,
      customer_name: input.customerName.trim(),
      customer_email: input.customerEmail ?? null,
      invoice_type: "credit_note",
      items: [{ service_name: "Credit Note", quantity: 1, unit_price: -amt, total: -amt }],
      subtotal: -amt,
      vat_rate: 0,
      vat_amount: 0,
      total: -amt,
      status: "draft",
      notes: input.reason?.trim() || null,
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  return { ok: true, id: data.id };
}

export async function deleteInvoice(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  redirect("/invoices");
}
