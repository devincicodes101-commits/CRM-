import { notFound } from "next/navigation";
import { FileText, Briefcase, Receipt, Star } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

const gbp = (n: number | null | undefined) =>
  `£${Number(n ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
const date = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const QUOTE_COLOR: Record<string, string> = {
  accepted: "text-green-600", declined: "text-red-600", sent: "text-blue-600", draft: "text-muted-foreground", expired: "text-muted-foreground",
};
const INVOICE_COLOR: Record<string, string> = {
  paid: "text-green-600", overdue: "text-red-600", part_paid: "text-amber-600", sent: "text-blue-600", draft: "text-muted-foreground", cancelled: "text-muted-foreground",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, total_spent")
    .eq("portal_token", token)
    .single<{ id: string; name: string; email: string | null; total_spent: number | null }>();
  if (!customer) notFound();

  const match = customer.email
    ? `customer_id.eq.${customer.id},customer_email.eq.${customer.email}`
    : `customer_id.eq.${customer.id}`;

  const [quotesRes, jobsRes, invoicesRes, reviewsRes] = await Promise.all([
    supabase.from("quotes").select("id, quote_number, total, status, created_date, public_token").or(match).order("created_date", { ascending: false }),
    supabase.from("jobs").select("id, title, status, start_date, address").or(match).order("start_date", { ascending: false }),
    supabase.from("invoices").select("id, invoice_number, total, amount_paid, status, due_date").or(match).order("created_date", { ascending: false }),
    customer.email
      ? supabase.from("reviews").select("id, star_rating, review_text, created_date").eq("customer_email", customer.email).order("created_date", { ascending: false })
      : Promise.resolve({ data: [] as Row[] }),
  ]);

  const quotes = (quotesRes.data ?? []) as Row[];
  const jobs = (jobsRes.data ?? []) as Row[];
  const invoices = (invoicesRes.data ?? []) as Row[];
  const reviews = (reviewsRes.data ?? []) as Row[];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-background p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Your account</p>
        <h1 className="text-2xl font-bold mt-1">Welcome, {customer.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Everything about your quotes, jobs and invoices in one place.
        </p>
      </div>

      {/* Quotes */}
      <Section icon={<FileText className="size-4 text-blue-500" />} title="Your Quotes" empty={quotes.length === 0} emptyText="No quotes yet.">
        {quotes.map((q) => (
          <a key={q.id} href={q.public_token ? `/quote/${q.public_token}` : undefined}
            className="flex items-center justify-between px-5 py-3 hover:bg-muted/40">
            <div>
              <p className="text-sm font-medium">{q.quote_number}</p>
              <p className="text-xs text-muted-foreground">{date(q.created_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{gbp(q.total)}</p>
              <p className={`text-xs capitalize ${QUOTE_COLOR[q.status] ?? ""}`}>{q.status}</p>
            </div>
          </a>
        ))}
      </Section>

      {/* Jobs */}
      <Section icon={<Briefcase className="size-4 text-orange-500" />} title="Your Jobs" empty={jobs.length === 0} emptyText="No jobs yet.">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center justify-between px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{j.title}</p>
              <p className="text-xs text-muted-foreground truncate">{j.address ?? ""}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm">{date(j.start_date)}</p>
              <p className="text-xs text-muted-foreground capitalize">{j.status?.replace(/_/g, " ")}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Invoices */}
      <Section icon={<Receipt className="size-4 text-emerald-500" />} title="Your Invoices" empty={invoices.length === 0} emptyText="No invoices yet.">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium">{inv.invoice_number}</p>
              <p className="text-xs text-muted-foreground">Due {date(inv.due_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{gbp(inv.total)}</p>
              <p className={`text-xs capitalize ${INVOICE_COLOR[inv.status] ?? ""}`}>{inv.status?.replace(/_/g, " ")}</p>
            </div>
          </div>
        ))}
      </Section>

      {/* Reviews */}
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
          <Star className="size-4 text-amber-500" /> Leave a Review
        </div>
        <div className="p-5 space-y-4">
          {reviews.length > 0 && (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.star_rating ?? 0 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {r.review_text && <p className="text-sm text-muted-foreground mt-1">{r.review_text}</p>}
                </div>
              ))}
            </div>
          )}
          <ReviewForm token={token} />
        </div>
      </div>
    </div>
  );
}

function Section({
  icon, title, empty, emptyText, children,
}: {
  icon: React.ReactNode; title: string; empty: boolean; emptyText: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        {icon} {title}
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground px-5 py-6">{emptyText}</p>
      ) : (
        <div className="divide-y">{children}</div>
      )}
    </div>
  );
}
