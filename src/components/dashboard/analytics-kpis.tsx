"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Target,
  Coins,
  PoundSterling,
  Truck,
  Users,
  LineChart as LineChartIcon,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { calcJobProfit, calcMargin } from "@/lib/profit";

type Job = {
  id: string;
  status?: string | null;
  total_value?: number | null;
  completed_date?: string | null;
  assigned_contractor_id?: string | null;
  materials_used?: { quantity?: number; unit_cost?: number | null }[] | null;
};
type Invoice = {
  status?: string | null;
  total?: number | null;
  amount_paid?: number | null;
  due_date?: string | null;
};
type Vehicle = { status?: string | null };
type Lead = { status?: string | null; estimated_value?: number | null };
type Receipt = { job_id: string; amount_gbp?: number | null; status?: string | null };

type Props = {
  jobs: Job[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  leads: Lead[];
  userCount: number;
  receipts: Receipt[];
  marketingSpend: number | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function last6Months(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] });
  }
  return out;
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export function AnalyticsKPIs({
  jobs,
  invoices,
  vehicles,
  leads,
  userCount,
  receipts,
  marketingSpend,
}: Props) {
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const conversion = totalLeads ? (wonLeads / totalLeads) * 100 : 0;
  const pipelineValue = leads
    .filter((l) => l.status !== "won" && l.status !== "lost")
    .reduce((s, l) => s + (l.estimated_value ?? 0), 0);

  const costPerLead = marketingSpend && totalLeads ? marketingSpend / totalLeads : null;

  const paidRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const revenuePerJob = completedJobs.length ? paidRevenue / completedJobs.length : 0;

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const fleetUtil = vehicles.length ? (activeVehicles / vehicles.length) * 100 : 0;

  const activeJobs = jobs.filter((j) => j.status === "in_progress" || j.status === "scheduled");
  const assignedUsers = new Set(
    activeJobs.map((j) => j.assigned_contractor_id).filter(Boolean)
  ).size;
  const teamUtil = userCount ? Math.min((assignedUsers / userCount) * 100, 100) : 0;

  const totalProfit = completedJobs.reduce((s, j) => s + calcJobProfit(j, receipts), 0);
  const avgMargin =
    completedJobs.length
      ? completedJobs.reduce((s, j) => s + calcMargin(j, receipts), 0) / completedJobs.length
      : 0;

  // Cash-flow forecast — outstanding invoice amounts by due month.
  const months = last6Months();
  const cashFlow = months.map((m) => {
    const amount = invoices
      .filter(
        (i) =>
          i.due_date &&
          monthKey(i.due_date) === m.key &&
          (i.status === "sent" || i.status === "overdue" || i.status === "part_paid")
      )
      .reduce((s, i) => s + ((i.total ?? 0) - (i.amount_paid ?? 0)), 0);
    return { month: m.label, amount: Math.round(amount) };
  });

  // Job profitability by month.
  const profitByMonth = months.map((m) => {
    const profit = completedJobs
      .filter((j) => j.completed_date && monthKey(j.completed_date) === m.key)
      .reduce((s, j) => s + calcJobProfit(j, receipts), 0);
    return { month: m.label, profit: Math.round(profit) };
  });

  const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Lead Conversion"
          value={`${conversion.toFixed(1)}%`}
          subtitle={`${gbp(pipelineValue)} in pipeline`}
          icon={<Target className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          delay={0}
        />
        <StatCard
          title="Cost per Lead"
          value={costPerLead === null ? "—" : gbp(costPerLead)}
          subtitle={costPerLead === null ? "Set marketing spend" : `${totalLeads} leads`}
          icon={<Coins className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          delay={0.05}
        />
        <StatCard
          title="Revenue per Job"
          value={gbp(revenuePerJob)}
          subtitle={`${completedJobs.length} completed`}
          icon={<PoundSterling className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          delay={0.1}
        />
        <StatCard
          title="Fleet Utilisation"
          value={`${fleetUtil.toFixed(0)}%`}
          subtitle={`${activeVehicles}/${vehicles.length} active`}
          icon={<Truck className="h-4 w-4 text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          delay={0.15}
        />
        <StatCard
          title="Team Utilisation"
          value={`${teamUtil.toFixed(0)}%`}
          subtitle={`${assignedUsers}/${userCount} assigned`}
          icon={<Users className="h-4 w-4 text-cyan-600" />}
          iconBg="bg-cyan-50 dark:bg-cyan-900/20"
          delay={0.2}
        />
        <StatCard
          title="Job Profitability"
          value={gbp(totalProfit)}
          subtitle={`${avgMargin.toFixed(0)}% avg margin`}
          icon={
            <LineChartIcon
              className={`h-4 w-4 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
            />
          }
          iconBg={totalProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}
          valueColor={totalProfit < 0 ? "text-red-600" : undefined}
          delay={0.25}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Cash-Flow Forecast (outstanding)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => gbp(Number(v))} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Job Profitability by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={profitByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => gbp(Number(v))} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {profitByMonth.map((d, i) => (
                  <Cell key={i} fill={d.profit < 0 ? "#ef4444" : "#f59e0b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
