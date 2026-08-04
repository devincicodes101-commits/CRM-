import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildInvoiceBranding,
  generateInvoicePdfBase64,
  type PdfInvoice,
} from "@/lib/invoice-pdf";
import { getBranding, invoiceEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

// §8/§9 — under white-label invoicing, raise the agency-fee invoice FROM the
// company TO the assigned contractor (the company's share of the job value).
// Idempotent: one per job (contractor_commission_invoices.job_id is UNIQUE).
// Never throws — the customer invoice must succeed regardless.
export async function createContractorCommissionInvoice(
  supabase: SupabaseClient,
  opts: { jobId: string; customerInvoiceId?: string | null; createdById?: string | null },
): Promise<{ ok: true; id: string } | { skipped: string } | { error: string }> {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, total_value, assigned_contractor_id, contractor_pay_amount, company_share_amount")
      .eq("id", opts.jobId)
      .single<{
        id: string; title: string | null; total_value: number | null;
        assigned_contractor_id: string | null; contractor_pay_amount: number | null; company_share_amount: number | null;
      }>();
    if (!job) return { skipped: "job_not_found" };
    if (!job.assigned_contractor_id) return { skipped: "no_contractor" };

    const jobValue = Number(job.total_value ?? 0);
    const contractorPay = Number(job.contractor_pay_amount ?? 0);
    // Company share = agency fee owed. Prefer the stored split; fall back to value − pay.
    const commission =
      job.company_share_amount != null ? Number(job.company_share_amount) : Math.max(0, jobValue - contractorPay);
    if (!(commission > 0)) return { skipped: "no_commission" };

    // Dedupe on the job.
    const { data: existing } = await supabase
      .from("contractor_commission_invoices").select("id").eq("job_id", job.id).maybeSingle<{ id: string }>();
    if (existing) return { ok: true, id: existing.id };

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, user_id, company_name, contact_name, email, address_line1, address_line2, address_city, address_postcode")
      .eq("id", job.assigned_contractor_id)
      .maybeSingle<{
        id: string; user_id: string | null; company_name: string | null; contact_name: string | null; email: string | null;
        address_line1: string | null; address_line2: string | null; address_city: string | null; address_postcode: string | null;
      }>();

    const contractorName = contractor?.company_name || contractor?.contact_name || "Contractor";
    const contractorAddress = [contractor?.address_line1, contractor?.address_line2, [contractor?.address_city, contractor?.address_postcode].filter(Boolean).join(", ")]
      .map((p) => p?.trim()).filter(Boolean).join("\n") || null;

    const { data: inserted, error } = await supabase
      .from("contractor_commission_invoices")
      .insert({
        job_id: job.id,
        customer_invoice_id: opts.customerInvoiceId ?? null,
        contractor_id: contractor?.id ?? job.assigned_contractor_id,
        contractor_user_id: contractor?.user_id ?? null,
        contractor_name: contractorName,
        contractor_email: contractor?.email ?? null,
        job_title: job.title,
        job_value: jobValue,
        contractor_pay_amount: contractorPay,
        commission_amount: commission,
        vat_amount: 0,
        total_due: commission,
        status: "sent",
        sent_date: new Date().toISOString(),
        created_by_id: opts.createdById ?? null,
      })
      .select("id, invoice_number")
      .single();
    if (error) return { error: error.message };

    // Company-branded PDF billing the contractor.
    try {
      const { data: settings } = await supabase
        .from("company_settings")
        .select("company_name, logo_url, address, city, postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_and_conditions")
        .limit(1)
        .maybeSingle();
      const branding = buildInvoiceBranding({ invoiceMode: "company_direct", contractor: null, company: settings ?? null });
      const pdfInvoice: PdfInvoice = {
        invoice_number: inserted.invoice_number,
        invoice_type: "standard",
        created_date: new Date().toISOString(),
        due_date: null,
        customer_name: contractorName,
        customer_email: contractor?.email ?? null,
        customer_address: contractorAddress,
        items: [{ service_name: `Agency commission — ${job.title ?? "Job"}`, quantity: 1, unit_price: commission, total: commission }],
        subtotal: commission,
        discount_amount: 0,
        vat_rate: 0,
        vat_amount: 0,
        total: commission,
        amount_paid: 0,
        notes: `Commission on job "${job.title ?? ""}" (job value ${jobValue.toFixed(2)}, your share ${contractorPay.toFixed(2)}).`,
      };
      const pdfBase64 = generateInvoicePdfBase64(pdfInvoice, branding);

      if (contractor?.email) {
        const emailBranding = await getBranding(supabase);
        await sendEmail({
          to: contractor.email,
          from: emailBranding.from,
          subject: `Commission invoice ${inserted.invoice_number} — ${job.title ?? "Job"}`,
          html: invoiceEmailHtml(
            { invoice_number: inserted.invoice_number, customer_name: contractorName, customer_address: contractorAddress, due_date: null, items: pdfInvoice.items, subtotal: commission, vat_rate: 0, vat_amount: 0, total: commission, amount_paid: 0 },
            emailBranding,
          ),
          attachments: [{ filename: `commission-${inserted.invoice_number}.pdf`, content: pdfBase64 }],
        });
      }
    } catch (e) {
      console.error("[contractorCommission] pdf/email failed", e);
    }

    return { ok: true, id: inserted.id };
  } catch (e) {
    console.error("[createContractorCommissionInvoice] failed", e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
