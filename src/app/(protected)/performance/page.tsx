import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Star, Trophy, Briefcase, PoundSterling, AlertCircle, MapPin, XCircle, HardHat } from "lucide-react";
import { outwardCode } from "@/lib/coverage";

const gbp = (n: number) => `£${Number(n ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

type OperativeStat = { operative_name: string; job_count: number; avg_rating: number | null; total_value: number };

async function getOperativeLeaderboard(supabase: Awaited<ReturnType<typeof createClient>>, fromISO: string, toISO: string) {
  const [completionsResult, jobsResult] = await Promise.all([
    supabase.from("job_completions").select("operative_name, star_rating, job_id")
      .gte("completed_date", fromISO).lte("completed_date", toISO).not("operative_name", "is", null),
    supabase.from("jobs").select("id, assigned_team, total_value")
      .eq("status", "completed").gte("completed_date", fromISO).lte("completed_date", toISO),
  ]);
  const completions = completionsResult.data ?? [];
  const jobs = jobsResult.data ?? [];
  const jobValueMap = new Map(jobs.map((j) => [j.id, j.total_value ?? 0]));
  const statsMap = new Map<string, { ratings: number[]; jobIds: Set<string> }>();
  for (const c of completions) {
    if (!c.operative_name) continue;
    if (!statsMap.has(c.operative_name)) statsMap.set(c.operative_name, { ratings: [], jobIds: new Set() });
    const entry = statsMap.get(c.operative_name)!;
    entry.jobIds.add(c.job_id);
    if (c.star_rating !== null) entry.ratings.push(c.star_rating);
  }
  const stats: OperativeStat[] = Array.from(statsMap.entries()).map(([name, { ratings, jobIds }]) => ({
    operative_name: name,
    job_count: jobIds.size,
    avg_rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    total_value: Array.from(jobIds).reduce((sum, id) => sum + (jobValueMap.get(id) ?? 0), 0),
  }));
  stats.sort((a, b) => b.job_count - a.job_count);
  return stats;
}

// §13 — reporting suite over a shared date range.
async function getReports(supabase: Awaited<ReturnType<typeof createClient>>, fromISO: string, toISO: string) {
  const [commRes, invRes, jobsRes, contractorsRes, reviewsRes] = await Promise.all([
    supabase.from("commission_invoices").select("commission_amount, status, created_date")
      .gte("created_date", fromISO).lte("created_date", toISO),
    supabase.from("invoices").select("total, amount_paid, status, due_date, invoice_type, created_date")
      .gte("created_date", fromISO).lte("created_date", toISO),
    supabase.from("jobs").select("id, status, address, total_value, assigned_contractor_id, created_date")
      .gte("created_date", fromISO).lte("created_date", toISO),
    supabase.from("contractors").select("id, company_name, contact_name"),
    supabase.from("reviews").select("star_rating, contractor_id").not("contractor_id", "is", null),
  ]);

  const commissions = commRes.data ?? [];
  const invoices = invRes.data ?? [];
  const jobs = jobsRes.data ?? [];
  const contractors = contractorsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const nameOf = new Map(contractors.map((c) => [c.id, c.company_name || c.contact_name || "Contractor"]));

  // Commission earned (paid vs unpaid)
  let commissionPaid = 0, commissionUnpaid = 0;
  for (const c of commissions) {
    const amt = Number(c.commission_amount ?? 0);
    if (c.status === "paid") commissionPaid += amt; else commissionUnpaid += amt;
  }

  // Outstanding fees + past-due count (exclude credit notes)
  const now = new Date();
  let outstanding = 0, pastDueCount = 0, invValueSum = 0, invCount = 0;
  for (const inv of invoices) {
    if (inv.invoice_type === "credit_note") continue;
    const bal = Number(inv.total ?? 0) - Number(inv.amount_paid ?? 0);
    if (["sent", "part_paid", "overdue"].includes(inv.status)) {
      outstanding += Math.max(0, bal);
      if (inv.due_date && new Date(inv.due_date) < now) pastDueCount++;
    }
    invValueSum += Number(inv.total ?? 0);
    invCount++;
  }
  const avgInvoice = invCount > 0 ? invValueSum / invCount : 0;

  // Jobs per contractor (+ Unassigned)
  const perContractor = new Map<string, number>();
  for (const j of jobs) {
    const key = j.assigned_contractor_id ? (nameOf.get(j.assigned_contractor_id) ?? "Contractor") : "Unassigned";
    perContractor.set(key, (perContractor.get(key) ?? 0) + 1);
  }
  const jobsPerContractor = Array.from(perContractor.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // Jobs per area (postcode district)
  const perArea = new Map<string, number>();
  for (const j of jobs) {
    const area = outwardCode(j.address) ?? "Unknown";
    perArea.set(area, (perArea.get(area) ?? 0) + 1);
  }
  const jobsPerArea = Array.from(perArea.entries()).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count).slice(0, 12);

  // Cancelled jobs
  const cancelled = jobs.filter((j) => j.status === "cancelled");
  const cancelledLost = cancelled.reduce((s, j) => s + Number(j.total_value ?? 0), 0);
  const cancelRate = jobs.length > 0 ? (cancelled.length / jobs.length) * 100 : 0;

  // Contractor ratings (all-time, from reviews)
  const ratingAcc = new Map<string, { sum: number; n: number }>();
  for (const r of reviews) {
    if (!r.contractor_id) continue;
    const cur = ratingAcc.get(r.contractor_id) ?? { sum: 0, n: 0 };
    cur.sum += Number(r.star_rating); cur.n++;
    ratingAcc.set(r.contractor_id, cur);
  }
  const contractorRatings = Array.from(ratingAcc.entries())
    .map(([id, { sum, n }]) => ({ name: nameOf.get(id) ?? "Contractor", avg: sum / n, n }))
    .sort((a, b) => b.avg - a.avg);

  return {
    commissionPaid, commissionUnpaid, outstanding, pastDueCount, avgInvoice,
    jobsPerContractor, jobsPerArea,
    cancelledCount: cancelled.length, cancelledLost, cancelRate,
    contractorRatings,
    totalJobs: jobs.length,
  };
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted-foreground text-xs">No ratings</span>;
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < full ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="flex items-center gap-2 font-semibold text-sm">{icon} {title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const fromDate = from ? new Date(from) : startOfMonth(new Date());
  const toDate = to ? new Date(`${to}T23:59:59`) : endOfMonth(new Date());
  const fromISO = fromDate.toISOString();
  const toISO = toDate.toISOString();
  const fromInput = format(fromDate, "yyyy-MM-dd");
  const toInput = format(toDate, "yyyy-MM-dd");

  const supabase = await createClient();
  const [stats, reports] = await Promise.all([
    getOperativeLeaderboard(supabase, fromISO, toISO),
    getReports(supabase, fromISO, toISO),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance &amp; Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(fromDate, "d MMM yyyy")} – {format(toDate, "d MMM yyyy")}
          </p>
        </div>
        <form className="flex items-end gap-2" method="get">
          <label className="text-xs text-muted-foreground">From
            <input type="date" name="from" defaultValue={fromInput} className="block h-9 rounded-md border bg-background px-2 text-sm" />
          </label>
          <label className="text-xs text-muted-foreground">To
            <input type="date" name="to" defaultValue={toInput} className="block h-9 rounded-md border bg-background px-2 text-sm" />
          </label>
          <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Apply</button>
        </form>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Commission earned" icon={<PoundSterling className="size-4 text-emerald-500" />}>
          <p className="text-2xl font-bold">{gbp(reports.commissionPaid + reports.commissionUnpaid)}</p>
          <p className="text-xs text-muted-foreground">{gbp(reports.commissionPaid)} paid · {gbp(reports.commissionUnpaid)} unpaid</p>
        </Card>
        <Card title="Outstanding fees" icon={<AlertCircle className="size-4 text-amber-500" />}>
          <p className="text-2xl font-bold">{gbp(reports.outstanding)}</p>
          <p className="text-xs text-muted-foreground">{reports.pastDueCount} invoice{reports.pastDueCount === 1 ? "" : "s"} past due</p>
        </Card>
        <Card title="Average invoice" icon={<PoundSterling className="size-4 text-blue-500" />}>
          <p className="text-2xl font-bold">{gbp(reports.avgInvoice)}</p>
          <p className="text-xs text-muted-foreground">across invoices in range</p>
        </Card>
        <Card title="Cancelled jobs" icon={<XCircle className="size-4 text-red-500" />}>
          <p className="text-2xl font-bold">{reports.cancelledCount}</p>
          <p className="text-xs text-muted-foreground">{gbp(reports.cancelledLost)} lost · {reports.cancelRate.toFixed(0)}% rate</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jobs per contractor */}
        <Card title="Jobs per contractor" icon={<HardHat className="size-4 text-orange-500" />}>
          {reports.jobsPerContractor.length === 0 ? <Empty text="No jobs in this range." /> : (
            <ul className="space-y-1.5 text-sm">
              {reports.jobsPerContractor.map((r) => (
                <li key={r.name} className="flex items-center justify-between">
                  <span className={r.name === "Unassigned" ? "text-muted-foreground italic" : ""}>{r.name}</span>
                  <span className="font-medium">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Jobs per area */}
        <Card title="Jobs per area" icon={<MapPin className="size-4 text-sky-500" />}>
          {reports.jobsPerArea.length === 0 ? <Empty text="No jobs in this range." /> : (
            <ul className="space-y-1.5 text-sm">
              {reports.jobsPerArea.map((r) => (
                <li key={r.area} className="flex items-center justify-between">
                  <span>{r.area}</span>
                  <span className="font-medium">{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Contractor ratings */}
      <Card title="Contractor ratings" icon={<Star className="size-4 text-amber-500" />}>
        {reports.contractorRatings.length === 0 ? <Empty text="No contractor reviews yet." /> : (
          <ul className="space-y-2 text-sm">
            {reports.contractorRatings.map((r) => (
              <li key={r.name} className="flex items-center justify-between">
                <span>{r.name} <span className="text-muted-foreground text-xs">({r.n})</span></span>
                <Stars rating={r.avg} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Operative leaderboard */}
      <div>
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Trophy className="size-4 text-yellow-500" /> Operative leaderboard</h2>
        {stats.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
            No completed jobs with operative data in this range.
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Operative</th>
                  <th className="px-4 py-3 text-left font-semibold"><div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Jobs Done</div></th>
                  <th className="px-4 py-3 text-left font-semibold"><div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Avg Rating</div></th>
                  <th className="px-4 py-3 text-left font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.operative_name} className="border-t">
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {i < 3 ? <Trophy className={`h-4 w-4 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : "text-amber-700"}`} /> : <span>{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.operative_name}</td>
                    <td className="px-4 py-3">{s.job_count}</td>
                    <td className="px-4 py-3"><Stars rating={s.avg_rating} /></td>
                    <td className="px-4 py-3">{gbp(s.total_value)}</td>
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
