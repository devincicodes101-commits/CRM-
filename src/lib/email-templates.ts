import type { SupabaseClient } from "@supabase/supabase-js";

// Branded transactional email templates for the quote → booking flow.
// Ports Base44's sendQuoteToCustomer / publicBookJob email bodies 1:1.

const VERIFIED_DOMAINS = ["asbestosteams.com"];
const FALLBACK_SENDER = "info@asbestosteams.com";

export type Branding = {
  companyName: string;
  tagline: string;
  logoUrl: string | null;
  brandColor: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  vatNumber: string | null;
  companyNumber: string | null;
  quoteFooterText: string | null;
  invoiceFooterText: string | null;
  termsAndConditions: string | null;
  bankAccountName: string | null;
  bankSortCode: string | null;
  bankAccountNumber: string | null;
  workingDays: number[];
  from: string;
  /** The public URL of THIS app (Vercel), used to build customer links.
   *  Deliberately NOT company_settings.base_url — that points at the old site. */
  appBaseUrl: string;
};

export type BrandingRow = {
  company_name: string | null;
  tagline: string | null;
  logo_url: string | null;
  primary_color: string | null;
  email: string | null;
  sender_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  vat_number: string | null;
  company_number: string | null;
  quote_footer_text: string | null;
  invoice_footer_text: string | null;
  terms_and_conditions: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  working_days: number[] | null;
};

function senderEmail(row: BrandingRow | null): string {
  const s = row?.sender_email?.trim();
  if (s && VERIFIED_DOMAINS.some((d) => s.toLowerCase().endsWith(`@${d}`))) return s;
  return FALLBACK_SENDER;
}

export async function getBranding(supabase: SupabaseClient): Promise<Branding> {
  const { data } = await supabase
    .from("company_settings")
    .select(
      "company_name, tagline, logo_url, primary_color, email, sender_email, phone, address, city, postcode, vat_number, company_number, quote_footer_text, invoice_footer_text, terms_and_conditions, bank_account_name, bank_sort_code, bank_account_number, working_days",
    )
    .limit(1)
    .maybeSingle<BrandingRow>();

  const companyName = data?.company_name?.trim() || "BuildStream";
  return {
    companyName,
    tagline: data?.tagline?.trim() || "",
    logoUrl: data?.logo_url || null,
    brandColor: data?.primary_color || "#f97316",
    email: data?.email || null,
    phone: data?.phone || null,
    address: data?.address || null,
    city: data?.city || null,
    postcode: data?.postcode || null,
    vatNumber: data?.vat_number || null,
    companyNumber: data?.company_number || null,
    quoteFooterText: data?.quote_footer_text || null,
    invoiceFooterText: data?.invoice_footer_text || null,
    termsAndConditions: data?.terms_and_conditions || null,
    bankAccountName: data?.bank_account_name || null,
    bankSortCode: data?.bank_sort_code || null,
    bankAccountNumber: data?.bank_account_number || null,
    workingDays: data?.working_days ?? [1, 2, 3, 4, 5],
    from: `${companyName} <${senderEmail(data ?? null)}>`,
    appBaseUrl: (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, ""),
  };
}

const gbp = (n: number) =>
  `£${(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

function logoBlock(b: Branding): string {
  return b.logoUrl
    ? `<img src="${esc(b.logoUrl)}" alt="${esc(b.companyName)}" style="max-height:40px;display:block">`
    : `<span style="color:#fff;font-size:20px;font-weight:700">${esc(b.companyName)}</span>`;
}

function footerBlock(b: Branding): string {
  const contact = b.email
    ? `<a href="mailto:${esc(b.email)}" style="color:#fff;text-decoration:underline">${esc(b.email)}</a>`
    : "";
  const extra = b.quoteFooterText
    ? `<p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.8);text-align:center">${esc(b.quoteFooterText)}</p>`
    : "";
  return `<tr><td style="padding:20px 32px;background:${b.brandColor}">
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.9);text-align:center">Questions? Contact us at ${contact}</p>
    ${extra}
  </td></tr>`;
}

export type QuoteEmailData = {
  quote_number: string;
  customer_name: string | null;
  customer_address: string | null;
  valid_until: string | null;
  items: { service_name: string; quantity?: number; total?: number }[];
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
};

