import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import {
  Briefcase,
  PoundSterling,
  TrendingUp,
  AlertTriangle,
  Star,
  Clock,
} from "lucide-react";

async function getDashboardData() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();

  const [
    activeJobsResult,
    revenueResult,
    openLeadsResult,
    overdueInvoicesResult,
    todayJobsResult,
    lowRatingsResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["scheduled", "in_progress", "on_hold"]),

    supabase
      .from("jobs")
      .select("total_value")
      .eq("status", "completed")
      .gte("completed_date", monthStart)
      .lte("completed_date", monthEnd),

    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("won","lost")'),

    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "overdue"),

    supabase
      .from("jobs")
      .select("id, title, customer_name, address, status, start_date, start_time")
      .gte("start_date", todayStart.toISOString())
      .lte("start_date", todayEnd.toISOString())
      .order("start_date", { ascending: true })
      .limit(10),

    supabase
      .from("job_completions")
      .select("job_id, job_title, customer_name, star_rating, completed_date")
      .lte("star_rating", 2)
      .order("completed_date", { ascending: false })
      .limit(5),
  ]);

  const revenue = (revenueResult.data ?? []).reduce(
    (sum, j) => sum + (j.total_value ?? 0),
    0
  );

  return {
    activeJobs: activeJobsResult.count ?? 0,
    revenue,
    openLeads: openLeadsResult.count ?? 0,
    overdueInvoices: overdueInvoicesResult.count ?? 0,
    todayJobs: todayJobsResult.data ?? [],
    lowRatings: lowRatingsResult.data ?? [],
  };
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  invoiced: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  awaiting_payment: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
};

export default async function DashboardPage() {
  const { activeJobs, revenue, openLeads, overdueInvoices, todayJobs, lowRatings } =
    await getDashboardData();

  const kpis = [
    {
      label: "Active Jobs",
      value: activeJobs,
      icon: Briefcase,
      href: "/jobs?status=active",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Revenue This Month",
      value: `£${revenue.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
      icon: PoundSterling,
      href: "/invoices",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Open Leads",
      value: openLeads,
      icon: TrendingUp,
      href: "/leads",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Overdue Invoices",
      value: overdueInvoices,
      icon: AlertTriangle,
      href: "/invoices?status=overdue",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
              <span className={`p-2 rounded-md ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">{kpi.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Today&apos;s Jobs
            </div>
            <Link href="/jobs" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {todayJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-6">
              No jobs scheduled for today.
            </p>
          ) : (
            <ul className="divide-y">
              {todayJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.customer_name} &middot; {job.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {job.start_time && (
                        <span className="text-xs text-muted-foreground">
                          {job.start_time}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b font-semibold text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            Low Rating Alerts
          </div>
          {lowRatings.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-6">
              No low ratings recently.
            </p>
          ) : (
            <ul className="divide-y">
              {lowRatings.map((r) => (
                <li key={r.job_id}>
                  <Link
                    href={`/jobs/${r.job_id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.job_title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.customer_name} &middot;{" "}
                        {r.completed_date
                          ? format(new Date(r.completed_date), "d MMM yyyy")
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {Array.from({ length: r.star_rating ?? 1 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/jobs/new"
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          New Job
        </Link>
        <Link
          href="/leads/new"
          className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Add Lead
        </Link>
        <Link
          href="/quotes/new"
          className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Create Quote
        </Link>
        <Link
          href="/route-planning"
          className="rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Route Planning
        </Link>
      </div>
    </div>
  );
}
