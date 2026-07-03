import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCalendar } from "@/components/jobs/job-calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Job } from "@/lib/schemas/jobs";

const STATUS_VARIANT = {
  scheduled: "secondary",
  on_hold: "outline",
  in_progress: "default",
  completed: "default",
  invoiced: "outline",
  awaiting_payment: "secondary",
  cancelled: "destructive",
} as const;

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
} as const;

const STATUSES = [
  "all", "scheduled", "in_progress", "on_hold", "completed", "invoiced", "awaiting_payment", "cancelled",
] as const;

type View = "list" | "calendar";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string }>;
}) {
  const { view, status } = await searchParams;
  const currentView: View = view === "calendar" ? "calendar" : "list";
  const currentStatus = status ?? "all";

  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("*")
    .order("start_date", { ascending: true });

  if (currentStatus !== "all") {
    query = query.eq("status", currentStatus);
  }

  const { data: jobs } = await query.returns<Job[]>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">{jobs?.length ?? 0} jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden text-sm">
            <Link
              href={`/jobs?view=list&status=${currentStatus}`}
              className={`px-3 py-1.5 transition-colors ${
                currentView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              List
            </Link>
            <Link
              href="/jobs?view=calendar"
              className={`px-3 py-1.5 transition-colors ${
                currentView === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Calendar
            </Link>
          </div>
          <Link href="/jobs/new" className={cn(buttonVariants())}>
            <Plus className="size-4" /> New Job
          </Link>
        </div>
      </div>

      {currentView === "calendar" ? (
        <div className="rounded-xl border bg-card p-4">
          <JobCalendar jobs={jobs ?? []} />
        </div>
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={`/jobs?view=list&status=${s}`}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
                  currentStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {s.replace("_", " ")}
              </Link>
            ))}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Operative</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!jobs?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      No jobs found.{" "}
                      <Link href="/jobs/new" className="text-primary underline">
                        Schedule one
                      </Link>
                      .
                    </TableCell>
                  </TableRow>
                )}
                {jobs?.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: j.color ?? "#f97316" }}
                        />
                        <Link href={`/jobs/${j.id}`} className="font-medium hover:underline">
                          {j.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{j.customer_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate">
                      {j.address ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(j.start_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{j.assigned_team ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[j.priority ?? "medium"]} className="text-xs capitalize">
                        {j.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[j.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                        className="text-xs capitalize"
                      >
                        {j.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {j.total_value > 0 ? `£${Number(j.total_value).toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}