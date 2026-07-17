import Link from "next/link";
import { Plus, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Quote } from "@/lib/schemas/quotes";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

const STATUSES = ["all", "draft", "sent", "accepted", "declined", "expired"] as const;
const CLIENT_TYPES = ["all", "residential", "commercial"] as const;
const HIGH_VALUE_THRESHOLD = 3000;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string; value?: string; q?: string }>;
}) {
  const { status, client, value, q } = await searchParams;
  const currentStatus = status ?? "all";
  const currentClient = client ?? "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("id, full_name, role").eq("id", user!.id).single();

  let query = supabase
    .from("quotes")
    .select("id, quote_number, customer_name, customer_email, client_type, total, status, created_date, sent_date, valid_until, sales_agent_name, reminder_note, reminder_date")
    .order("created_date", { ascending: false });

  if (currentStatus !== "all") query = query.eq("status", currentStatus);
  if (currentClient !== "all") query = query.eq("client_type", currentClient);
  if (value === "high") query = query.gte("total", HIGH_VALUE_THRESHOLD);
  if (q) query = query.ilike("customer_name", `%${q}%`);

  const { data: quotes } = await query.returns<Quote[]>();
  const list = quotes ?? [];

  const { data: commSettings } = await supabase.from("commission_settings").select("rate_percent").eq("user_id", user!.id).single();
  const rate = commSettings?.rate_percent ?? 3;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const myAccepted = list.filter((q) => q.status === "accepted" && q.sales_agent_name === me?.full_name);
  const myMonthly = myAccepted.filter((q) => new Date(q.created_date) >= thisMonth);
  const monthCommission = myMonthly.reduce((s, q) => s + Number(q.total) * (rate / 100), 0);
  const allTimeCommission = myAccepted.reduce((s, q) => s + Number(q.total) * (rate / 100), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{list.length} quotes created</p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" /> New Quote
        </Link>
      </div>

      {/* Commission panel */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-4 text-primary" />
          <span className="font-semibold text-sm">My Commission</span>
          <Link href="/commissions" className="ml-auto text-sm text-primary font-medium hover:underline flex items-center gap-1">
            Details <span>›</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-primary mt-1">£{monthCommission.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{myMonthly.length} closed deals</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <p className="text-sm text-muted-foreground">All Time</p>
            <p className="text-2xl font-bold mt-1">£{allTimeCommission.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{myAccepted.length} total deals</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {rate}% rate · {monthStart} – {monthEnd}
        </p>
      </div>

      {/* Color key */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">Colour key:</span>
        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-700 font-medium">
          High-Value Commercial £{(HIGH_VALUE_THRESHOLD / 1000).toFixed(0)}k+
        </span>
        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-purple-700 font-medium">
          High-Value Residential £{(HIGH_VALUE_THRESHOLD / 1000).toFixed(0)}k+
        </span>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <form className="relative w-72">
            <svg className="absolute left-3 top-2.5 size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by customer name or quote ref…"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Status:</span>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/quotes?status=${s}&client=${currentClient}&value=${value ?? "all"}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                currentStatus === s ? "bg-primary text-white border-primary" : "hover:bg-muted border-border"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Client:</span>
          {CLIENT_TYPES.map((c) => (
            <Link
              key={c}
              href={`/quotes?status=${currentStatus}&client=${c}&value=${value ?? "all"}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                currentClient === c ? "bg-primary text-white border-primary" : "hover:bg-muted border-border"
              }`}
            >
              {c}
            </Link>
          ))}

          <span className="ml-2 text-xs text-muted-foreground">Value:</span>
          {[["all", "All"], ["high", "High Value"]].map(([val, label]) => (
            <Link
              key={val}
              href={`/quotes?status=${currentStatus}&client=${currentClient}&value=${val}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                (value ?? "all") === val ? "bg-primary text-white border-primary" : "hover:bg-muted border-border"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Quote list */}
      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white shadow-sm p-16 text-center">
          <p className="text-muted-foreground">No quotes found.</p>
          <Link href="/quotes/new" className="text-sm text-primary font-medium hover:underline mt-2 block">
            Create your first quote
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {list.length} QUOTE{list.length !== 1 ? "S" : ""} SHOWN
          </div>
          <div className="divide-y">
            {list.map((q) => {
              const isHighValue = Number(q.total) >= HIGH_VALUE_THRESHOLD;
              const isHighCommercial = isHighValue && q.client_type === "commercial";
              const isHighResidential = isHighValue && q.client_type === "residential";
              return (
                <div key={q.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Customer */}
                  <div className="w-40 shrink-0">
                    <Link href={`/quotes/${q.id}`} className="font-semibold hover:text-primary transition-colors">
                      {q.customer_name}
                    </Link>
                    {q.customer_email && (
                      <p className="text-xs text-muted-foreground truncate">{q.customer_email}</p>
                    )}
                  </div>

                  {/* Ref */}
                  <div className="w-28 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">QT-{q.quote_number}</span>
                  </div>

                  {/* Value */}
                  <div className="w-28 shrink-0">
                    <span className={`font-semibold ${isHighValue ? "text-primary" : ""}`}>
                      £{Number(q.total).toLocaleString()}
                    </span>
                    {isHighCommercial && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Big Deal</span>
                    )}
                    {isHighResidential && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">High Value</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-24 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {q.status}
                    </span>
                  </div>

                  {/* Sent */}
                  <div className="w-20 shrink-0 text-xs text-muted-foreground">
                    {q.sent_date
                      ? new Date(q.sent_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </div>

                  {/* Valid Until */}
                  <div className="w-20 shrink-0 text-xs text-muted-foreground">
                    {q.valid_until
                      ? new Date(q.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : "—"}
                  </div>

                  {/* Agent */}
                  <div className="flex-1 text-xs text-muted-foreground truncate">
                    {q.sales_agent_name ?? "—"}
                  </div>

                  {/* Reminder */}
                  {q.reminder_date && !q.reminder_note && (
                    <div className="shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        {new Date(q.reminder_date) < new Date() ? "Call overdue" : "Reminder set"}
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/quotes/${q.id}`}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
