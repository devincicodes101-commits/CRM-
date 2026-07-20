"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addMonths, addWeeks, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, format,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rescheduleJobDate } from "@/app/(protected)/jobs/actions";
import type { Job } from "@/lib/schemas/jobs";

type View = "month" | "week" | "day";
const WEEK_OPTS = { weekStartsOn: 1 as const };

function jobDay(j: Job): Date | null {
  if (!j.start_date) return null;
  const d = new Date(j.start_date);
  return isNaN(d.getTime()) ? null : d;
}

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Two jobs conflict if same assigned_team, same day, and overlapping (or unknown) times.
function computeConflicts(jobs: Job[]): Set<string> {
  const conflicts = new Set<string>();
  const byKey = new Map<string, Job[]>();
  for (const j of jobs) {
    const d = jobDay(j);
    if (!d || !j.assigned_team || j.status === "cancelled") continue;
    const key = `${j.assigned_team}|${format(d, "yyyy-MM-dd")}`;
    (byKey.get(key) ?? byKey.set(key, []).get(key)!).push(j);
  }
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let k = i + 1; k < group.length; k++) {
        const a = group[i], b = group[k];
        const aS = toMinutes(a.start_time), aE = toMinutes(a.end_time);
        const bS = toMinutes(b.start_time), bE = toMinutes(b.end_time);
        const overlap =
          aS === null || bS === null || aE === null || bE === null
            ? true // unknown times → treat as a clash
            : aS < bE && bS < aE;
        if (overlap) { conflicts.add(a.id); conflicts.add(b.id); }
      }
    }
  }
  return conflicts;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-blue-500", in_progress: "bg-amber-500", on_hold: "bg-yellow-500",
  completed: "bg-emerald-500", invoiced: "bg-purple-500", awaiting_payment: "bg-indigo-500",
  cancelled: "bg-gray-400",
};

export function JobCalendar({ jobs: initialJobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Reset optimistic local state when the server sends new data (React-recommended
  // "adjust state during render" pattern — no effect, no cascading renders).
  const [prevInitial, setPrevInitial] = useState(initialJobs);
  if (prevInitial !== initialJobs) {
    setPrevInitial(initialJobs);
    setJobs(initialJobs);
  }

  const conflicts = useMemo(() => computeConflicts(jobs), [jobs]);

  const jobsOn = (day: Date) =>
    jobs
      .filter((j) => { const d = jobDay(j); return d && isSameDay(d, day); })
      .sort((a, b) => (toMinutes(a.start_time) ?? 0) - (toMinutes(b.start_time) ?? 0));

  function move(delta: number) {
    setAnchor((a) => (view === "month" ? addMonths(a, delta) : view === "week" ? addWeeks(a, delta) : addDays(a, delta)));
  }

  function onDrop(day: Date) {
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const job = jobs.find((j) => j.id === id);
    const orig = job ? jobDay(job) : null;
    if (!job || !orig) return;
    if (isSameDay(orig, day)) return;

    const next = new Date(day);
    next.setHours(orig.getHours(), orig.getMinutes(), orig.getSeconds(), 0);
    const nextISO = next.toISOString();

    const prev = jobs;
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, start_date: nextISO } : j))); // optimistic
    startTransition(async () => {
      const res = await rescheduleJobDate(id, nextISO);
      if ("error" in res) {
        setJobs(prev);
        toast.error(res.error);
      } else {
        toast.success(`Moved to ${format(day, "d MMM")}`);
        router.refresh();
      }
    });
  }

  const title =
    view === "month" ? format(anchor, "MMMM yyyy")
    : view === "week" ? `${format(startOfWeek(anchor, WEEK_OPTS), "d MMM")} – ${format(endOfWeek(anchor, WEEK_OPTS), "d MMM yyyy")}`
    : format(anchor, "EEEE d MMMM yyyy");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="p-2 rounded-md hover:bg-muted"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setAnchor(new Date())} className="px-3 py-1.5 rounded-md border text-sm font-medium hover:bg-muted">Today</button>
          <button onClick={() => move(1)} className="p-2 rounded-md hover:bg-muted"><ChevronRight className="size-4" /></button>
          <h2 className="ml-2 font-semibold">{title}</h2>
        </div>
        <div className="flex items-center rounded-lg border p-0.5">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3 py-1 rounded-md text-sm capitalize", view === v ? "bg-primary text-white" : "hover:bg-muted")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {conflicts.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertTriangle className="size-4" /> {conflicts.size} job{conflicts.size > 1 ? "s have" : " has"} a scheduling clash (same team, overlapping time).
        </div>
      )}

      {view === "month" && <MonthGrid anchor={anchor} jobsOn={jobsOn} conflicts={conflicts} onDrop={onDrop} setDragId={setDragId} />}
      {view === "week" && <WeekGrid anchor={anchor} jobsOn={jobsOn} conflicts={conflicts} onDrop={onDrop} setDragId={setDragId} />}
      {view === "day" && <DayList day={anchor} jobs={jobsOn(anchor)} conflicts={conflicts} />}
    </div>
  );
}

