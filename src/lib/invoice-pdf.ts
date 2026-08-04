import { jsPDF } from "jspdf";

// §8 — server-side white-label invoice PDF. Mirrors the client InvoicePdfButton
// layout but resolves BRANDING (contractor for white-label, else company) and
// renders bank details + terms. Returns base64 for Resend attachment / download.

export type InvoiceBranding = {
  name: string;
  logoUrl: string | null;
  addressLines: string[];
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  bankAccountName: string | null;
  bankSortCode: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  terms: string | null;
};

type ContractorBrandingRow = {
  company_name: string | null;
  contact_name: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_postcode: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  terms_conditions: string | null;
};

type CompanyBrandingRow = {
  company_name: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  bank_account_name: string | null;
  bank_sort_code: string | null;
  bank_account_number: string | null;
  terms_and_conditions: string | null;
};

function compact(...parts: (string | null | undefined)[]): string[] {
  return parts.map((p) => p?.trim()).filter((p): p is string => !!p);
}

// §8/§9 — pick the branding: contractor when white-label AND a contractor is
// assigned; otherwise the company. company-direct always uses the company.
export function buildInvoiceBranding(opts: {
  invoiceMode: string | null;
  contractor: ContractorBrandingRow | null;
  company: CompanyBrandingRow | null;
}): InvoiceBranding {
  const { invoiceMode, contractor, company } = opts;
  if (invoiceMode === "white_label" && contractor) {
    return {
      name: contractor.company_name || contractor.contact_name || "Contractor",
      logoUrl: contractor.logo_url,
      addressLines: compact(
        contractor.address_line1,
        contractor.address_line2,
        compact(contractor.address_city, contractor.address_postcode).join(", "),
      ),
      email: contractor.email,
      phone: contractor.phone,
      vatNumber: contractor.vat_number,
      bankAccountName: contractor.bank_account_name,
      bankSortCode: contractor.bank_sort_code,
      bankAccountNumber: contractor.bank_account_number,
      bankIban: null,
      terms: contractor.terms_conditions,
    };
  }
  return {
    name: company?.company_name || "BuildStream",
    logoUrl: company?.logo_url ?? null,
    addressLines: compact(company?.address, compact(company?.city, company?.postcode).join(", ")),
    email: company?.email ?? null,
    phone: company?.phone ?? null,
    vatNumber: company?.vat_number ?? null,
    bankAccountName: company?.bank_account_name ?? null,
    bankSortCode: company?.bank_sort_code ?? null,
    bankAccountNumber: company?.bank_account_number ?? null,
    bankIban: null,
    terms: company?.terms_and_conditions ?? null,
  };
}

export type PdfInvoice = {
  invoice_number: string;
  invoice_type: string;
  created_date: string;
  due_date: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_address: string | null;
  items: { service_name: string; description?: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
};

const money = (n: number) => `£${Number(n ?? 0).toFixed(2)}`;

export function generateInvoicePdfBase64(inv: PdfInvoice, b: InvoiceBranding): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  const isDeposit = inv.invoice_type === "deposit";
  const title = isDeposit ? "DEPOSIT INVOICE" : inv.invoice_type === "credit_note" ? "CREDIT NOTE" : "INVOICE";

  // Header: branding name (left), doc title (right)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(b.name, margin, y);
  doc.setFontSize(20);
  doc.text(title, pageW - margin, y, { align: "right" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  for (const line of b.addressLines) {
    doc.text(line, margin, y);
    y += 4;
  }
  if (b.vatNumber) { doc.text(`VAT: ${b.vatNumber}`, margin, y); y += 4; }
  if (b.email) { doc.text(b.email, margin, y); y += 4; }

  // Invoice meta (right)
  let ry = 26;
  doc.text(`Invoice #${inv.invoice_number}`, pageW - margin, ry, { align: "right" }); ry += 5;
  doc.text(`Date: ${new Date(inv.created_date).toLocaleDateString("en-GB")}`, pageW - margin, ry, { align: "right" }); ry += 5;
  if (inv.due_date) { doc.text(`Due: ${new Date(inv.due_date).toLocaleDateString("en-GB")}`, pageW - margin, ry, { align: "right" }); }

  y = Math.max(y, 46);
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Bill to (from the CUSTOMER — never staff)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text("BILLED TO", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(inv.customer_name, margin, y);
  if (inv.customer_email) { y += 5; doc.text(inv.customer_email, margin, y); }
  if (inv.customer_address) {
    y += 5;
    const lines = doc.splitTextToSize(inv.customer_address, 80);
    doc.text(lines, margin, y);
    y += (lines.length - 1) * 5;
  }

  // Items
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text("DESCRIPTION", margin, y);
  doc.text("QTY", 120, y, { align: "right" });
  doc.text("UNIT", 155, y, { align: "right" });
  doc.text("TOTAL", pageW - margin, y, { align: "right" });
  y += 2;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of inv.items ?? []) {
    doc.text(String(item.service_name), margin, y);
    doc.text(String(item.quantity), 120, y, { align: "right" });
    doc.text(money(item.unit_price), 155, y, { align: "right" });
    doc.text(money(item.total), pageW - margin, y, { align: "right" });
    y += 7;
    if (y > 250) { doc.addPage(); y = 20; }
  }

  // Totals
  y += 4;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  const totals: [string, string][] = [["Subtotal", money(inv.subtotal)]];
  if (Number(inv.discount_amount) > 0) totals.push(["Discount", `-${money(inv.discount_amount)}`]);
  totals.push([`VAT (${inv.vat_rate}%)`, money(inv.vat_amount)]);
  doc.setFontSize(9);
  for (const [label, value] of totals) {
    doc.setTextColor(100);
    doc.text(label, 145, y);
    doc.setTextColor(0);
    doc.text(value, pageW - margin, y, { align: "right" });
    y += 6;
  }
  y += 2;
  doc.setDrawColor(0);
  doc.line(140, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", 145, y);
  doc.text(money(inv.total), pageW - margin, y, { align: "right" });

  if (Number(inv.amount_paid) > 0) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Amount Paid", 145, y);
    doc.text(money(inv.amount_paid), pageW - margin, y, { align: "right" });
    y += 6;
    const balance = Math.max(0, Number(inv.total) - Number(inv.amount_paid));
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Balance Due", 145, y);
    doc.text(money(balance), pageW - margin, y, { align: "right" });
  }

  // Bank details
  if (b.bankAccountName || b.bankAccountNumber || b.bankIban) {
    y += 14;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120);
    doc.text("PAYMENT DETAILS", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    if (b.bankAccountName) { doc.text(`Account name: ${b.bankAccountName}`, margin, y); y += 4; }
    if (b.bankSortCode) { doc.text(`Sort code: ${b.bankSortCode}`, margin, y); y += 4; }
    if (b.bankAccountNumber) { doc.text(`Account no: ${b.bankAccountNumber}`, margin, y); y += 4; }
    if (b.bankIban) { doc.text(`IBAN: ${b.bankIban}`, margin, y); y += 4; }
  }

  // Terms / notes
  const footer = compact(inv.notes, b.terms).join("\n\n");
  if (footer) {
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(120);
    const lines = doc.splitTextToSize(footer, pageW - margin * 2);
    doc.text(lines, margin, y);
  }

  const buf = doc.output("arraybuffer");
  return Buffer.from(buf).toString("base64");
}
