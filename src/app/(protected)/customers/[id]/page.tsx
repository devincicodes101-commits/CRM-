import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/lib/schemas/customers";

const STATUS_VARIANT = {
  lead: "secondary",
  active: "default",
  inactive: "outline",
} as const;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single<Customer>();

  if (!customer) notFound();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, total, status, created_date")
    .eq("customer_id", id)
    .order("created_date", { ascending: false })
    .limit(5);

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, scheduled_date")
    .eq("customer_id", id)
    .order("scheduled_date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Customers
          </Link>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={STATUS_VARIANT[customer.status] ?? "outline"}>
              {customer.status}
            </Badge>
            <span className="text-sm text-muted-foreground capitalize">{customer.client_type}</span>
          </div>
        </div>
        <Link
          href={`/customers/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Pencil className="size-4" /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact</h2>
          <dl className="space-y-2 text-sm">
            {customer.company && <Row label="Company" value={customer.company} />}
            {customer.email && <Row label="Email" value={customer.email} />}
            {customer.phone && <Row label="Phone" value={customer.phone} />}
            {customer.address && (
              <Row
                label="Address"
                value={[customer.address, customer.city, customer.postcode]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Financials</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Total Spent" value={`£${(customer.total_spent ?? 0).toFixed(2)}`} />
            {customer.average_rating != null && (
              <Row label="Avg Rating" value={`${customer.average_rating.toFixed(1)} / 5`} />
            )}
          </dl>
        </div>
      </div>

      {customer.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Recent Quotes
            </h2>
            <Link
              href={`/quotes/new?customer_id=${id}`}
              className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
            >
              + Quote
            </Link>
          </div>
          {!quotes?.length ? (
            <p className="text-sm text-muted-foreground">No quotes yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {quotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between text-sm">
                  <Link href={`/quotes/${q.id}`} className="text-primary hover:underline">
                    #{q.quote_number}
                  </Link>
                  <span className="text-muted-foreground">£{Number(q.total).toFixed(2)}</span>
                  <Badge variant="outline" className="text-xs">
                    {q.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Recent Jobs
            </h2>
            <Link
              href={`/jobs/new?customer_id=${id}`}
              className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
            >
              + Job
            </Link>
          </div>
          {!jobs?.length ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between text-sm">
                  <Link href={`/jobs/${j.id}`} className="text-primary hover:underline">
                    {j.title}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {j.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}