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
import { Target, TrendingUp, Briefcase, Truck, Users } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { calcJobProfit } from "@/lib/profit";

type Job = {
  id: string;
  status?: string | null;
  total_value?: number | null;
  completed_date?: string | null;
  assigned_team?: string | null;
  materials_used?: { quantity?: number; unit_cost?: number | null }[] | null;
};
type Invoice = {
  status?: string | null;
  invoice_type?: string | null;
  total?: number | null;
  billed_amount?: number | null;
  amount_paid?: number | null;
  due_date?: string | null;
};
type Vehicle = { status?: string | null };
type Lead = { status?: string | null; estimated_value?: number | null };
type Receipt = { job_id: string; amount_gbp?: number | null; status?: string | null };
type TeamUser = { full_name?: string | null };

type Props = {
  jobs: Job[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  leads: Lead[];
  users: TeamUser[];
  receipts: Receipt[];
  marketingSpend: number | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIPELINE_STATUSES = ["new", "contacted", "qualified", "appointment_booked", "quoted", "negotiation"];

function last6Months(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
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
  users,
  receipts,
  marketingSpend,
}: Props) {
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const conversion = totalLeads ? (wonLeads / totalLeads) * 100 : 0;
  const pipelineValue = leads
    .filter((l) => l.status && PIPELINE_STATUSES.includes(l.status))
    .reduce((s, l) => s + (l.estimated_value ?? 0), 0);

  const costPerLead = marketingSpend && totalLeads ? marketingSpend / totalLeads : null;

  const paidRevenue = invoices
    .filter((i) => i.status === "paid" && i.invoice_type !== "credit_note")
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const revenuePerJob = completedJobs.length ? paidRevenue / completedJobs.length : 0;

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const fleetUtil = vehicles.length ? (activeVehicles / vehicles.length) * 100 : 0;

  // Team utilisation: users whose full_name appears in any active job's assigned_team.
  const activeJobs = jobs.filter((j) => j.status === "in_progress" || j.status === "scheduled");
  const assignedUsers = users.filter(
    (u) => u.full_name && activeJobs.some((j) => j.assigned_team?.includes(u.full_name!))
  ).length;
  const teamUtil = users.length ? (assignedUsers / users.length) * 100 : 0;

  const totalProfit = completedJobs.reduce((s, j) => s + calcJobProfit(j, receipts), 0);
  const totalCompletedRevenue = completedJobs.reduce((s, j) => s + (j.total_value ?? 0), 0);
  const avgMargin = totalCompletedRevenue > 0 ? (totalProfit / totalCompletedRevenue) * 100 : 0;

  // Cash-flow forecast — outstanding (billed_amount fallback to total) by due month.
  const months = last6Months();
  const cashFlow = months.map((m) => {
    const amount = invoices
      .filter(
        (i) =>
          i.due_date &&
          monthKey(i.due_date) === m.key &&
          i.invoice_type !== "credit_note" &&
          (i.status === "sent" || i.status === "overdue" || i.status === "part_paid")
      )
      .reduce((s, i) => s + Math.max(0, (i.billed_amount ?? i.total ?? 0) - (i.amount_paid ?? 0)), 0);
    return { month: m.label, amount: Math.round(amount) };
  });

  const profitByMonth = months.map((m) => {
    const profit = completedJobs
      .filter((j) => j.completed_date && monthKey(j.completed_date) === m.key)
      .reduce((s, j) => s + calcJobProfit(j, receipts), 0);
    return { month: m.label, profit: Math.round(profit) };
  });

  const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Analytics KPIs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Lead Conversion" value={`${conversion.toFixed(1)}%`}
          subtitle={`${gbp(pipelineValue)} pipeline`}
          icon={<Target className="h-4 w-4 text-violet-600" />}
          iconBg="bg-violet-100 dark:bg-violet-900/20" delay={0} />
        <StatCard title="Cost per Lead" value={costPerLead === null ? "—" : gbp(costPerLead)}
          subtitle={costPerLead === null ? "Set marketing spend" : `${totalLeads} leads`}
          icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-900/20" delay={0.1} />
        <StatCard title="Revenue per Job" value={gbp(revenuePerJob)}
          subtitle={`${completedJobs.length} completed`}
          icon={<Briefcase className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20" delay={0.2} />
        <StatCard title="Fleet Utilisation" value={`${fleetUtil.toFixed(0)}%`}
          subtitle={`${activeVehicles}/${vehicles.length} active`}
          icon={<Truck className="h-4 w-4 text-sky-600" />}
          iconBg="bg-sky-100 dark:bg-sky-900/20" delay={0.3} />
        <StatCard title="Team Utilisation" value={`${teamUtil.toFixed(0)}%`}
          subtitle={`${assignedUsers}/${users.length} assigned`}
          icon={<Users className="h-4 w-4 text-rose-600" />}
          iconBg="bg-rose-100 dark:bg-rose-900/20" delay={0.35} />
        <StatCard title="Job Profitability" value={gbp(totalProfit)}
          subtitle={`${avgMargin.toFixed(0)}% avg margin`}
          icon={<TrendingUp className={`h-4 w-4 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`} />}
          iconBg={totalProfit >= 0 ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-red-100 dark:bg-red-900/20"}
          valueColor={totalProfit < 0 ? "text-red-600" : undefined} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Cash-Flow Forecast (outstanding)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => [gbp(Number(v)), "Outstanding"]} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {cashFlow.map((d, i) => (
                  <Cell key={i} fill={d.amount > 0 ? "#3b82f6" : "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {cashFlow.every((d) => d.amount === 0) && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              No outstanding invoices due in the next 6 months.
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Job Profitability by Month</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={profitByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => [gbp(Number(v)), "Profit"]} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {profitByMonth.map((d, i) => (
                  <Cell key={i} fill={d.profit < 0 ? "#ef4444" : d.profit > 0 ? "#f59e0b" : "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {profitByMonth.every((d) => d.profit === 0) && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              No completed jobs with profit data in the last 6 months.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
