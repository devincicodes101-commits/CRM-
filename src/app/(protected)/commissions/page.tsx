import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { DollarSign, TrendingUp, Users, FileText } from "lucide-react";
import { CreateCommissionInvoiceButton } from "./create-invoice-button";

type AgentSummary = {
  agent_id: string;
  agent_name: string;
  agent_email: string | null;
  quote_count: number;
  total_quote_value: number;
  commission_amount: number;
};

export default async function CommissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!me || !["admin", "user"].includes(me.role)) redirect("/dashboard");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [settingsRes, quotesThisMonth, quotesLastMonth, commissionInvoices] =
    await Promise.all([
      supabase
        .from("commission_settings")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("quotes")
        .select(
          "id, sales_agent_id, sales_agent_name, customer_email, total, status, created_date"
        )
        .eq("status", "accepted")
        .gte("created_date", monthStart.toISOString())
        .lte("created_date", monthEnd.toISOString()),
      supabase
        .from("quotes")
        .select("id, sales_agent_id, total")
        .eq("status", "accepted")
        .gte("created_date", lastMonthStart.toISOString())
        .lte("created_date", lastMonthEnd.toISOString()),
      supabase
        .from("commission_invoices")
        .select("sales_agent_id, total_due, status, period_start, period_end")
        .order("created_date", { ascending: false })
        .limit(50),
    ]);

  const commissionRate = settingsRes.data?.rate_percent ?? 5;

  const agentMap = new Map<string, AgentSummary>();

  for (const q of quotesThisMonth.data ?? []) {
    if (!q.sales_agent_id || !q.sales_agent_name) continue;
    const existing = agentMap.get(q.sales_agent_id);
    if (existing) {
      existing.quote_count += 1;
      existing.total_quote_value += Number(q.total ?? 0);
      existing.commission_amount =
        existing.total_quote_value * (commissionRate / 100);
    } else {
      const value = Number(q.total ?? 0);
      agentMap.set(q.sales_agent_id, {
        agent_id: q.sales_agent_id,
        agent_name: q.sales_agent_name,
        agent_email: q.customer_email ?? null,
        quote_count: 1,
        total_quote_value: value,
        commission_amount: value * (commissionRate / 100),
      });
    }
  }

  const agents = Array.from(agentMap.values()).sort(
    (a, b) => b.commission_amount - a.commission_amount
  );

  const totalThisMonth = (quotesThisMonth.data ?? []).reduce(
    (s, q) => s + Number(q.total ?? 0),
    0
  );
  const totalLastMonth = (quotesLastMonth.data ?? []).reduce(
    (s, q) => s + Number(q.total ?? 0),
    0
  );
  const totalCommissionThisMonth = totalThisMonth * (commissionRate / 100);
  const totalLastMonthCommission = totalLastMonth * (commissionRate / 100);
  const growth =
    totalLastMonthCommission > 0
      ? ((totalCommissionThisMonth - totalLastMonthCommission) /
          totalLastMonthCommission) *
        100
      : 0;

  const paidThisMonth = (commissionInvoices.data ?? [])
    .filter((ci) => ci.status === "paid")
    .reduce((s, ci) => s + Number(ci.total_due ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(monthStart, "MMMM yyyy")} · Rate:{" "}
          <span className="font-semibold">{commissionRate}%</span> on accepted
          quotes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Commission Due"
          value={`£${totalCommissionThisMonth.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          sub={
            growth !== 0
              ? `${growth > 0 ? "+" : ""}${growth.toFixed(1)}% vs last month`
              : "No change vs last month"
          }
        />
        <KpiCard
          title="Total Accepted Value"
          value={`£${totalThisMonth.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          sub={`${quotesThisMonth.data?.length ?? 0} accepted quotes`}
        />
        <KpiCard
          title="Active Agents"
          value={String(agents.length)}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          sub="With accepted quotes this month"
        />
        <KpiCard
          title="Paid Out This Month"
          value={`£${paidThisMonth.toFixed(2)}`}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          sub="Commission invoices marked paid"
        />
      </div>

      <div className="rounded-lg border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">
            Agent Breakdown — {format(monthStart, "MMMM yyyy")}
          </h2>
          <a
            href="/commission-invoices"
            className="text-xs text-primary hover:underline"
          >
            View all invoices →
          </a>
        </div>

        {agents.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No accepted quotes with a sales agent assigned this month.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 font-medium">Agent</th>
                  <th className="text-right px-4 py-2 font-medium">Quotes</th>
                  <th className="text-right px-4 py-2 font-medium">
                    Quote Value
                  </th>
                  <th className="text-right px-4 py-2 font-medium">
                    Commission ({commissionRate}%)
                  </th>
                  <th className="text-right px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.agent_id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{agent.agent_name}</p>
                      {agent.agent_email && (
                        <p className="text-xs text-muted-foreground">
                          {agent.agent_email}
                        </p>
                      )}
                    </td>
                    <td className="text-right px-4 py-3">
                      {agent.quote_count}
                    </td>
                    <td className="text-right px-4 py-3">
                      £{agent.total_quote_value.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-green-600">
                      £{agent.commission_amount.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3">
                      {me.role === "admin" && (
                        <CreateCommissionInvoiceButton
                          agentId={agent.agent_id}
                          agentName={agent.agent_name}
                          commissionRate={commissionRate}
                          periodStart={monthStart.toISOString()}
                          periodEnd={monthEnd.toISOString()}
                        />
                      )}
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

function KpiCard({
  title,
  value,
  icon,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </p>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
