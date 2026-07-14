"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteJobFromDashboard } from "@/app/(protected)/dashboard/actions";

export type UpcomingJob = {
  id: string;
  title: string;
  customer_name: string | null;
  address: string | null;
  start_date: string | null;
  status: string;
};

const STATUS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export function UpcomingJobsList({ jobs }: { jobs: UpcomingJob[] }) {
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!window.confirm("Delete this job?")) return;
    startTransition(async () => {
      const res = await deleteJobFromDashboard(id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Job deleted");
    });
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground px-5 py-6">No upcoming jobs scheduled.</p>;
  }

  return (
    <ul className="divide-y">
      {jobs.map((j) => (
        <li key={j.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{j.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {j.customer_name} · {j.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">
              {j.start_date ? format(new Date(j.start_date), "d MMM") : "TBD"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[j.status] ?? "bg-muted"}`}>
              {j.status?.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-1">
              <Link href="/jobs" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="View">
                <Eye className="h-4 w-4" />
              </Link>
              <Link href={`/jobs/${j.id}/edit`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit">
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(j.id)}
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
