import { jsPDF } from "jspdf";

// §8 — server-side white-label invoice PDF, styled to match the Base44 invoice:
// dark header band, orange accents, line-item table, payment-info box, footer.
// Resolves BRANDING (contractor for white-label, else company). Returns base64
// for Resend attachment / download.

export type InvoiceBranding = {
  name: string;
  tagline: string | null;
  brandColor: string; // hex, e.g. "#f97316"
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
  tagline: string | null;
  primary_color: string | null;
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

const DEFAULT_BRAND = "#f97316";

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
      tagline: null,
      brandColor: company?.primary_color || DEFAULT_BRAND,
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
    tagline: company?.tagline ?? null,
    brandColor: company?.primary_color || DEFAULT_BRAND,
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

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [249, 115, 22];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function longDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function generateInvoicePdfBase64(inv: PdfInvoice, b: InvoiceBranding): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 20;
  const [br, bg, bb] = hexToRgb(b.brandColor);
  const ink: [number, number, number] = [40, 40, 40];
  const muted: [number, number, number] = [120, 120, 120];

  const isDeposit = inv.invoice_type === "deposit";
  const title = isDeposit ? "DEPOSIT INVOICE" : inv.invoice_type === "credit_note" ? "CREDIT NOTE" : "INVOICE";

  // ── Dark header band ───────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, W, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(b.name, M, 15);

  let hy = 20;
  doc.setFont("helvetica", "normal");
  if (b.tagline) {
    doc.setFontSize(8);
    doc.setTextColor(210, 210, 210);
    doc.text(b.tagline, M, hy);
    hy += 4;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(190, 190, 190);
  for (const line of b.addressLines) {
    doc.text(line, M, hy);
    hy += 3.6;
  }
  const contact = compact(b.phone, b.email).join("  ·  ");
  if (contact) {
    doc.text(contact, M, hy);
    hy += 3.6;
  }
  if (b.vatNumber) doc.text(`VAT: ${b.vatNumber}`, M, hy);

  // ── Title + orange rule ──────────────────────────────────────────────────────
  let y = 56;
  doc.setDrawColor(br, bg, bb);
  doc.setLineWidth(0.9);
  doc.line(M, y, W - M, y);
  doc.setLineWidth(0.2);
  y += 11;
  doc.setTextColor(br, bg, bb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, M, y);

  // ── Meta ─────────────────────────────────────────────────────────────────────
  y += 10;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice Number: ${inv.invoice_number}`, M, y);
  y += 5.5;
  doc.text(`Invoice Date: ${longDate(inv.created_date)}`, M, y);
  if (inv.due_date) {
    y += 5.5;
    doc.text(`Due Date: ${longDate(inv.due_date)}`, M, y);
  }

  // ── Bill To ──────────────────────────────────────────────────────────────────
  y += 12;
  doc.setTextColor(br, bg, bb);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", M, y);
  y += 6;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inv.customer_name, M, y);
  if (inv.customer_address) {
    y += 5;
    const lines = doc.splitTextToSize(inv.customer_address, 90);
    doc.text(lines, M, y);
    y += (lines.length - 1) * 5;
  }
  if (inv.customer_email) {
    y += 5;
    doc.setTextColor(...muted);
    doc.text(inv.customer_email, M, y);
  }

  // ── Line-item table ──────────────────────────────────────────────────────────
  y += 14;
  const qtyX = 118, unitX = 152, amtX = W - M;
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y - 5, W - M * 2, 8, "F");
  doc.setTextColor(70, 70, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DESCRIPTION", M + 2, y);
  doc.text("QTY", qtyX, y, { align: "right" });
  doc.text("UNIT PRICE", unitX, y, { align: "right" });
  doc.text("AMOUNT", amtX, y, { align: "right" });
  y += 9;

  doc.setTextColor(...ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of inv.items ?? []) {
    doc.text(String(item.service_name), M + 2, y);
    doc.text(String(item.quantity), qtyX, y, { align: "right" });
    doc.text(money(item.unit_price), unitX, y, { align: "right" });
    doc.text(money(item.total), amtX, y, { align: "right" });
    y += 8;
    if (y > 250) { doc.addPage(); y = 25; }
  }

  // ── Totals (right aligned) ───────────────────────────────────────────────────
  y += 2;
  doc.setDrawColor(215, 215, 215);
  doc.line(120, y, W - M, y);
  y += 7;
  const labelX = 150;
  doc.setFontSize(10);
  const rows: [string, string][] = [["Subtotal:", money(inv.subtotal)]];
  if (Number(inv.discount_amount) > 0) rows.push(["Discount:", `-${money(inv.discount_amount)}`]);
  rows.push([`VAT (${inv.vat_rate}%):`, money(inv.vat_amount)]);
  for (const [label, value] of rows) {
    doc.setTextColor(...muted);
    doc.text(label, labelX, y);
    doc.setTextColor(...ink);
    doc.text(value, amtX, y, { align: "right" });
    y += 6;
  }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(br, bg, bb);
  doc.text("TOTAL:", labelX, y);
  doc.text(money(inv.total), amtX, y, { align: "right" });

  if (Number(inv.amount_paid) > 0) {
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text("Amount Paid:", labelX, y);
    doc.text(money(inv.amount_paid), amtX, y, { align: "right" });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text("Balance Due:", labelX, y);
    doc.text(money(Math.max(0, Number(inv.total) - Number(inv.amount_paid))), amtX, y, { align: "right" });
  }

  // ── Payment information box ──────────────────────────────────────────────────
  if (b.bankAccountName || b.bankAccountNumber || b.bankIban) {
    y += 16;
    const lines = compact(
      b.bankAccountName ? `Payable To: ${b.bankAccountName}` : null,
      b.bankSortCode ? `Sort Code: ${b.bankSortCode}` : null,
      b.bankAccountNumber ? `Account Number: ${b.bankAccountNumber}` : null,
      b.bankIban ? `IBAN: ${b.bankIban}` : null,
    );
    const boxH = 12 + lines.length * 5;
    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(M, y, W - M * 2, boxH, 1.5, 1.5, "FD");
    doc.setTextColor(br, bg, bb);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Payment Information", M + 5, y + 7);
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    let ly = y + 13;
    for (const line of lines) {
      doc.text(line, M + 5, ly);
      ly += 5;
    }
    y += boxH;
  }

  // ── Terms / notes ────────────────────────────────────────────────────────────
  const footerText = compact(inv.notes, b.terms).join("\n\n");
  if (footerText) {
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(doc.splitTextToSize(footerText, W - M * 2), M, y);
  }

  // ── Footer line ──────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Invoice #${inv.invoice_number} — Generated ${longDate(inv.created_date)}`,
    W / 2,
    H - 12,
    { align: "center" },
  );

  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}
