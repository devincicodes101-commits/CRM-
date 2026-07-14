import Link from "next/link";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Handshake, PoundSterling, Briefcase, AlertCircle, Truck, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { MessagesWidget, type MessageRow } from "@/components/dashboard/messages-widget";
import {
  RescheduleRequestsWidget,
  type RescheduleRow,
} from "@/components/dashboard/reschedule-requests-widget";
import {
  RemindersWidget,
  type ReminderQuote,
  type ReminderInvoice,
  type ReminderJob,
} from "@/components/dashboard/reminders-widget";
import {
  LowRatingAlertsWidget,
  type AlertRow,
} from "@/components/dashboard/low-rating-alerts-widget";
import { AnalyticsKPIs } from "@/components/dashboard/analytics-kpis";
import { LiveMapWidget, type MapVehicle } from "@/components/dashboard/live-map-widget";

// Supabase has no generated DB types in this repo yet, so rows are untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

const QUOTE_STATUS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-muted text-muted-foreground",
};
const JOB_STATUS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

async function getData() {
  const supabase = await createClient();
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();
  const yesterday = subDays(new Date(), 1).toISOString();

  const [
    quotesRes,
    jobsRes,
    vehiclesRes,
    invoicesRes,
    leadsRes,
    receiptsRes,
    usersCountRes,
    messagesRes,
    reschedRes,
    alertsRes,
    settingsRes,
  ] = await Promise.all([
    supabase.from("quotes").select("*").order("created_date", { ascending: false }),
    supabase.from("jobs").select("*"),
    supabase.from("vehicles").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("receipts").select("job_id, amount_gbp, status"),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("*").eq("status", "open").eq("sender_type", "customer"),
    supabase.from("reschedule_requests").select("*").eq("status", "pending"),
    supabase.from("alerts").select("*").eq("alert_type", "low_rating").eq("status", "active"),
    supabase.from("company_settings").select("monthly_marketing_spend").limit(1).maybeSingle(),
  ]);

  return {
    quotes: (quotesRes.data ?? []) as Row[],
    jobs: (jobsRes.data ?? []) as Row[],
    vehicles: (vehiclesRes.data ?? []) as Row[],
    invoices: (invoicesRes.data ?? []) as Row[],
    leads: (leadsRes.data ?? []) as Row[],
    receipts: (receiptsRes.data ?? []) as Row[],
    userCount: usersCountRes.count ?? 0,
    messages: (messagesRes.data ?? []) as Row[],
    reschedules: (reschedRes.data ?? []) as Row[],
    alerts: (alertsRes.data ?? []) as Row[],
    marketingSpend: (settingsRes.data?.monthly_marketing_spend ?? null) as number | null,
    monthStart,
    monthEnd,
    yesterday,
  };
}

