import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { RouteMap } from "@/components/route-planning/route-map";

async function getTodayJobs() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("jobs")
    .select("id, title, customer_name, address, status, start_date, start_time, site_lat, site_lng, assigned_team")
    .gte("start_date", todayStart.toISOString())
    .lte("start_date", todayEnd.toISOString())
    .not("status", "in", '("cancelled","completed")')
    .order("start_date", { ascending: true });

  return data ?? [];
}

export default async function RoutePlanningPage() {
  const jobs = await getTodayJobs();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Route Planning</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy")} &mdash; {jobs.length} job
          {jobs.length !== 1 ? "s" : ""} today
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RouteMap jobs={jobs} />
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm">
            Today&apos;s Schedule
          </div>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6">
              No active jobs scheduled for today.
            </p>
          ) : (
            <ol className="divide-y">
              {jobs.map((job, i) => (
                <li key={job.id} className="px-4 py-3 flex gap-3">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{job.address ?? "No address"}</span>
                    </p>
                    {job.start_time && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.start_time}
                      </p>
                    )}
                    {job.assigned_team && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Team: {job.assigned_team}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
