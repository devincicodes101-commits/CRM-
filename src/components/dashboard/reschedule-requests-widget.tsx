"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { approveReschedule, rejectReschedule } from "@/app/(protected)/dashboard/actions";

export type RescheduleRow = {
  id: string;
  job_id: string;
  job_title: string | null;
  customer_name: string;
  original_date: string | null;
  requested_date: string | null;
  reason: string | null;
};

function fmt(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

export function RescheduleRequestsWidget({ requests }: { requests: RescheduleRow[] }) {
  const [pending, startTransition] = useTransition();

  function onApprove(r: RescheduleRow) {
    if (!r.requested_date) {
      toast.error("No requested date on this request");
      return;
    }
    startTransition(async () => {
      const res = await approveReschedule(r.id, r.job_id, r.requested_date!);
      if ("error" in res) toast.error(res.error);
      else toast.success("Reschedule approved — job moved");
    });
  }

  function onReject(r: RescheduleRow) {
    startTransition(async () => {
      const res = await rejectReschedule(r.id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Request rejected");
    });
  }

  return (
    <div className="rounded-xl border border-l-4 border-l-amber-500 bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
        <CalendarClock className="h-4 w-4 text-amber-500" />
        Reschedule Requests
        <span className="ml-auto text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5">
          {requests.length} pending
        </span>
      </div>
      {requests.length === 0 && (
        <p className="text-sm text-muted-foreground px-5 py-6">No pending reschedule requests.</p>
      )}
      <ul className="divide-y">
        {requests.map((r) => (
          <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.job_title ?? "Job"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {r.customer_name} · {fmt(r.original_date)} → {fmt(r.requested_date)}
              </p>
              {r.reason && (
                <p className="text-xs text-muted-foreground italic mt-0.5 truncate">
                  &ldquo;{r.reason}&rdquo;
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" variant="outline" disabled={pending} onClick={() => onApprove(r)}>
                <Check className="h-4 w-4 text-emerald-600" />
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => onReject(r)}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