type GridProps = {
  anchor: Date;
  jobsOn: (d: Date) => Job[];
  conflicts: Set<string>;
  onDrop: (d: Date) => void;
  setDragId: (id: string | null) => void;
};

function Chip({ job, conflict, setDragId }: { job: Job; conflict: boolean; setDragId: (id: string | null) => void }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      draggable
      onDragStart={(e) => { setDragId(job.id); e.dataTransfer.effectAllowed = "move"; }}
      onDragEnd={() => setDragId(null)}
      className={cn(
        "block text-[11px] leading-tight rounded px-1.5 py-1 truncate cursor-grab active:cursor-grabbing border-l-2",
        conflict ? "bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400" : "bg-muted/60 hover:bg-muted"
      )}
      style={{ borderLeftColor: job.color ?? "#f97316" }}
      title={`${job.title}${job.start_time ? " · " + job.start_time : ""}`}
    >
      <span className={cn("inline-block size-1.5 rounded-full mr-1 align-middle", STATUS_DOT[job.status] ?? "bg-gray-400")} />
      {job.start_time ? <span className="text-muted-foreground">{job.start_time} </span> : null}
      {job.title}
    </Link>
  );
}

function MonthGrid({ anchor, jobsOn, conflicts, onDrop, setDragId }: GridProps) {
  const start = startOfWeek(startOfMonth(anchor), WEEK_OPTS);
  const end = endOfWeek(endOfMonth(anchor), WEEK_OPTS);
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayJobs = jobsOn(day);
          const inMonth = isSameMonth(day, anchor);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
              className={cn("min-h-24 border-b border-r p-1 last:border-r-0 space-y-0.5", !inMonth && "bg-muted/20")}
            >
              <div className={cn("text-xs px-1", today && "inline-flex items-center justify-center size-5 rounded-full bg-primary text-white font-semibold", !inMonth && "text-muted-foreground")}>
                {format(day, "d")}
              </div>
              {dayJobs.slice(0, 4).map((job) => (
                <Chip key={job.id} job={job} conflict={conflicts.has(job.id)} setDragId={setDragId} />
              ))}
              {dayJobs.length > 4 && <p className="text-[10px] text-muted-foreground px-1">+{dayJobs.length - 4} more</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ anchor, jobsOn, conflicts, onDrop, setDragId }: GridProps) {
  const start = startOfWeek(anchor, WEEK_OPTS);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((day) => {
        const dayJobs = jobsOn(day);
        const today = isSameDay(day, new Date());
        return (
          <div key={day.toISOString()} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(day)}
            className="rounded-xl border bg-card p-2 min-h-40 space-y-1">
            <div className={cn("text-xs font-medium mb-1", today && "text-primary")}>
              {format(day, "EEE d")}
            </div>
            {dayJobs.length === 0 ? <p className="text-[11px] text-muted-foreground">—</p> :
              dayJobs.map((job) => <Chip key={job.id} job={job} conflict={conflicts.has(job.id)} setDragId={setDragId} />)}
          </div>
        );
      })}
    </div>
  );
}

function DayList({ day, jobs, conflicts }: { day: Date; jobs: Job[]; conflicts: Set<string> }) {
  return (
    <div className="rounded-xl border bg-card divide-y">
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground p-5">No jobs scheduled for {format(day, "d MMMM")}.</p>
      ) : jobs.map((job) => (
        <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40"
          style={{ borderLeftWidth: 3, borderLeftColor: job.color ?? "#f97316" }}>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate flex items-center gap-1.5">
              {conflicts.has(job.id) && <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />}
              {job.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{job.customer_name} · {job.address}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-sm">{job.start_time ?? ""}{job.end_time ? ` – ${job.end_time}` : ""}</p>
            <p className="text-xs text-muted-foreground capitalize">{job.assigned_team ?? job.status.replace(/_/g, " ")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
