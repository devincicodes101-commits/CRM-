import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import type { Job } from "@/lib/schemas/jobs";
import type { Invoice } from "@/lib/schemas/invoices";
import type { Lead } from "@/lib/schemas/leads";
import type { Quote } from "@/lib/schemas/quotes";

function startOfMonth(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const sixMonthsAgo = startOfMonth(5);

  const [
    { data: jobs },
    { data: invoices },
    { data: leads },
    { data: quotes },
  ] = await Promise.all([
    supabase.from("jobs").select("*").gte("created_date", sixMonthsAgo).returns<Job[]>(),
    supabase.from("invoices").select("*").gte("created_date", sixMonthsAgo).returns<Invoice[]>(),
    supabase.from("leads").select("*").gte("created_date", sixMonthsAgo).returns<Lead[]>(),
    supabase.from("quotes").select("*").gte("created_date", sixMonthsAgo).returns<Quote[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Last 6 months performance overview</p>
      </div>
      <AnalyticsDashboard
        jobs={jobs ?? []}
        invoices={invoices ?? []}
        leads={leads ?? []}
        quotes={quotes ?? []}
      />
    </div>
  );
}