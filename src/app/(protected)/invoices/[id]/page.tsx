import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { InvoicePdfButton } from "@/components/invoices/invoice-pdf";
import { PaymentDialog } from "@/components/invoices/payment-dialog";
import { sendInvoice, markOverdue, deleteInvoice } from "@/app/(protected)/invoices/actions";
import { buildInvoiceBranding } from "@/lib/invoice-pdf";
import type { Invoice } from "@/lib/schemas/invoices";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single<Invoice>();

  if (!invoice) notFound();

  // Resolve branding for the header card (contractor for white-label, else company).
  const { data: settings } = await supabase
    .from("company_settings")
    .select("company_name, tagline, primary_color, logo_url, address, city, postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_and_conditions, invoice_mode")
    .limit(1)
    .maybeSingle();
  let contractor = null;
  if (invoice.assigned_contractor_id) {
    const { data } = await supabase
      .from("contractors")
      .select("company_name, contact_name, logo_url, address_line1, address_line2, address_city, address_postcode, email, phone, vat_number, bank_account_name, bank_sort_code, bank_account_number, terms_conditions")
      .eq("id", invoice.assigned_contractor_id)
      .maybeSingle();
    contractor = data;
  }
  const branding = buildInvoiceBranding({
    invoiceMode: settings?.invoice_mode ?? "company_direct",
    contractor,
    company: settings ?? null,
  });
  const titleLabel =
    invoice.invoice_type === "deposit" ? "DEPOSIT INVOICE" :
    invoice.invoice_type === "credit_note" ? "CREDIT NOTE" : "INVOICE";

  const balance = Number(invoice.total) - Number(invoice.amount_paid);
  const isOverdue =
    invoice.due_date &&
    new Date(invoice.due_date) < new Date() &&
    !["paid", "cancelled"].includes(invoice.status);

  return (
    <div className="space-y-6">
      {/* Back link + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Invoices
        </Link>
        <div className="flex gap-2 flex-wrap">
          <InvoicePdfButton invoice={invoice} />
          {invoice.status === "draft" && (
            <AsyncButton action={sendInvoice.bind(null, id)} size="sm">
              <Send className="size-4" /> Send Invoice
            </AsyncButton>
          )}
          {["sent", "part_paid", "overdue"].includes(invoice.status) && (
            <PaymentDialog
              invoiceId={id}
              total={Number(invoice.total)}
              amountPaid={Number(invoice.amount_paid)}
            />
          )}
          {invoice.status === "sent" && isOverdue && (
            <AsyncButton action={markOverdue.bind(null, id)} variant="outline" size="sm">
              <AlertTriangle className="size-4" /> Mark Overdue
            </AsyncButton>
          )}
          {!["paid", "cancelled"].includes(invoice.status) && (
            <Link
              href={`/invoices/${id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="size-4" /> Edit
            </Link>
          )}
          {["draft", "cancelled"].includes(invoice.status) && (
            <AsyncButton
              action={deleteInvoice.bind(null, id)}
              variant="outline"
              size="sm"
            >
              <XCircle className="size-4" /> Delete
            </AsyncButton>
          )}
        </div>
      </div>

      {/* Branded invoice card (matches the PDF / Base44 view) */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-neutral-900 text-white p-6 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            {branding.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={branding.name}
                className="size-20 rounded-lg object-contain bg-white/5 p-1.5 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight">{branding.name}</h1>
              {branding.tagline && <p className="text-sm text-white/70 mt-0.5">{branding.tagline}</p>}
              {branding.addressLines.length > 0 && (
                <p className="text-xs text-white/55 mt-2">{branding.addressLines.join(", ")}</p>
              )}
              {(branding.phone || branding.email) && (
                <p className="text-xs text-white/55">
                  {[branding.phone, branding.email].filter(Boolean).join("  ·  ")}
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold tracking-wide" style={{ color: branding.brandColor }}>
              {titleLabel}
            </p>
            <p className="text-sm text-white/70 font-mono mt-0.5">#{invoice.invoice_number}</p>
            <span className="inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-full bg-white/15 text-white capitalize">
              {invoice.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive font-medium">
          This invoice is overdue — due{" "}
          {new Date(invoice.due_date!).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}

      {/* Customer + amounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Billed To</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={invoice.customer_name} />
            {invoice.customer_email && <Row label="Email" value={invoice.customer_email} />}
            {invoice.customer_address && <Row label="Address" value={invoice.customer_address} />}
            {invoice.customer_id && (
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Profile</dt>
                <dd>
                  <Link href={`/customers/${invoice.customer_id}`} className="text-primary hover:underline">
                    View customer →
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Payment</h2>
          <dl className="space-y-2 text-sm">
            <Row
              label="Issued"
              value={new Date(invoice.created_date).toLocaleDateString("en-GB")}
            />
            {invoice.sent_date && (
              <Row label="Sent" value={new Date(invoice.sent_date).toLocaleDateString("en-GB")} />
            )}
            {invoice.due_date && (
              <Row label="Due" value={new Date(invoice.due_date).toLocaleDateString("en-GB")} />
            )}
            {invoice.paid_date && (
              <Row label="Paid" value={new Date(invoice.paid_date).toLocaleDateString("en-GB")} />
            )}
            {invoice.payment_method && (
              <Row label="Method" value={invoice.payment_method.replace("_", " ")} />
            )}
          </dl>
          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>£{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-£{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT ({invoice.vat_rate}%)</span>
              <span>£{Number(invoice.vat_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-1.5 mt-1.5">
              <span>Total</span>
              <span>£{Number(invoice.total).toFixed(2)}</span>
            </div>
            {Number(invoice.amount_paid) > 0 && (
              <>
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Paid</span>
                  <span>£{Number(invoice.amount_paid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span className={balance > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}>
                    £{Math.max(0, balance).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Line items */}
      {invoice.items && invoice.items.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Line Items</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium text-right w-20">Qty</th>
                <th className="p-3 font-medium text-right w-28">Unit Price</th>
                <th className="p-3 font-medium text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{item.service_name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">£{Number(item.unit_price).toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">£{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Linked quote/job */}
      {invoice.quote_id && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Linked</h2>
          <Link href={`/quotes/${invoice.quote_id}`} className="text-primary hover:underline text-sm">
            View quote →
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-muted-foreground capitalize">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
