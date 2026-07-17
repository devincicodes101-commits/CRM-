import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Users, Star, Briefcase, TrendingUp } from "lucide-react";

type OperativeSummary = {
  name: string;
  jobs: number;
  avgRating: number;
  totalRatings: number;
  revenue: number;
};

export default async function TeamOutputPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const lastStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const [completionsRes, lastCompletionsRes, jobsRes] = await Promise.all([
    supabase.from("job_completions").select("operative_name, star_rating, job_id").gte("created_date", monthStart).lte("created_date", monthEnd),
    supabase.from("job_completions").select("operative_name").gte("created_date", lastStart).lte("created_date", lastEnd),
    supabase.from("jobs").select("id, total_value, assigned_team, status").in("status", ["completed", "invoiced"]).gte("completed_date", monthStart).lte("completed_date", monthEnd),
  ]);

  const completions = completionsRes.data ?? [];
  const lastCompletions = lastCompletionsRes.data ?? [];
  const jobs = jobsRes.data ?? [];

  // Group by operative
  const operativeMap = new Map<string, OperativeSummary>();
  for (const c of completions) {
    const name = c.operative_name ?? "Unassigned";
    const existing = operativeMap.get(name);
    const rating = Number(c.star_rating ?? 0);
    const jobValue = jobs.find(j => j.id === c.job_id)?.total_value ?? 0;
    if (existing) {
      existing.jobs += 1;
      existing.totalRatings += rating;
      existing.avgRating = existing.totalRatings / existing.jobs;
      existing.revenue += Number(jobValue);
    } else {
      operativeMap.set(name, { name, jobs: 1, avgRating: rating, totalRatings: rating, revenue: Number(jobValue) });
    }
  }

  const operatives = Array.from(operativeMap.values()).sort((a, b) => b.jobs - a.jobs);

  const totalJobsThisMonth = completions.length;
  const totalJobsLastMonth = lastCompletions.length;
  const totalRevenue = operatives.reduce((s, o) => s + o.revenue, 0);
  const avgRating = operatives.length
    ? operatives.reduce((s, o) => s + o.avgRating, 0) / operatives.length
    : 0;
  const growth = totalJobsLastMonth
    ? Math.round(((totalJobsThisMonth - totalJobsLastMonth) / totalJobsLastMonth) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Team Output</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(now, "MMMM yyyy")} · Operative productivity dashboard</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Jobs Completed", value: totalJobsThisMonth, icon: <Briefcase className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50", sub: growth !== 0 ? `${growth > 0 ? "+" : ""}${growth}% vs last month` : "Same as last month" },
          { label: "Active Operatives", value: operatives.length, icon: <Users className="h-4 w-4 text-purple-600" />, bg: "bg-purple-50", sub: "With completions this month" },
          { label: "Avg Star Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—", icon: <Star className="h-4 w-4 text-yellow-500" />, bg: "bg-yellow-50", sub: "Across all completions" },
          { label: "Revenue Generated", value: `£${totalRevenue.toLocaleString()}`, icon: <TrendingUp className="h-4 w-4 text-green-600" />, bg: "bg-green-50", sub: "From completed jobs" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border bg-white shadow-sm p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground font-medium">{kpi.label}</p>
              <span className={`p-3 rounded-full ${kpi.bg}`}>{kpi.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Operative breakdown */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Operative Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{format(now, "MMMM yyyy")}</p>
        </div>

        {operatives.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No job completions recorded this month yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Operative</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Jobs</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Avg Rating</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {operatives.map((op, i) => (
                  <tr key={op.name} className="border-b last:border-0 hover:bg-gray-50/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {op.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{op.name}</span>
                        {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">Top</span>}
                      </div>
                    </td>
                    <td className="text-center px-4 py-3.5 font-semibold">{op.jobs}</td>
                    <td className="text-center px-4 py-3.5">
                      {op.avgRating > 0 ? (
                        <span className={`font-semibold ${op.avgRating >= 4 ? "text-green-600" : op.avgRating >= 3 ? "text-orange-500" : "text-red-500"}`}>
                          {op.avgRating.toFixed(1)} ★
                        </span>
                      ) : "—"}
                    </td>
                    <td className="text-right px-5 py-3.5 font-semibold">
                      {op.revenue > 0 ? `£${op.revenue.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
