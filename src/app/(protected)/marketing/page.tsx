import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { TrendingUp, Users, DollarSign, Target, BarChart2 } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  tiktok: "#010101",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  website_form: "#f97316",
  google_ads: "#4285F4",
  referral: "#10B981",
  other: "#6B7280",
};

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  website_form: "Website Form",
  google_ads: "Google Ads",
  referral: "Referral",
  other: "Other",
};

export default async function MarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const lastStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const [leadsRes, lastLeadsRes, settingsRes] = await Promise.all([
    supabase.from("leads").select("id, source, status, created_date").gte("created_date", monthStart).lte("created_date", monthEnd),
    supabase.from("leads").select("id, source, status").gte("created_date", lastStart).lte("created_date", lastEnd),
    supabase.from("company_settings").select("monthly_marketing_spend").limit(1).maybeSingle(),
  ]);

  const leads = leadsRes.data ?? [];
  const lastLeads = lastLeadsRes.data ?? [];
  const spend = Number(settingsRes.data?.monthly_marketing_spend ?? 0);

  const wonLeads = leads.filter(l => l.status === "won").length;
  const conversionRate = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0;
  const costPerLead = leads.length && spend ? Math.round(spend / leads.length) : 0;
  const growth = lastLeads.length ? Math.round(((leads.length - lastLeads.length) / lastLeads.length) * 100) : 0;

  // Group by source
  const bySource: Record<string, { total: number; won: number }> = {};
  for (const l of leads) {
    const src = l.source ?? "other";
    if (!bySource[src]) bySource[src] = { total: 0, won: 0 };
    bySource[src].total += 1;
    if (l.status === "won") bySource[src].won += 1;
  }
  const sourceEntries = Object.entries(bySource).sort((a, b) => b[1].total - a[1].total);
  const maxCount = Math.max(...sourceEntries.map(([, v]) => v.total), 1);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Marketing Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{format(now, "MMMM yyyy")} · Lead source attribution and ROI</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: leads.length, icon: <Users className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50", sub: growth !== 0 ? `${growth > 0 ? "+" : ""}${growth}% vs last month` : "Same as last month" },
          { label: "Won Leads", value: wonLeads, icon: <Target className="h-4 w-4 text-green-600" />, bg: "bg-green-50", sub: `${conversionRate}% conversion` },
          { label: "Monthly Spend", value: spend ? `£${spend.toLocaleString()}` : "Not set", icon: <DollarSign className="h-4 w-4 text-orange-600" />, bg: "bg-orange-50", sub: "Set in Settings" },
          { label: "Cost Per Lead", value: costPerLead ? `£${costPerLead}` : "—", icon: <TrendingUp className="h-4 w-4 text-purple-600" />, bg: "bg-purple-50", sub: spend ? "Based on monthly spend" : "Set spend in Settings" },
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

      {/* Lead source breakdown */}
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Leads by Source</h2>
        </div>

        {sourceEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No leads this month yet.</p>
        ) : (
          <div className="space-y-4">
            {sourceEntries.map(([src, { total, won }]) => (
              <div key={src}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[src] ?? "#6B7280" }} />
                    <span className="text-sm font-medium">{SOURCE_LABELS[src] ?? src}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{total} leads</span>
                    <span className="text-green-600 font-medium">{won} won</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(total / maxCount) * 100}%`, background: SOURCE_COLORS[src] ?? "#6B7280" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly trend — last 6 months */}
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <h2 className="font-semibold mb-1">Lead Volume Trend</h2>
        <p className="text-xs text-muted-foreground mb-5">Total leads per month over the last 6 months</p>
        <p className="text-sm text-muted-foreground">Connect Google Analytics or set up lead tracking to see full trend data here.</p>
      </div>
    </div>
  );
}