export function quoteEmailHtml(quote: QuoteEmailData, b: Branding, publicQuoteUrl: string): string {
  const validUntil = quote.valid_until
    ? new Date(quote.valid_until).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const itemRows = (quote.items ?? [])
    .map(
      (it) => `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333">${esc(it.service_name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center">${it.quantity ?? 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:bold;color:#333;text-align:right">${gbp(it.total ?? 0)}</td>
    </tr>`,
    )
    .join("");

  const discountRows =
    quote.discount_amount > 0
      ? `<tr style="background:#f9f9f9"><td style="padding:8px 12px;font-size:13px;color:#555">Subtotal</td><td style="padding:8px 12px;font-size:13px;text-align:right">${gbp(quote.subtotal)}</td></tr>
         <tr><td style="padding:8px 12px;font-size:13px;color:#555">Discount</td><td style="padding:8px 12px;font-size:13px;color:#e53e3e;text-align:right">-${gbp(quote.discount_amount)}</td></tr>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
    <tr><td style="background:#1a1a1a;padding:28px 32px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>${logoBlock(b)}</td>
        <td align="right"><span style="color:rgba(255,255,255,0.85);font-size:13px">QUOTATION</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 32px;border-bottom:1px solid #eee">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" width="50%">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase">Prepared For</p>
          <p style="margin:0;font-size:15px;font-weight:bold;color:#222">${esc(quote.customer_name ?? "")}</p>
          ${quote.customer_address ? `<p style="margin:4px 0 0;font-size:13px;color:#666">${esc(quote.customer_address)}</p>` : ""}
        </td>
        <td valign="top" width="50%" align="right">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase">Quote Number</p>
          <p style="margin:0 0 12px;font-size:15px;font-weight:bold;color:#222">${esc(quote.quote_number)}</p>
          ${validUntil ? `<p style="margin:0;font-size:12px;color:#888">Valid until ${validUntil}</p>` : ""}
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:24px 32px 8px">
      <p style="margin:0;font-size:15px;color:#333">Hi <strong>${esc(quote.customer_name ?? "there")}</strong>,</p>
      <p style="margin:10px 0 0;font-size:14px;color:#555;line-height:1.6">Thank you for your enquiry. Please find your personalised quotation below. You can view and accept it by clicking the button below.</p>
    </td></tr>
    ${
      itemRows
        ? `<tr><td style="padding:16px 32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
        <thead><tr style="background:#f9f9f9">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Service</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </td></tr>`
        : ""
    }
    <tr><td style="padding:0 32px 24px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td width="60%"></td><td width="40%">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
          ${discountRows}
          <tr style="background:#f9f9f9"><td style="padding:8px 12px;font-size:13px;color:#555">VAT (${quote.vat_rate ?? 20}%)</td><td style="padding:8px 12px;font-size:13px;text-align:right">${gbp(quote.vat_amount)}</td></tr>
          <tr style="background:${b.brandColor}"><td style="padding:12px;font-size:15px;font-weight:bold;color:#fff">Total</td><td style="padding:12px;font-size:15px;font-weight:bold;color:#fff;text-align:right">${gbp(quote.total)}</td></tr>
        </table>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:0 32px 32px;text-align:center">
      <a href="${esc(publicQuoteUrl)}" style="display:inline-block;background:#1a1f36;color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;min-width:260px">View Your Quote Online →</a>
      <p style="margin:12px 0 0;font-size:11px;color:#bbb">Or copy this link: <a href="${esc(publicQuoteUrl)}" style="color:${b.brandColor};word-break:break-all">${esc(publicQuoteUrl)}</a></p>
    </td></tr>
    ${footerBlock(b)}
  </table>
</td></tr></table></body></html>`;
}

export type BookingEmailData = {
  jobTitle: string;
  customerName: string | null;
  jobDateLong: string;
  jobAddress: string | null;
};

