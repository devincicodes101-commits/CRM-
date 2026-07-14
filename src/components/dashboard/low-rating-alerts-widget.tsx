"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Star, Check, Archive } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveAlert, archiveAlert } from "@/app/(protected)/dashboard/actions";

export type AlertRow = {
  id: string;
  star_rating: number | null;
  customer_name: string | null;
  title: string;
  feedback_text: string | null;
  created_date: string;
};

export function LowRatingAlertsWidget({ alerts }: { alerts: AlertRow[] }) {
  const [pending, startTransition] = useTransition();

  function onResolve(id: string) {
    startTransition(async () => {
      const res = await resolveAlert(id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Alert resolved");
    });
  }

  function onArchive(id: string) {
    startTransition(async () => {
      const res = await archiveAlert(id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Alert archived");
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <Star className="h-4 w-4 text-yellow-500" />
        Low Rating Alerts
      </div>

      {alerts.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium">No Low Ratings</p>
          <p className="text-xs text-muted-foreground">All recent feedback looks healthy.</p>
        </div>
      ) : (
        <ul className="divide-y">
          {alerts.map((a) => (
            <li key={a.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: a.star_rating ?? 1 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                    ))}
                    <span className="text-sm font-medium ml-1 truncate">
                      {a.customer_name ?? a.title}
                    </span>
                  </div>
                  {a.feedback_text && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {a.feedback_text}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {format(new Date(a.created_date), "d MMM yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Link
                  href="/jobs"
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border hover:bg-muted/50 transition-colors"
                  )}
                >
                  Respond
                </Link>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => onResolve(a.id)}>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Resolve
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => onArchive(a.id)}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
