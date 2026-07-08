"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Job } from "@/lib/schemas/jobs";
import type { Invoice } from "@/lib/schemas/invoices";
import type { Lead } from "@/lib/schemas/leads";
import type { Quote } from "@/lib/schemas/quotes";

type Props = {
  jobs: Job[];
  invoices: Invoice[];
  leads: Lead[];
  quotes: Quote[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function getMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function getMonthLabel(iso: string) {
  const d = new Date(iso);
  return MONTHS[d.getMonth()];
}

function buildLast6Months() {
  const keys: string[] = [];
  const labels: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${d.getMonth()}`);
    labels.push(MONTHS[d.getMonth()]);
  }
  return { keys, labels };
}

export function AnalyticsDashboard({ jobs, invoices, leads, quotes }: Props) {
  const { keys, labels } = buildLast6Months();

  // Revenue per month
  const revenueByMonth = keys.map((k, i) => {
    const total = invoices
      .filter((inv) => getMonthKey(inv.created_date) === k && inv.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.total), 0);
    return { month: labels[i], revenue: parseFloat(total.toFixed(2)) };
  });

  // Jobs by month
  const jobsByMonth = keys.map((k, i) => {
    const count = jobs.filter((j) => getMonthKey(j.created_date) === k).length;
    const completed = jobs.filter(
      (j) => getMonthKey(j.created_date) === k && j.status === "completed"
    ).length;
    return { month: labels[i], total: count, completed };
  });

  // Leads by month
  const leadsByMonth = keys.map((k, i) => {
    const count = leads.filter((l) => getMonthKey(l.created_date) === k).length;
    return { month: labels[i], leads: count };
  });

  // Job status breakdown
  const statusCounts = [
    "scheduled", "in_progress", "completed", "invoiced", "awaiting_payment", "cancelled"
  ].map((s, i) => ({
    name: s.replace("_", " "),
    value: jobs.filter((j) => j.status === s).length,
    color: COLORS[i],
  })).filter((s) => s.value > 0);

  // Lead conversion
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  // Quote conversion
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;
  const quoteRate = totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : "0";

  // Outstanding balance
  const outstanding = invoices
    .filter((inv) => ["sent", "part_paid", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid)), 0);

  // Total revenue 6mo
  const totalRevenue6mo = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Revenue (6mo)" value={`£${totalRevenue6mo.toLocaleString()}`} />
        <KpiCard label="Outstanding" value={`£${outstanding.toLocaleString()}`} sub="unpaid invoices" warn={outstanding > 0} />
        <KpiCard label="Lead Conversion" value={`${conversionRate}%`} sub={`${wonLeads}/${totalLeads} leads`} />
        <KpiCard label="Quote Conversion" value={`${quoteRate}%`} sub={`${acceptedQuotes}/${totalQuotes} quotes`} />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="font-medium text-sm mb-4">Revenue (paid invoices)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueByMonth}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, "Revenue"]} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Jobs + Leads charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm mb-4">Jobs by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jobsByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm mb-4">New Leads by Month</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsByMonth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Leads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Job status breakdown */}
      {statusCounts.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm mb-4">Job Status Breakdown</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, String(name)]} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 flex-1">
              {statusCounts.map((s, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="capitalize">{s.name}</span>
                  </span>
                  <span className="font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${warn ? "text-destructive" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}