export default async function DashboardPage() {
  const d = await getData();

  // ── Quote stats ────────────────────────────────────────────
  const acceptedValue = d.quotes
    .filter((q) => q.status === "accepted")
    .reduce((s, q) => s + (q.total ?? 0), 0);
  const sentValue = d.quotes
    .filter((q) => q.status !== "draft")
    .reduce((s, q) => s + (q.total ?? 0), 0);
  const thisMonthQuotes = d.quotes.filter(
    (q) => q.created_date >= d.monthStart && q.created_date <= d.monthEnd
  );
  const acceptedThisMonth = thisMonthQuotes.filter((q) => q.status === "accepted").length;
  const acceptedPct = thisMonthQuotes.length
    ? (acceptedThisMonth / thisMonthQuotes.length) * 100
    : 0;

  // ── KPIs ───────────────────────────────────────────────────
  const totalRevenue = d.invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total ?? 0), 0);
  const activeJobs = d.jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress");
  const overdueInvoices = d.invoices.filter((i) => i.status === "overdue").length;
  const activeVehicles = d.vehicles.filter((v) => v.status === "active").length;
  const cancelledJobs = d.jobs.filter((j) => j.status === "cancelled");
  const cancelledValue = cancelledJobs.reduce((s, j) => s + (j.total_value ?? 0), 0);

  // ── Widget data shaping ────────────────────────────────────
  const recentQuotes = d.quotes.slice(0, 5);
  const upcomingJobs = activeJobs
    .slice()
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))
    .slice(0, 5);

  const messages: MessageRow[] = d.messages.map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id ?? null,
    customer_name: m.customer_name,
    customer_email: m.customer_email,
    subject: m.subject ?? null,
    content: m.content,
    sender_type: m.sender_type,
    created_date: m.created_date,
  }));

  const reschedules: RescheduleRow[] = d.reschedules.map((r) => ({
    id: r.id,
    job_id: r.job_id,
    job_title: r.job_title ?? null,
    customer_name: r.customer_name,
    original_date: r.original_date ?? null,
    requested_date: r.requested_date ?? null,
    reason: r.reason ?? null,
  }));

  const reminderQuotes: ReminderQuote[] = d.quotes
    .filter((q) => q.reminder_date && !q.reminder_done)
    .slice(0, 3)
    .map((q) => ({
      id: q.id,
      customer_name: q.customer_name,
      quote_number: q.quote_number,
      reminder_date: q.reminder_date ?? null,
    }));
  const reminderInvoices: ReminderInvoice[] = d.invoices
    .filter((i) => i.status === "sent" || i.status === "overdue" || i.status === "part_paid")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 3)
    .map((i) => ({
      id: i.id,
      invoice_number: i.invoice_number,
      customer_name: i.customer_name,
      total: i.total ?? 0,
      due_date: i.due_date ?? null,
    }));
  const reminderJobs: ReminderJob[] = d.jobs
    .filter((j) => j.status === "scheduled" && (j.start_date ?? "") >= d.yesterday)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))
    .slice(0, 3)
    .map((j) => ({
      id: j.id,
      title: j.title,
      customer_name: j.customer_name ?? null,
      start_date: j.start_date,
    }));

  const alerts: AlertRow[] = d.alerts.map((a) => ({
    id: a.id,
    star_rating: a.star_rating ?? null,
    customer_name: a.customer_name ?? null,
    title: a.title,
    feedback_text: a.feedback_text ?? null,
    created_date: a.created_date,
  }));

  const mapVehicles: MapVehicle[] = d.vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    registration: v.registration,
    driver: v.driver ?? null,
    status: v.status,
    speed: v.speed ?? null,
    current_lat: v.current_lat ?? null,
    current_lng: v.current_lng ?? null,
  }));

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's your business overview."
      />

      {/* Section 1 — Quote stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Quotes Accepted"
          value={gbp(acceptedValue)}
          icon={<Handshake className="h-4 w-4 text-lime-600" />}
          iconBg="bg-lime-50 dark:bg-lime-900/20"
          delay={0}
        />
        <StatCard
          title="Quotes Sent"
          value={gbp(sentValue)}
          icon={<Handshake className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          delay={0.05}
        />
        <div className="rounded-xl border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Accepted This Month</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {acceptedThisMonth} of {thisMonthQuotes.length} quotes
            </p>
          </div>
          <CircularProgress value={acceptedPct} color="#84cc16" size={84} />
        </div>
      </div>

      {/* Section 2 — KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Revenue" value={gbp(totalRevenue)}
          icon={<PoundSterling className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20" delay={0} />
        <StatCard title="Active Jobs" value={activeJobs.length}
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10" delay={0.05} />
        <StatCard title="Overdue Invoices" value={overdueInvoices}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
          iconBg="bg-red-50 dark:bg-red-900/20" delay={0.1} />
        <StatCard title="Fleet Active" value={`${activeVehicles}/${d.vehicles.length}`}
          icon={<Truck className="h-4 w-4 text-purple-600" />}
          iconBg="bg-purple-50 dark:bg-purple-900/20" delay={0.15} />
        <StatCard title="Cancelled Jobs" value={gbp(cancelledValue)}
          subtitle={`${cancelledJobs.length} cancelled`}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          iconBg="bg-red-50 dark:bg-red-900/20" delay={0.2} />
      </div>

      {/* Sections 3 & 4 — Messages + Reschedules */}
      <MessagesWidget messages={messages} />
      <RescheduleRequestsWidget requests={reschedules} />

      {/* Section 5 — Reminders */}
      <RemindersWidget quotes={reminderQuotes} invoices={reminderInvoices} jobs={reminderJobs} />

      {/* Section 6 — Low ratings */}
      <LowRatingAlertsWidget alerts={alerts} />

      {/* Section 7 — Analytics */}
      <AnalyticsKPIs
        jobs={d.jobs}
        invoices={d.invoices}
        vehicles={d.vehicles}
        leads={d.leads}
        userCount={d.userCount}
        receipts={d.receipts}
        marketingSpend={d.marketingSpend}
      />

      {/* Section 8 — Live map */}
      <LiveMapWidget vehicles={mapVehicles} />

      {/* Section 9 — Recent quotes + upcoming jobs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b font-semibold text-sm">
            Recent Quotes
            <Link href="/quotes" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-6">No quotes yet.</p>
          ) : (
            <ul className="divide-y">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/quotes/${q.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{q.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{q.quote_number}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium">{gbp(q.total ?? 0)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUOTE_STATUS[q.status] ?? "bg-muted"}`}>
                        {q.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b font-semibold text-sm">
            Upcoming Jobs
            <Link href="/jobs" className="text-xs text-primary hover:underline">View calendar</Link>
          </div>
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground px-5 py-6">No upcoming jobs.</p>
          ) : (
            <ul className="divide-y">
              {upcomingJobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{j.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {j.customer_name} · {j.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {j.start_date ? format(new Date(j.start_date), "d MMM") : ""}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS[j.status] ?? "bg-muted"}`}>
                        {j.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
