import Link from "next/link";
import { Building2 } from "lucide-react";
import { differenceInCalendarDays, startOfWeek, endOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { SendRemindersButton } from "./send-reminders-button";

const THRESHOLD = 3000;
const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const STATUS_FILTERS = ["open", "all", "draft", "sent", "accepted", "declined"] as const;
const FOLLOWUP_FILTERS = ["all", "needs_follow_up", "overdue", "due_this_week", "done"] as const;

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", sent: "bg-blue-100 text-blue-700",
  accepted: "bg-emerald-100 text-emerald-700", declined: "bg-red-100 text-red-700", expired: "bg-muted",
};

function followupStatus(q: Row): { label: string; tone: "overdue" | "due" | "done" | "none" } {
  if (q.status === "accepted" || q.status === "declined") return { label: "Done", tone: "done" };
  const ref = q.reminder_date ?? q.valid_until;
  if (!ref) return { label: "No reminder", tone: "none" };
  const days = differenceInCalendarDays(new Date(ref), new Date());
  if (days < 0) return { label: "Overdue", tone: "overdue" };
  if (days <= 7) return { label: "Due this week", tone: "due" };
  return { label: "Scheduled", tone: "none" };
}

export default async function HighValueCommercialPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; followup?: string }>;
}) {
  const { status = "open", followup = "all" } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_type", "commercial")
    .gte("total", THRESHOLD)
    .order("created_date", { ascending: false });

  const all = (data ?? []) as Row[];

  // KPIs (computed over the full high-value commercial set)
  const open = all.filter((q) => q.status === "draft" || q.status === "sent");
  const totalPipeline = open.reduce((s, q) => s + (q.total ?? 0), 0);
  const overdue = all.filter((q) => followupStatus(q).tone === "overdue").length;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dueThisWeek = all.filter((q) => {
    const ref = q.reminder_date ?? q.valid_until;
    return ref && new Date(ref) >= weekStart && new Date(ref) <= weekEnd && q.status !== "accepted" && q.status !== "declined";
  }).length;
  const noReminder = all.filter((q) => !q.reminder_date && q.status !== "accepted" && q.status !== "declined").length;

  // Filters
  let rows = all;
  if (status === "open") rows = rows.filter((q) => q.status === "draft" || q.status === "sent");
  else if (status !== "all") rows = rows.filter((q) => q.status === status);
  if (followup === "needs_follow_up") rows = rows.filter((q) => ["overdue", "due", "none"].includes(followupStatus(q).tone));
  else if (followup === "overdue") rows = rows.filter((q) => followupStatus(q).tone === "overdue");
  else if (followup === "due_this_week") rows = rows.filter((q) => followupStatus(q).tone === "due");
  else if (followup === "done") rows = rows.filter((q) => followupStatus(q).tone === "done");

  const kpis = [
    { label: "Total Pipeline", value: gbp(totalPipeline), sub: `${open.length} quotes`, accent: "border-l-blue-500" },
    { label: "Overdue Follow-up", value: overdue, sub: "need urgent action", accent: "border-l-red-500", danger: true },
    { label: "Due This Week", value: dueThisWeek, sub: "scheduled this week", accent: "border-l-amber-500" },
    { label: "No Reminder Set", value: noReminder, sub: "set a reminder now", accent: "border-l-muted" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">High-Value Commercial</h1>
            <p className="text-sm text-muted-foreground">Commercial quotes over {gbp(THRESHOLD)} — track &amp; follow up</p>
          </div>
        </div>
        <SendRemindersButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={cn("rounded-xl border border-l-4 bg-card p-5", k.accent)}>
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className={cn("text-2xl font-bold mt-1", k.danger && "text-red-600")}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <FilterRow label="Status" current={status} options={STATUS_FILTERS} param="status" other={{ followup }} />
        <FilterRow label="Follow-up" current={followup} options={FOLLOWUP_FILTERS} param="followup" other={{ status }} />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b text-sm font-medium">{rows.length} quote{rows.length !== 1 ? "s" : ""} shown</div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-8 text-center">No matching quotes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Quote Ref</th>
                  <th className="px-4 py-2 font-medium text-right">Value</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Sales Agent</th>
                  <th className="px-4 py-2 font-medium">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const fu = followupStatus(q);
                  return (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link href={`/quotes/${q.id}`} className="font-medium hover:underline">{q.customer_name}</Link>
                        {q.customer_email && <p className="text-xs text-muted-foreground">{q.customer_email}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{q.quote_number}</td>
                      <td className="px-4 py-3 text-right font-semibold">{gbp(q.total ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLOR[q.status] ?? "bg-muted")}>{q.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{q.sales_agent_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                          fu.tone === "overdue" ? "bg-red-100 text-red-700" :
                          fu.tone === "due" ? "bg-amber-100 text-amber-700" :
                          fu.tone === "done" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                          {fu.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label, current, options, param, other,
}: {
  label: string; current: string; options: readonly string[]; param: string; other: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground w-16">{label}:</span>
      {options.map((o) => {
        const qs = new URLSearchParams({ ...other, [param]: o }).toString();
        return (
          <Link key={o} href={`/high-value-commercial?${qs}`}
            className={cn("px-3 py-1 rounded-full text-sm capitalize transition-colors",
              current === o ? "bg-primary text-white" : "border hover:bg-muted")}>
            {o.replace(/_/g, " ")}
          </Link>
        );
      })}
    </div>
  );
}
