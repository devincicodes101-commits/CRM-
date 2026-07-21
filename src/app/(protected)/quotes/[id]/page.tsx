import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Send, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sendQuote, updateQuoteStatus } from "@/app/(protected)/quotes/actions";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import type { Quote } from "@/lib/schemas/quotes";

const STATUS_VARIANT = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  declined: "destructive",
  expired: "outline",
} as const;

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single<Quote>();

  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/quotes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Quotes
          </Link>
          <h1 className="text-2xl font-bold">Quote #{quote.quote_number}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={STATUS_VARIANT[quote.status] ?? "outline"} className="capitalize">
              {quote.status}
            </Badge>
            {quote.valid_until && (
              <span className="text-sm text-muted-foreground">
                Valid until {new Date(quote.valid_until).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quote.status === "draft" && (
            <AsyncButton action={sendQuote.bind(null, id)} size="sm">
              <Send className="size-4" /> Send to Customer
            </AsyncButton>
          )}
          {quote.status === "sent" && (
            <>
              <AsyncButton
                action={updateQuoteStatus.bind(null, id, "accepted")}
                variant="secondary"
                size="sm"
              >
                <CheckCircle className="size-4" /> Mark Accepted
              </AsyncButton>
              <AsyncButton
                action={updateQuoteStatus.bind(null, id, "declined")}
                variant="outline"
                size="sm"
              >
                <XCircle className="size-4" /> Mark Declined
              </AsyncButton>
            </>
          )}
          {quote.status === "sent" && (
            <CopyLinkButton
              url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/quote/${quote.quote_number}`}
              label="Copy Quote Link"
              variant="outline"
              size="sm"
            />
          )}
          <Link
            href={`/quotes/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={quote.customer_name} />
            {quote.customer_email && <Row label="Email" value={quote.customer_email} />}
            {quote.customer_address && <Row label="Address" value={quote.customer_address} />}
            <Row label="Type" value={quote.client_type} />
          </dl>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Details</h2>
          <dl className="space-y-2 text-sm">
            {quote.sales_agent_name && <Row label="Agent" value={quote.sales_agent_name} />}
            {quote.sent_date && (
              <Row label="Sent" value={new Date(quote.sent_date).toLocaleDateString("en-GB")} />
            )}
            <Row label="Template" value={quote.template_style} />
          </dl>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Line Items
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="w-[80px]">Qty</TableHead>
              <TableHead className="w-[120px]">Unit Price</TableHead>
              <TableHead className="w-[120px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(quote.items ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  No line items.
                </TableCell>
              </TableRow>
            )}
            {(quote.items ?? []).map((item, i) => (
              <TableRow key={i}>
                <TableCell>
                  <p className="font-medium">{item.service_name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>£{Number(item.unit_price).toFixed(2)}</TableCell>
                <TableCell className="font-medium">£{Number(item.total).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 border-t">
          <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>£{Number(quote.subtotal).toFixed(2)}</span>
            </div>
            {Number(quote.discount_amount) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-£{Number(quote.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT ({quote.vat_rate}%)</span>
              <span>£{Number(quote.vat_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total</span>
              <span>£{Number(quote.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words capitalize">{value}</dd>
    </div>
  );
}