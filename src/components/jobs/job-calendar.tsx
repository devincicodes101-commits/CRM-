"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/lib/schemas/jobs";

type Props = { jobs: Job[] };

const STATUS_VARIANT = {
  scheduled: "secondary",
  on_hold: "outline",
  in_progress: "default",
  completed: "default",
  invoiced: "outline",
  awaiting_payment: "secondary",
  cancelled: "destructive",
} as const;

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function JobCalendar({ jobs }: Props) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const jobDates = jobs
    .map((j) => {
      try {
        return new Date(j.start_date);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Date[];

  const selectedDayJobs = selected
    ? jobs.filter((j) => {
        try {
          return isSameDay(new Date(j.start_date), selected);
        } catch {
          return false;
        }
      })
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="rounded-xl border bg-card p-4 w-fit shrink-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ hasJob: jobDates }}
          modifiersClassNames={{
            hasJob:
              "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
          }}
        />
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {selected
            ? selected.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
            : "Select a date"}
        </h3>
        {selectedDayJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedDayJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border bg-card p-3 flex items-start gap-3"
                style={{ borderLeftWidth: 3, borderLeftColor: job.color ?? "#f97316" }}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-medium text-sm hover:underline block truncate"
                  >
                    {job.title}
                  </Link>
                  {job.customer_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{job.customer_name}</p>
                  )}
                  {job.address && (
                    <p className="text-xs text-muted-foreground truncate">{job.address}</p>
                  )}
                  {(job.start_time || job.end_time) && (
                    <p className="text-xs text-muted-foreground">
                      {job.start_time}{job.end_time ? ` – ${job.end_time}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant={STATUS_VARIANT[job.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                    className="text-[10px] capitalize"
                  >
                    {job.status.replace("_", " ")}
                  </Badge>
                  {job.assigned_team && (
                    <span className="text-[10px] text-muted-foreground">{job.assigned_team}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}