export function bookingConfirmationHtml(
  d: BookingEmailData,
  b: Branding,
  rescheduleLink: string,
): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
    <tr><td style="background:#1a1a1a;padding:28px 32px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>${logoBlock(b)}</td>
        <td align="right" style="color:rgba(255,255,255,0.85);font-size:13px">BOOKING CONFIRMED</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px">✓ You're booked in</h2>
      <p style="margin:0;color:#666;font-size:14px">Your service has been scheduled</p>
      <p style="margin:20px 0 0;color:#333">Hi ${esc(d.customerName ?? "there")},</p>
      <p style="margin:12px 0;color:#555;line-height:1.6">Great news — your booking is confirmed. Here are your appointment details:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:6px;overflow:hidden">
        <tr style="background:#f9f9f9"><td style="padding:10px 12px;font-size:13px;color:#888;width:120px">Job</td><td style="padding:10px 12px;font-size:14px;color:#333;font-weight:600">${esc(d.jobTitle)}</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#888">Date</td><td style="padding:10px 12px;font-size:14px;color:#333;font-weight:600">${esc(d.jobDateLong)}</td></tr>
        ${d.jobAddress ? `<tr style="background:#f9f9f9"><td style="padding:10px 12px;font-size:13px;color:#888">Address</td><td style="padding:10px 12px;font-size:14px;color:#333">${esc(d.jobAddress)}</td></tr>` : ""}
      </table>
      <p style="color:#555;line-height:1.6">Our team will arrive on the scheduled date. Please ensure someone is available at the property.</p>
      <div style="margin:24px 0;padding:20px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;text-align:center">
        <p style="margin:0 0 6px;color:#1e40af;font-weight:700;font-size:15px">Need a different date?</p>
        <p style="margin:0 0 6px;color:#3b5b9c;font-size:13px;line-height:1.6">If this date doesn't suit you, you can reschedule now using the button below. If the date shown above is correct, there's nothing to do.</p>
        <p style="margin:0 0 14px;color:#7089b5;font-size:11px;line-height:1.5">Please note: all appointments are booked as all-day appointments; we cannot guarantee a specific arrival time unless prior confirmation was agreed at the time of booking.</p>
        <a href="${esc(rescheduleLink)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700">📅 Reschedule My Appointment</a>
        <p style="margin:10px 0 0;font-size:11px;color:#aac;text-align:center">Or copy this link: <a href="${esc(rescheduleLink)}" style="color:#2563eb;word-break:break-all">${esc(rescheduleLink)}</a></p>
      </div>
      <p style="color:#555">Best regards,<br><strong>${esc(b.companyName)}</strong></p>
    </td></tr>
    ${footerBlock(b)}
  </table>
