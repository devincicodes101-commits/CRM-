import Link from "next/link";
import { Sparkles, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type NewLeadRow = {
  id: string;
  name: string;
  source: string | null;
  service_interest: string | null;
  estimated_value: number | null;
  created_date: string;
};

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function NewLeadsWidget({ leads }: { leads: NewLeadRow[] }) {
  return (
    <div className="rounded-xl border border-l-4 border-l-emerald-500 bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-emerald-500" />
        New Leads
        <span className="ml-auto text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">
          {leads.length} new
        </span>
        <Link href="/leads" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground px-5 py-6">No new leads right now.</p>
      ) : (
        <ul className="divide-y">
          {leads.map((l) => (
            <li key={l.id}>
              <Link
                href={`/leads/${l.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{l.name}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    {l.source === "website_form" && <Globe className="h-3 w-3" />}
                    {l.service_interest ?? "General enquiry"}
                    {l.source ? ` · ${l.source.replace(/_/g, " ")}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {l.estimated_value ? (
                    <p className="text-sm font-medium">{gbp(l.estimated_value)}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.created_date), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
