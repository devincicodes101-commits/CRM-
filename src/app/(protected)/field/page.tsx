import Link from "next/link";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/schemas/jobs";

const STATUS_VARIANT = {
  scheduled: "secondary",
  in_progress: "default",
  on_hold: "outline",
  completed: "outline",
  invoiced: "outline",
  awaiting_payment: "secondary",
  cancelled: "destructive",
} as const;

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function FieldPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { start, end } = todayRange();

  // Jobs for today that aren't cancelled/invoiced
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .gte("start_date", start)
    .lte("start_date", end)
    .not("status", "in", '("cancelled","invoiced")')
    .order("start_date", { ascending: true })
    .returns<Job[]>();

  // Also get upcoming (next 7 days, excluding today)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: upcoming } = await supabase
    .from("jobs")
    .select("id, title, start_date, address, status, priority, color")
    .gte("start_date", tomorrow.toISOString())
    .lte("start_date", weekEnd.toISOString())
    .not("status", "in", '("cancelled","invoiced","completed")')
    .order("start_date", { ascending: true })
    .returns<Partial<Job>[]>();

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Today's jobs */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Today&apos;s Jobs</h2>
        {!jobs?.length && (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No jobs scheduled for today.
          </div>
        )}
        {jobs?.map((job) => {
          const checkedIn = !!job.check_in_time;
          const checkedOut = !!job.check_out_time;
          const checklistDone = job.checklist?.filter((c) => c.checked).length ?? 0;
          const checklistTotal = job.checklist?.length ?? 0;

          return (
            <Link
              key={job.id}
              href={`/field/jobs/${job.id}`}
              className="block rounded-xl border bg-card p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 size-3 rounded-full shrink-0"
                  style={{ background: job.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{job.title}</p>
                    <Badge
                      variant={STATUS_VARIANT[job.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                      className="text-xs capitalize shrink-0"
                    >
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {job.address && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0" /> {job.address}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(job.start_date).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {checklistTotal > 0 && (
                      <span className={cn(checklistDone === checklistTotal && "text-green-600 dark:text-green-400")}>
                        {checklistDone}/{checklistTotal} checklist
                      </span>
                    )}
                    {checkedIn && !checkedOut && (
                      <span className="text-green-600 dark:text-green-400 font-medium">Checked in</span>
                    )}
                    {checkedOut && (
                      <span className="text-muted-foreground">Checked out</span>
                    )}
                    {job.priority === "urgent" && (
                      <span className="text-destructive flex items-center gap-1 font-medium">
                        <AlertTriangle className="size-3" /> Urgent
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Upcoming this week */}
      {upcoming && upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground">Coming Up</h2>
          <div className="space-y-2">
            {upcoming.map((job) => (
              <Link
                key={job.id}
                href={`/field/jobs/${job.id!}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/30 transition-colors"
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: job.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  {job.address && (
                    <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(job.start_date!).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}