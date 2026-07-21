"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2, Search, TrendingUp, Clock, CheckCircle2, AlertCircle, Mail, Eye, RefreshCw,
} from "lucide-react";
import { format, differenceInDays, startOfWeek, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { markReminderDone, sendHighValueReminders } from "./actions";

const HIGH_VALUE = 3000;
const OPEN_STATUSES = ["draft", "sent"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Quote = any;

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-amber-100 text-amber-700 border-amber-200",
};

function getFollowUpStatus(q: Quote): { label: string; color: string; icon: ReactNode } {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  if (q.reminder_date && !q.reminder_done) {
    const rDate = new Date(q.reminder_date);
    if (rDate >= weekStart && rDate <= endOfWeek(now, { weekStartsOn: 1 })) {
      return { label: "Due This Week", color: "bg-amber-100 text-amber-700 border-amber-300", icon: <AlertCircle className="w-3.5 h-3.5" /> };
    }
    if (rDate < now) {
      return { label: "Overdue", color: "bg-red-100 text-red-700 border-red-300", icon: <AlertCircle className="w-3.5 h-3.5" /> };
    }
  }
  if (q.reminder_done) return { label: "Follow-up Done", color: "bg-green-100 text-green-700 border-green-300", icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
  if (!q.reminder_date) return { label: "No Reminder Set", color: "bg-slate-100 text-slate-500 border-slate-200", icon: <Clock className="w-3.5 h-3.5" /> };
  return { label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="w-3.5 h-3.5" /> };
}

export function HighValueCommercialClient({ quotes }: { quotes: Quote[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [pendingSend, startSend] = useTransition();
  const [pendingDone, startDone] = useTransition();

  const filtered = quotes.filter((q) => {
    if ((q.total ?? 0) < HIGH_VALUE) return false;
    const matchStatus = statusFilter === "all" || (statusFilter === "open" ? OPEN_STATUSES.includes(q.status) : q.status === statusFilter);
    const matchSearch = !search ||
      q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number?.toLowerCase().includes(search.toLowerCase());
    const fu = getFollowUpStatus(q).label;
    const matchFollowUp =
      followUpFilter === "all" ||
      (followUpFilter === "needs_followup" && (fu === "Due This Week" || fu === "Overdue" || fu === "No Reminder Set")) ||
      (followUpFilter === "overdue" && fu === "Overdue") ||
      (followUpFilter === "this_week" && fu === "Due This Week") ||
      (followUpFilter === "done" && fu === "Follow-up Done");
    return matchStatus && matchSearch && matchFollowUp;
  });

  const totalValue = filtered.reduce((s, q) => s + (q.total ?? 0), 0);
  const overdueCount = filtered.filter((q) => getFollowUpStatus(q).label === "Overdue").length;
  const dueThisWeek = filtered.filter((q) => getFollowUpStatus(q).label === "Due This Week").length;
  const noReminderCount = filtered.filter((q) => getFollowUpStatus(q).label === "No Reminder Set").length;

  const gbp = (n: number) => `£${(n ?? 0).toLocaleString("en-GB")}`;

  function onSend() {
    startSend(async () => {
      const res = await sendHighValueReminders();
      if ("error" in res) toast.error(res.error);
      else toast.success(`Reminder emails sent to ${res.sent} agent(s)`);
    });
  }
  function onDone(id: string) {
    startDone(async () => {
      const res = await markReminderDone(id);
      if ("error" in res) toast.error(res.error);
      else toast.success("Follow-up marked as done");
    });
  }

  const STATUS_BTNS: [string, string][] = [["open", "Open"], ["all", "All"], ["draft", "Draft"], ["sent", "Sent"], ["accepted", "Accepted"], ["declined", "Declined"]];
  const FOLLOWUP_BTNS: [string, string][] = [["all", "All"], ["needs_followup", "Needs Follow-up"], ["overdue", "Overdue"], ["this_week", "Due This Week"], ["done", "Done"]];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">High-Value Commercial</h1>
            <p className="text-sm text-muted-foreground">Commercial quotes over £3,000 — track &amp; follow up</p>
          </div>
        </div>
        <Button onClick={onSend} disabled={pendingSend} className="gap-2 bg-blue-600 hover:bg-blue-700">
          {pendingSend ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Send Weekly Reminder Emails
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Pipeline</p>
          <p className="text-2xl font-bold text-blue-700">{gbp(totalValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.length} quotes</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm border-l-4 border-l-red-500 p-4">
          <p className="text-xs text-muted-foreground mb-1">Overdue Follow-up</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-muted-foreground mt-1">need urgent action</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm border-l-4 border-l-amber-500 p-4">
          <p className="text-xs text-muted-foreground mb-1">Due This Week</p>
          <p className="text-2xl font-bold text-amber-600">{dueThisWeek}</p>
          <p className="text-xs text-muted-foreground mt-1">scheduled this week</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm border-l-4 border-l-slate-400 p-4">
          <p className="text-xs text-muted-foreground mb-1">No Reminder Set</p>
          <p className="text-2xl font-bold text-slate-600">{noReminderCount}</p>
          <p className="text-xs text-muted-foreground mt-1">set a reminder now</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customer or quote ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {STATUS_BTNS.map(([val, label]) => (
            <Button key={val} variant={statusFilter === val ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(val)}>{label}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Follow-up:</span>
          {FOLLOWUP_BTNS.map(([val, label]) => (
            <Button key={val} variant={followUpFilter === val ? "default" : "outline"} size="sm" onClick={() => setFollowUpFilter(val)}>{label}</Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="pt-4 px-5 pb-3 border-b text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {filtered.length} quote{filtered.length !== 1 ? "s" : ""} shown
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Quote Ref</th>
                <th className="text-left px-4 py-3 font-semibold">Value</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Sent</th>
                <th className="text-left px-4 py-3 font-semibold">Valid Until</th>
                <th className="text-left px-4 py-3 font-semibold">Sales Agent</th>
                <th className="text-left px-4 py-3 font-semibold">Follow-up Status</th>
                <th className="text-left px-4 py-3 font-semibold">Reminder Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No high-value commercial quotes match your filters.</td></tr>
              )}
              {filtered.map((q) => {
                const fu = getFollowUpStatus(q);
                const daysSinceSent = q.sent_date ? differenceInDays(new Date(), new Date(q.sent_date)) : null;
                const validDays = q.valid_until ? differenceInDays(new Date(q.valid_until), new Date()) : null;
                const isExpiringSoon = validDays !== null && validDays <= 7 && validDays >= 0;
                return (
                  <tr key={q.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold">{q.customer_name || "—"}</div>
                      {q.customer_email && <div className="text-xs text-muted-foreground">{q.customer_email}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{q.quote_number || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-blue-700 text-base">{gbp(q.total ?? 0)}</span>
                      {(q.total ?? 0) >= 10000 && (
                        <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                          <TrendingUp className="w-3 h-3 inline mr-0.5" />Big Deal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={cn("text-xs", statusColors[q.status] ?? "")}>{q.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {q.sent_date ? (
                        <span>{format(new Date(q.sent_date), "dd MMM yyyy")}<br />
                          <span className={cn(daysSinceSent !== null && daysSinceSent > 14 && "text-red-500 font-semibold")}>{daysSinceSent}d ago</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {q.valid_until ? (
                        <span className={isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
                          {format(new Date(q.valid_until), "dd MMM yyyy")}{isExpiringSoon && <span className="ml-1">⚠</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{q.sales_agent_name || "—"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium w-fit", fu.color)}>
                          {fu.icon}{fu.label}
                        </span>
                        {q.reminder_date && <span className="text-xs text-muted-foreground">{format(new Date(q.reminder_date), "dd MMM yyyy")}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="text-xs text-muted-foreground truncate" title={q.reminder_note}>{q.reminder_note || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {!q.reminder_done && q.reminder_date && (
                          <Button size="sm" variant="outline" disabled={pendingDone}
                            className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => onDone(q.id)}>
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </Button>
                        )}
                        <Link href={`/quotes/${q.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="w-3 h-3" /> View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