</td></tr></table></body></html>`;
}

export function salesBookedNotifyHtml(
  d: BookingEmailData & { quoteNumber: string },
  b: Branding,
): string {
  return `<div style="font-family:Arial,sans-serif;color:#333">
    <h2 style="color:${b.brandColor}">✅ Quote Accepted &amp; Job Booked</h2>
    <p><strong>Quote:</strong> ${esc(d.quoteNumber)}</p>
    <p><strong>Customer:</strong> ${esc(d.customerName ?? "")}</p>
    <p><strong>Job:</strong> ${esc(d.jobTitle)}</p>
    <p><strong>Date:</strong> ${esc(d.jobDateLong)}</p>
    ${d.jobAddress ? `<p><strong>Address:</strong> ${esc(d.jobAddress)}</p>` : ""}
    <p style="color:#666">The job has been automatically added to the calendar.</p>
  </div>`;
}

export type InvoiceEmailData = {
  invoice_number: string;
  customer_name: string | null;
  customer_address: string | null;
  due_date: string | null;
  items: { service_name: string; quantity?: number; unit_price?: number; total?: number }[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
};

export function invoiceEmailHtml(inv: InvoiceEmailData, b: Branding): string {
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const amountDue = Math.max(0, (inv.total ?? 0) - (inv.amount_paid ?? 0));

  const itemRows = (inv.items ?? [])
    .map(
      (it) => `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333">${esc(it.service_name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center">${it.quantity ?? 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right">${gbp(it.unit_price ?? it.total ?? 0)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:bold;color:#333;text-align:right">${gbp(it.total ?? 0)}</td>
    </tr>`,
    )
    .join("");

  const hasBank = b.bankAccountName || b.bankSortCode || b.bankAccountNumber;
  const bankBlock = hasBank
    ? `<tr><td style="padding:0 32px 24px">
      <div style="border-left:4px solid #2563eb;background:#eff6ff;border-radius:6px;padding:16px 20px">
        <p style="margin:0 0 10px;color:#1e40af;font-weight:700;font-size:13px;letter-spacing:0.5px">BANK TRANSFER DETAILS</p>
        ${b.bankAccountName ? `<p style="margin:0 0 4px;font-size:13px;color:#333"><span style="color:#888;display:inline-block;width:90px">Payable To:</span> <strong>${esc(b.bankAccountName)}</strong></p>` : ""}
        ${b.bankSortCode ? `<p style="margin:0 0 4px;font-size:13px;color:#333"><span style="color:#888;display:inline-block;width:90px">Sort Code:</span> <strong>${esc(b.bankSortCode)}</strong></p>` : ""}
        ${b.bankAccountNumber ? `<p style="margin:0;font-size:13px;color:#333"><span style="color:#888;display:inline-block;width:90px">Account:</span> <strong>${esc(b.bankAccountNumber)}</strong></p>` : ""}
      </div>
    </td></tr>`
    : "";

  const termsBlock = b.termsAndConditions
    ? `<tr><td style="padding:0 32px 24px">
      <p style="margin:0;font-size:11px;color:#999;line-height:1.6"><strong style="color:#666">Terms &amp; Conditions:</strong> ${esc(b.termsAndConditions)}</p>
    </td></tr>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
    <tr><td style="background:#1a1a1a;padding:28px 32px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>${logoBlock(b)}</td>
        <td align="right"><span style="color:rgba(255,255,255,0.85);font-size:15px;letter-spacing:1px">INVOICE</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 32px;border-bottom:1px solid #eee">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" width="55%">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase">Billed To</p>
          <p style="margin:0;font-size:15px;font-weight:bold;color:#222">${esc(inv.customer_name ?? "")}</p>
          ${inv.customer_address ? `<p style="margin:4px 0 0;font-size:13px;color:#666">${esc(inv.customer_address)}</p>` : ""}
        </td>
        <td valign="top" width="45%" align="right">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase">Invoice Number</p>
          <p style="margin:0 0 12px;font-size:15px;font-weight:bold;color:#222">${esc(inv.invoice_number)}</p>
          ${dueDate ? `<p style="margin:0 0 2px;color:#888;font-size:12px;text-transform:uppercase">Due Date</p><p style="margin:0;font-size:14px;font-weight:bold;color:${b.brandColor}">${dueDate}</p>` : ""}
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:24px 32px 8px">
      <p style="margin:0;font-size:15px;color:#333">Hi <strong>${esc(inv.customer_name ?? "there")}</strong>,</p>
      <p style="margin:10px 0 0;font-size:14px;color:#555;line-height:1.6">Please find your invoice details below. Kindly arrange payment by the due date shown above.</p>
    </td></tr>
    ${
      itemRows
        ? `<tr><td style="padding:16px 32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
        <thead><tr style="background:#f9f9f9">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Description</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </td></tr>`
        : ""
    }
    <tr><td style="padding:0 32px 20px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td width="55%"></td><td width="45%">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden">
          <tr><td style="padding:8px 12px;font-size:13px;color:#555">Subtotal</td><td style="padding:8px 12px;font-size:13px;text-align:right">${gbp(inv.subtotal)}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px 12px;font-size:13px;color:#555">VAT (${inv.vat_rate ?? 20}%)</td><td style="padding:8px 12px;font-size:13px;text-align:right">${gbp(inv.vat_amount)}</td></tr>
          <tr style="background:${b.brandColor}"><td style="padding:12px;font-size:15px;font-weight:bold;color:#fff">Amount Due</td><td style="padding:12px;font-size:15px;font-weight:bold;color:#fff;text-align:right">${gbp(amountDue)}</td></tr>
        </table>
      </td></tr></table>
    </td></tr>
    ${bankBlock}
    ${termsBlock}
    ${footerBlock(b)}
  </table>
</td></tr></table></body></html>`;
}

export function photoInviteHtml(
  d: BookingEmailData,
  b: Branding,
  photoLink: string,
): string {
  return `<div style="font-family:Arial,sans-serif;color:#333;max-width:560px">
    <h2 style="color:${b.brandColor}">📸 Help us prepare for your job</h2>
    <p>Hi ${esc(d.customerName ?? "there")},</p>
    <p>Your booking is confirmed for <strong>${esc(d.jobDateLong)}</strong>. To help our team arrive fully prepared, please upload a few photos of the area we'll be working on — no login needed.</p>
    <p style="margin:20px 0"><a href="${esc(photoLink)}" style="display:inline-block;background:${b.brandColor};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700">Upload Site Photos</a></p>
    <p style="color:#666;font-size:13px">Or copy this link: <a href="${esc(photoLink)}">${esc(photoLink)}</a></p>
    <p style="color:#555">Thanks,<br><strong>${esc(b.companyName)}</strong></p>
  </div>`;
}
