import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Star, Trophy, Briefcase } from "lucide-react";

type OperativeStat = {
  operative_name: string;
  job_count: number;
  avg_rating: number | null;
  total_value: number;
};

async function getPerformanceData() {
  const supabase = await createClient();

  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();

  const [completionsResult, jobsResult] = await Promise.all([
    supabase
      .from("job_completions")
      .select("operative_name, star_rating, job_id")
      .gte("completed_date", monthStart)
      .lte("completed_date", monthEnd)
      .not("operative_name", "is", null),

    supabase
      .from("jobs")
      .select("id, assigned_team, total_value")
      .eq("status", "completed")
      .gte("completed_date", monthStart)
      .lte("completed_date", monthEnd),
  ]);

  const completions = completionsResult.data ?? [];
  const jobs = jobsResult.data ?? [];

  const jobValueMap = new Map(jobs.map((j) => [j.id, j.total_value ?? 0]));

  const statsMap = new Map<string, { ratings: number[]; jobIds: Set<string> }>();

  for (const c of completions) {
    if (!c.operative_name) continue;
    if (!statsMap.has(c.operative_name)) {
      statsMap.set(c.operative_name, { ratings: [], jobIds: new Set() });
    }
    const entry = statsMap.get(c.operative_name)!;
    entry.jobIds.add(c.job_id);
    if (c.star_rating !== null) entry.ratings.push(c.star_rating);
  }

  const stats: OperativeStat[] = Array.from(statsMap.entries()).map(
    ([name, { ratings, jobIds }]) => {
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;
      const totalValue = Array.from(jobIds).reduce(
        (sum, id) => sum + (jobValueMap.get(id) ?? 0),
        0
      );
      return {
        operative_name: name,
        job_count: jobIds.size,
        avg_rating: avgRating,
        total_value: totalValue,
      };
    }
  );

  stats.sort((a, b) => b.job_count - a.job_count);

  return stats;
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted-foreground text-xs">No ratings</span>;
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default async function PerformancePage() {
  const stats = await getPerformanceData();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Operative leaderboard for {format(new Date(), "MMMM yyyy")}
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
          No completed jobs with operative data for this month.
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                <th className="px-4 py-3 text-left font-semibold">Operative</th>
                <th className="px-4 py-3 text-left font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    Jobs Done
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    Avg Rating
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.operative_name} className="border-t">
                  <td className="px-4 py-3 text-muted-foreground font-medium">
                    {i === 0 ? (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    ) : i === 1 ? (
                      <Trophy className="h-4 w-4 text-slate-400" />
                    ) : i === 2 ? (
                      <Trophy className="h-4 w-4 text-amber-700" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.operative_name}</td>
                  <td className="px-4 py-3">{s.job_count}</td>
                  <td className="px-4 py-3">
                    <Stars rating={s.avg_rating} />
                  </td>
                  <td className="px-4 py-3">
                    £{s.total_value.toLocaleString("en-GB", { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
