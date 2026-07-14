import Link from "next/link";
import { Bell, FileText, Receipt, CalendarDays } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

export type ReminderQuote = { id: string; customer_name: string; quote_number: string; reminder_date: string | null };
export type ReminderInvoice = { id: string; invoice_number: string; customer_name: string; total: number; due_date: string | null };
export type ReminderJob = { id: string; title: string; customer_name: string | null; start_date: string };

function urgency(date: string | null): string {
  if (!date) return "bg-muted text-muted-foreground";
  const days = differenceInCalendarDays(new Date(date), new Date());
  if (days <= 0) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (days <= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
}

function fmt(d: string | null) {
  return d ? format(new Date(d), "d MMM") : "—";
}

export function RemindersWidget({
  quotes,
  invoices,
  jobs,
}: {
  quotes: ReminderQuote[];
  invoices: ReminderInvoice[];
  jobs: ReminderJob[];
}) {
  const hasAny = quotes.length + invoices.length + jobs.length > 0;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <Bell className="h-4 w-4 text-primary" />
        Reminders &amp; Follow-ups
        <Link href="/reminders" className="ml-auto text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      {!hasAny ? (
        <p className="text-sm text-muted-foreground px-5 py-6">Nothing needs chasing right now.</p>
      ) : (
        <div className="p-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" /> Quote follow-ups
            </p>
            {quotes.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
            {quotes.slice(0, 3).map((q) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="block rounded-lg border px-3 py-2 hover:bg-muted/50"
              >
                <p className="text-sm font-medium truncate">{q.customer_name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">{q.quote_number}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", urgency(q.reminder_date))}>
                    {fmt(q.reminder_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Receipt className="h-3.5 w-3.5" /> Unpaid invoices
            </p>
            {invoices.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
            {invoices.slice(0, 3).map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="block rounded-lg border px-3 py-2 hover:bg-muted/50"
              >
                <p className="text-sm font-medium truncate">
                  {inv.customer_name} · £{Number(inv.total).toLocaleString("en-GB")}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">{inv.invoice_number}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", urgency(inv.due_date))}>
                    {fmt(inv.due_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <CalendarDays className="h-3.5 w-3.5" /> Upcoming jobs
            </p>
            {jobs.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
            {jobs.slice(0, 3).map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="block rounded-lg border px-3 py-2 hover:bg-muted/50"
              >
                <p className="text-sm font-medium truncate">{j.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">{j.customer_name}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", urgency(j.start_date))}>
                    {fmt(j.start_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
