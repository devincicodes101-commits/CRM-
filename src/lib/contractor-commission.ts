import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAgencyBranding,
  generateInvoicePdfBase64,
  type PdfInvoice,
} from "@/lib/invoice-pdf";
import { getBranding, invoiceEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

const DEFAULT_AGENCY_FEE = 30; // % of job value if nothing configured

// §6 — the AppyLead agency fee: a % of the job value billed FROM the agency TO
// the assigned contractor, under white-label invoicing. Agency-branded PDF with
// SWIFT payment details. Idempotent (one per job). Never throws.
export async function createContractorCommissionInvoice(
  supabase: SupabaseClient,
  opts: { jobId: string; customerInvoiceId?: string | null; createdById?: string | null },
): Promise<{ ok: true; id: string } | { skipped: string } | { error: string }> {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, total_value, assigned_contractor_id, contractor_pay_amount, agency_fee_percent")
      .eq("id", opts.jobId)
      .single<{
        id: string; title: string | null; total_value: number | null;
        assigned_contractor_id: string | null; contractor_pay_amount: number | null; agency_fee_percent: number | null;
      }>();
    if (!job) return { skipped: "job_not_found" };
    if (!job.assigned_contractor_id) return { skipped: "no_contractor" };

    const jobValue = Number(job.total_value ?? 0);
    const contractorPay = Number(job.contractor_pay_amount ?? 0);

    // Agency settings — fee %, VAT status and branding.
    const { data: settings } = await supabase
      .from("company_settings")
      .select("agency_name, agency_logo_url, agency_address, agency_vat_number, agency_email, agency_bank_name, agency_account_name, agency_iban, agency_swift_bic, agency_fee_percent, primary_color")
      .limit(1)
      .maybeSingle();

    const feePercent = Number(job.agency_fee_percent ?? settings?.agency_fee_percent ?? DEFAULT_AGENCY_FEE);
    // Base44 sendAgencyFeeInvoice: when the job carries a contractor_pay_amount
    // (an auction winning bid the contractor already paid the company), the fee
    // is charged on the COMPANY'S SHARE, not the full job value — otherwise on
    // the full value (direct assignment).
    const commissionBase = contractorPay > 0 ? Math.max(0, jobValue - contractorPay) : jobValue;
    const commission = Math.round(((commissionBase * feePercent) / 100) * 100) / 100;
    if (!(commission > 0)) return { skipped: "no_commission" };
    const vatAmount = settings?.agency_vat_number ? Math.round(commission * 0.2 * 100) / 100 : 0;
    const totalDue = Math.round((commission + vatAmount) * 100) / 100;

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
        commission_percent: feePercent,
        commission_amount: commission,
        vat_amount: vatAmount,
        total_due: totalDue,
        status: "sent",
        sent_date: new Date().toISOString(),
        created_by_id: opts.createdById ?? null,
      })
      .select("id, invoice_number")
      .single();
    if (error) return { error: error.message };

    // Agency-branded PDF billing the contractor, with SWIFT payment details.
    try {
      const branding = buildAgencyBranding(settings ?? null);
      const vatRate = vatAmount > 0 ? 20 : 0;
      const items = [{ service_name: `Agency commission (${feePercent}% of £${commissionBase.toFixed(2)}) — ${job.title ?? "Job"}`, quantity: 1, unit_price: commission, total: commission }];
      const pdfInvoice: PdfInvoice = {
        invoice_number: inserted.invoice_number,
        invoice_type: "standard",
        created_date: new Date().toISOString(),
        due_date: null,
        customer_name: contractorName,
        customer_email: contractor?.email ?? null,
        customer_address: contractorAddress,
        items,
        subtotal: commission,
        discount_amount: 0,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total: totalDue,
        amount_paid: 0,
        notes: contractorPay > 0
          ? `Agency fee of ${feePercent}% on the company share of job "${job.title ?? ""}" (job value £${jobValue.toFixed(2)} − contractor pay £${contractorPay.toFixed(2)} = £${commissionBase.toFixed(2)}).`
          : `Agency fee of ${feePercent}% on job "${job.title ?? ""}" (job value £${jobValue.toFixed(2)}).`,
      };
      const pdfBase64 = generateInvoicePdfBase64(pdfInvoice, branding);

      if (contractor?.email) {
        const emailBranding = await getBranding(supabase);
        const from = settings?.agency_email
          ? `${branding.name} <${settings.agency_email}>`
          : emailBranding.from;
        await sendEmail({
          to: contractor.email,
          from,
          subject: `Commission invoice ${inserted.invoice_number} — ${job.title ?? "Job"}`,
          html: invoiceEmailHtml(
            { invoice_number: inserted.invoice_number, customer_name: contractorName, customer_address: contractorAddress, due_date: null, items, subtotal: commission, vat_rate: vatRate, vat_amount: vatAmount, total: totalDue, amount_paid: 0 },
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
