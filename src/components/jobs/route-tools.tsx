"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Route, Ruler, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/schemas/jobs";

const POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;

function extractPostcode(address: string | null | undefined): string | null {
  if (!address) return null;
  const m = address.match(POSTCODE_RE);
  return m ? m[1].toUpperCase().replace(/\s+/g, " ").trim() : null;
}

// Postcode-area distance heuristic (no geocoding) — same as Base44's optimiser.
function areaOf(pc: string | null): string {
  if (!pc) return "";
  const m = pc.match(/^([A-Z]{1,2})\d/i);
  return m ? m[1].toUpperCase() : "";
}
function pcDistance(a: string | null, b: string | null): number {
  if (!a || !b) return 2;
  if (a === b) return 0;
  return areaOf(a) === areaOf(b) ? 1 : 2;
}

function nearestNeighbour(jobs: Job[]): Job[] {
  if (jobs.length < 2) return jobs;
  const remaining = [...jobs];
  const ordered: Job[] = [remaining.shift()!];
  while (remaining.length) {
    const last = extractPostcode(ordered[ordered.length - 1].address);
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((j, i) => {
      const d = pcDistance(last, extractPostcode(j.address));
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

// 150-min slots (2h job + 30m travel) from 08:00.
function slotTimes(i: number): { start: string; end: string } {
  const startMin = 8 * 60 + i * 150;
  const endMin = startMin + 120;
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return { start: fmt(startMin), end: fmt(endMin) };
}

async function geocode(pc: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc.replace(/\s+/g, ""))}`);
    if (!res.ok) return null;
    const j = await res.json();
    return j.result ? { lat: j.result.latitude, lng: j.result.longitude } : null;
  } catch {
    return null;
  }
}
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function RouteTools({ dayJobs, dayLabel }: { dayJobs: Job[]; dayLabel: string }) {
  const [tab, setTab] = useState<"route" | "distance" | null>(null);
  const withAddress = dayJobs.filter((j) => j.address);
  const optimised = nearestNeighbour(withAddress);

  // Distance calculator
  const [pc, setPc] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ job: Job; miles: number | null }[] | null>(null);

  async function calcDistances() {
    const clean = extractPostcode(pc) ?? pc.trim();
    if (!clean) return;
    setBusy(true);
    const origin = await geocode(clean);
    const rows = await Promise.all(
      withAddress.map(async (job) => {
        const jpc = extractPostcode(job.address);
        const loc = jpc ? await geocode(jpc) : null;
        return { job, miles: origin && loc ? Math.round(haversine(origin, loc)) : null };
      }),
    );
    rows.sort((a, b) => (a.miles ?? 999) - (b.miles ?? 999));
    setResults(rows);
    setBusy(false);
  }

  const distanceBadge = (m: number | null) =>
    m === null ? "bg-gray-100 text-gray-500"
      : m < 5 ? "bg-emerald-100 text-emerald-700"
      : m < 15 ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-2 border-b">
        <button
          onClick={() => setTab(tab === "route" ? null : "route")}
          className={cn("inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md", tab === "route" ? "bg-primary text-white" : "hover:bg-muted")}
        >
          <Route className="size-4" /> Route Optimiser
          {withAddress.length >= 2 && <span className="text-[10px] bg-black/10 rounded-full px-1.5">{withAddress.length}</span>}
        </button>
        <button
          onClick={() => setTab(tab === "distance" ? null : "distance")}
          className={cn("inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md", tab === "distance" ? "bg-primary text-white" : "hover:bg-muted")}
        >
          <Ruler className="size-4" /> Distance Calculator
        </button>
        <span className="ml-auto text-xs text-muted-foreground pr-2">{dayLabel}</span>
      </div>

      {tab === "route" && (
        <div className="p-4">
          {withAddress.length < 2 ? (
            <p className="text-sm text-muted-foreground">Need at least 2 jobs with addresses on this day to optimise a route.</p>
          ) : (
            <ol className="space-y-2">
              {optimised.map((job, i) => {
                const t = slotTimes(i);
                return (
                  <li key={job.id} className="flex items-center gap-3 text-sm">
                    <span className="size-6 shrink-0 rounded-full bg-primary text-white text-xs flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Suggested {t.start}–{t.end}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {tab === "distance" && (
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={pc}
              onChange={(e) => setPc(e.target.value)}
              placeholder="New job postcode e.g. M1 2AB"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
            <button onClick={calcDistances} disabled={busy || !pc.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-4 text-sm disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />} Calculate
            </button>
          </div>
          {results && (
            results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs with addresses on this day.</p>
            ) : (
              <ul className="space-y-1.5">
                {results.map(({ job, miles }) => (
                  <li key={job.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{job.title} <span className="text-muted-foreground text-xs">· {job.address}</span></span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", distanceBadge(miles))}>
                      {miles === null ? "—" : `${miles} mi`}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
          <p className="text-xs text-muted-foreground">Tip: assign the new job to the same operative as the nearest job to minimise travel.</p>
        </div>
      )}
    </div>
  );
}
