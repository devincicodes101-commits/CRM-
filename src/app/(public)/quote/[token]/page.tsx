import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteActions } from "./quote-actions";
import type { Quote } from "@/lib/schemas/quotes";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("quote_number", token)
    .single<Quote>();

  if (!quote) notFound();

  const isExpired =
    quote.valid_until && new Date(quote.valid_until) < new Date();
  const canRespond = quote.status === "sent" && !isExpired;

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "text-muted-foreground" },
    sent: { label: "Awaiting Response", color: "text-blue-600 dark:text-blue-400" },
    accepted: { label: "Accepted", color: "text-green-600 dark:text-green-400" },
    declined: { label: "Declined", color: "text-destructive" },
    expired: { label: "Expired", color: "text-muted-foreground" },
  };

  const statusInfo = STATUS_LABELS[quote.status] ?? STATUS_LABELS.sent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-background p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Quotation</p>
            <h1 className="text-2xl font-bold font-mono">#{quote.quote_number}</h1>
          </div>
          <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Prepared for</p>
            <p className="font-semibold">{quote.customer_name}</p>
            {quote.customer_email && <p className="text-muted-foreground">{quote.customer_email}</p>}
            {quote.customer_address && <p className="text-muted-foreground">{quote.customer_address}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Details</p>
            <div className="space-y-0.5 text-muted-foreground">
              <p>Issued: {new Date(quote.created_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              {quote.valid_until && (
                <p className={isExpired ? "text-destructive" : ""}>
                  Valid until: {new Date(quote.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  {isExpired && " (expired)"}
                </p>
              )}
              {quote.sales_agent_name && <p>Prepared by: {quote.sales_agent_name}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Already responded */}
      {quote.status === "accepted" && (
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-5 text-center space-y-1">
          <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Quote Accepted</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Thank you! We'll be in touch shortly to confirm your booking.
          </p>
        </div>
      )}
      {quote.status === "declined" && (
        <div className="rounded-xl border bg-muted p-5 text-center space-y-1">
          <p className="font-semibold text-muted-foreground text-lg">Quote Declined</p>
          <p className="text-sm text-muted-foreground">
            You've declined this quote. Please contact us if you'd like to discuss further.
          </p>
        </div>
      )}

      {/* Line items */}
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold text-sm">Scope of Work</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right w-16">Qty</th>
              <th className="px-4 py-3 font-medium text-right w-28">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.service_name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                <td className="px-4 py-3 text-right">£{Number(item.unit_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">£{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t p-4 bg-muted/20">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>£{Number(quote.subtotal).toFixed(2)}</span>
            </div>
            {Number(quote.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span>-£{Number(quote.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT ({quote.vat_rate}%)</span>
              <span>£{Number(quote.vat_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>£{Number(quote.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-2xl border bg-background p-5">
          <h2 className="font-semibold text-sm mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Accept / Decline */}
      {canRespond && (
        <QuoteActions quoteNumber={quote.quote_number} />
      )}

      {isExpired && quote.status === "sent" && (
        <div className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">
          This quote has expired. Please contact us for a fresh quotation.
        </div>
      )}
    </div>
  );
}