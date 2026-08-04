"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import {
  buildInvoiceBranding,
  generateInvoicePdfBase64,
  type PdfInvoice,
} from "@/lib/invoice-pdf";

// Public review submission from the customer portal. The portal_token is the
// authorization, so this runs through the service client keyed on that token.
// §11 — when a job is chosen, resolve its contractor so the review feeds the
// contractor ★ rating (picker + reports).
export async function submitPortalReview(
  token: string,
  data: { star_rating: number; review_text: string; job_id?: string | null }
): Promise<{ ok: true } | { error: string }> {
  if (!token) return { error: "Invalid link" };
  const rating = Number(data.star_rating);
  if (!rating || rating < 1 || rating > 5) return { error: "Please pick a star rating" };

  const supabase = await createServiceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("portal_token", token)
    .single<{ id: string; name: string; email: string | null }>();
  if (!customer) return { error: "Portal not found" };

  let contractorId: string | null = null;
  let jobTitle: string | null = null;
  let messageToken: string | null = null;
  if (data.job_id) {
    // Verify the job belongs to this customer before linking.
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, message_token, assigned_contractor_id, customer_id, customer_email")
      .eq("id", data.job_id)
      .maybeSingle<{ id: string; title: string | null; message_token: string | null; assigned_contractor_id: string | null; customer_id: string | null; customer_email: string | null }>();
    if (job && (job.customer_id === customer.id || (!!customer.email && job.customer_email === customer.email))) {
      contractorId = job.assigned_contractor_id;
      jobTitle = job.title;
      messageToken = job.message_token;

      // One review per job (source='customer') — dedupe gracefully.
      const { data: dupe } = await supabase
        .from("reviews").select("id").eq("job_id", job.id).eq("source", "customer").maybeSingle<{ id: string }>();
      if (dupe) return { error: "You've already reviewed this job — thank you!" };
    }
  }

  const { error } = await supabase.from("reviews").insert({
    customer_name: customer.name,
    customer_email: customer.email,
    job_id: data.job_id ?? null,
    job_title: jobTitle,
    contractor_id: contractorId,
    message_token: messageToken,
    star_rating: rating,
    review_text: data.review_text?.trim() || null,
    source: "customer",
    is_published: true,
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/${token}`);
  return { ok: true };
}

// §11 — customer downloads a white-label PDF of their invoice. Verified against
// the portal token so no login is needed.
export async function downloadInvoice(
  token: string,
  invoiceId: string,
): Promise<{ pdf: string; filename: string } | { error: string }> {
  if (!token || !invoiceId) return { error: "Invalid request" };
  const supabase = await createServiceClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email")
    .eq("portal_token", token)
    .single<{ id: string; email: string | null }>();
  if (!customer) return { error: "Portal not found" };

  const { data: inv } = await supabase
    .from("invoices")
    .select("id, invoice_number, invoice_type, created_date, due_date, customer_id, customer_email, customer_name, customer_address, assigned_contractor_id, items, subtotal, discount_amount, vat_rate, vat_amount, total, amount_paid, notes")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return { error: "Invoice not found" };
  // Authorize: the invoice must belong to this customer.
  const owns = inv.customer_id === customer.id || (!!customer.email && inv.customer_email === customer.email);
  if (!owns) return { error: "Not found" };

  const { data: settings } = await supabase
    .from("company_settings")
    .select("company_name, tagline, primary_color, logo_url, address, city, postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_and_conditions, invoice_mode")
    .limit(1)
    .maybeSingle();
  const invoiceMode: string = settings?.invoice_mode ?? "company_direct";

  let contractor = null;
  if (inv.assigned_contractor_id) {
    const { data } = await supabase
      .from("contractors")
      .select("company_name, contact_name, logo_url, address_line1, address_line2, address_city, address_postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_conditions")
      .eq("id", inv.assigned_contractor_id)
      .maybeSingle();
    contractor = data;
  }

  const branding = buildInvoiceBranding({ invoiceMode, contractor, company: settings ?? null });
  const pdfInvoice: PdfInvoice = {
    invoice_number: inv.invoice_number,
    invoice_type: inv.invoice_type,
    created_date: inv.created_date,
    due_date: inv.due_date,
    customer_name: inv.customer_name,
    customer_email: inv.customer_email,
    customer_address: inv.customer_address,
    items: inv.items ?? [],
    subtotal: Number(inv.subtotal ?? 0),
    discount_amount: Number(inv.discount_amount ?? 0),
    vat_rate: Number(inv.vat_rate ?? 0),
    vat_amount: Number(inv.vat_amount ?? 0),
    total: Number(inv.total ?? 0),
    amount_paid: Number(inv.amount_paid ?? 0),
    notes: inv.notes,
  };
  const pdf = generateInvoicePdfBase64(pdfInvoice, branding);
  return { pdf, filename: `invoice-${inv.invoice_number}.pdf` };
}
