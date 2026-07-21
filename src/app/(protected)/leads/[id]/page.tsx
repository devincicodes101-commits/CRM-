import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, ArrowRightCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import { convertLeadToCustomer } from "@/app/(protected)/leads/actions";
import type { Lead } from "@/lib/schemas/leads";

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
} as const;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single<Lead>();

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Leads
          </Link>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {lead.status.replace("_", " ")}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[lead.priority ?? "medium"]} className="text-xs">
              {lead.priority} priority
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lead.status !== "won" && lead.status !== "lost" && (
            <AsyncButton
              action={convertLeadToCustomer.bind(null, id)}
              variant="secondary"
              size="sm"
            >
              <ArrowRightCircle className="size-4" /> Convert to Customer
            </AsyncButton>
          )}
          {lead.converted_to_customer_id && (
            <Link
              href={`/customers/${lead.converted_to_customer_id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View Customer
            </Link>
          )}
          <Link
            href={`/leads/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h2>
          <dl className="space-y-2 text-sm">
            {lead.email && <Row label="Email" value={lead.email} />}
            {lead.phone && <Row label="Phone" value={lead.phone} />}
            {lead.address && <Row label="Address" value={lead.address} />}
            {lead.source && <Row label="Source" value={lead.source.replace("_", " ")} />}
            {lead.service_interest && <Row label="Interest" value={lead.service_interest} />}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pipeline</h2>
          <dl className="space-y-2 text-sm">
            {lead.estimated_value != null && (
              <Row label="Est. Value" value={`£${Number(lead.estimated_value).toLocaleString()}`} />
            )}
            {lead.assigned_to && <Row label="Assigned To" value={lead.assigned_to} />}
            {lead.follow_up_date && (
              <Row
                label="Follow-up"
                value={new Date(lead.follow_up_date).toLocaleDateString("en-GB")}
              />
            )}
            <Row label="Consent" value={lead.consent_given ? "Given" : "Not given"} />
          </dl>
        </div>
      </div>

      {lead.message && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Message
          </h2>
          <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
        </div>
      )}
      {lead.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
      {lead.call_notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Call Notes
          </h2>
          <p className="text-sm whitespace-pre-wrap">{lead.call_notes}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-muted-foreground capitalize">{label}</dt>
      <dd className="break-words capitalize">{value}</dd>
    </div>
  );
}