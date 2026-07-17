"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { bulkUpdateStatus, bulkAssignTeam, exportJobsCSV } from "./actions";

type Job = { id: string; title: string; customer_name: string | null; status: string; start_date: string | null; total_value: number; assigned_team: string | null };
type TeamMember = { id: string; full_name: string; role: string };

const STATUS_OPTIONS = ["scheduled", "on_hold", "in_progress", "invoiced", "awaiting_payment", "completed", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  invoiced: "bg-purple-100 text-purple-700",
  awaiting_payment: "bg-pink-100 text-pink-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function BulkJobsTable({ jobs, teamMembers }: { jobs: Job[]; teamMembers: TeamMember[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkTeam, setBulkTeam] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const filtered = statusFilter === "all" ? jobs : jobs.filter(j => j.status === statusFilter);

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(j => j.id)));
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    startTransition(async () => {
      const result = await bulkUpdateStatus(Array.from(selected), bulkStatus);
      if (result?.error) setMessage(`Error: ${result.error}`);
      else { setMessage(`Updated ${selected.size} jobs to "${bulkStatus}"`); setSelected(new Set()); }
    });
  }

  function handleBulkAssign() {
    if (!bulkTeam || selected.size === 0) return;
    startTransition(async () => {
      const result = await bulkAssignTeam(Array.from(selected), bulkTeam);
      if (result?.error) setMessage(`Error: ${result.error}`);
      else { setMessage(`Assigned ${selected.size} jobs to "${bulkTeam}"`); setSelected(new Set()); }
    });
  }

  function handleExport() {
    startTransition(async () => {
      const ids = selected.size > 0 ? Array.from(selected) : filtered.map(j => j.id);
      const result = await exportJobsCSV(ids);
      if (result?.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jobs-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(`Exported ${ids.length} jobs`);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm rounded-lg border px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>

        <div className="h-6 border-r" />

        <div className="flex items-center gap-2">
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="text-sm rounded-lg border px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={selected.size === 0}
          >
            <option value="">Change status…</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <button
            onClick={handleBulkStatus}
            disabled={!bulkStatus || selected.size === 0 || isPending}
            className="text-sm px-3 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={bulkTeam}
            onChange={e => setBulkTeam(e.target.value)}
            className="text-sm rounded-lg border px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={selected.size === 0}
          >
            <option value="">Assign team…</option>
            {teamMembers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={!bulkTeam || selected.size === 0 || isPending}
            className="text-sm px-3 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Assign
          </button>
        </div>

        <div className="ml-auto">
          <button
            onClick={handleExport}
            disabled={isPending}
            className="text-sm px-4 py-2 rounded-lg border font-medium hover:bg-muted transition-colors"
          >
            Export CSV {selected.size > 0 ? `(${selected.size})` : `(all ${filtered.length})`}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 flex items-center justify-between">
          {message}
          <button onClick={() => setMessage("")} className="text-green-500 hover:text-green-700 text-xs">✕</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between bg-gray-50/60">
          <span className="text-sm font-medium">{filtered.length} jobs · {selected.size} selected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id} className={`border-b last:border-0 hover:bg-gray-50/40 transition-colors ${selected.has(job.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(job.id)}
                      onChange={() => toggle(job.id)}
                      className="rounded accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/jobs/${job.id}`} className="font-medium hover:text-primary transition-colors">{job.title}</a>
                    {job.assigned_team && <p className="text-xs text-muted-foreground">{job.assigned_team}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{job.customer_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {job.start_date ? format(new Date(job.start_date), "d MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    £{Number(job.total_value ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No jobs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
