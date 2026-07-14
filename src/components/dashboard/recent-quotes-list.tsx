"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteQuoteFromDashboard } from "@/app/(protected)/dashboard/actions";

export type RecentQuote = {
  id: string;
  customer_name: string | null;
  quote_number: string | null;
  total: number | null;
  status: string;
};

const STATUS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-muted text-muted-foreground",
};

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function RecentQuotesList({ quotes }: { quotes: RecentQuote[] }) {
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!window.confirm("Delete this quote?")) return;
    startTransition(async () => {
      const res = await deleteQuoteFromDashboard(id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Quote deleted");
    });
  }

  if (quotes.length === 0) {
    return <p className="text-sm text-muted-foreground px-5 py-6">No quotes yet. Create your first quote.</p>;
  }

  return (
    <ul className="divide-y">
      {quotes.map((q) => (
        <li key={q.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{q.customer_name}</p>
            <p className="text-xs text-muted-foreground">{q.quote_number ?? "No ref"}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium">{gbp(q.total ?? 0)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[q.status] ?? "bg-muted"}`}>
              {q.status}
            </span>
            <div className="flex items-center gap-1">
              <Link href={`/quotes/${q.id}`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="View">
                <Eye className="h-4 w-4" />
              </Link>
              <Link href={`/quotes/${q.id}/edit`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit">
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(q.id)}
                disabled={pending}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-600 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
