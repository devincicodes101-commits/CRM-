import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Clock, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CheckInButton } from "@/components/field/check-in-button";
import { ChecklistPanel } from "@/components/field/checklist-panel";
import { MaterialsLogger } from "@/components/field/materials-logger";
import { JobCompletionForm } from "@/components/field/job-completion-form";
import { FieldPhotoUpload } from "@/components/field/photo-upload";
import type { Job } from "@/lib/schemas/jobs";

const STATUS_VARIANT = {
  scheduled: "secondary",
  in_progress: "default",
  on_hold: "outline",
  completed: "outline",
  invoiced: "outline",
  awaiting_payment: "secondary",
  cancelled: "destructive",
} as const;

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single<Job>();

  if (!job) notFound();

  const isActive = ["scheduled", "in_progress", "on_hold"].includes(job.status);
  const isComplete = job.status === "completed";
  const checkedIn = !!job.check_in_time;
  const checkedOut = !!job.check_out_time;

  const mapsUrl = job.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
    : null;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <Link
          href="/field"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="size-4" /> My Jobs
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full shrink-0 mt-0.5"
                style={{ background: job.color ?? "#f97316" }}
              />
              <h1 className="text-xl font-bold">{job.title}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant={STATUS_VARIANT[job.status as keyof typeof STATUS_VARIANT] ?? "outline"}
                className="capitalize"
              >
                {job.status.replace("_", " ")}
              </Badge>
              {job.priority === "urgent" && (
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              )}
            </div>
          </div>
          {isActive && (
            <CheckInButton
              jobId={job.id}
              checkedIn={checkedIn}
              checkedOut={checkedOut}
            />
          )}
        </div>
      </div>

      {/* Key info */}
      <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span>
            {new Date(job.start_date).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {job.end_date && (
              <span className="ml-1">
                → {new Date(job.end_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </span>
        </div>
        {job.address && (
          <div className="flex items-start gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <p>{job.address}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs"
                >
                  Open in Maps →
                </a>
              )}
            </div>
          </div>
        )}
        {job.customer_name && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" />
            <span>{job.customer_name}</span>
          </div>
        )}
        {job.customer_email && (
          <p className="text-xs text-muted-foreground pl-6">{job.customer_email}</p>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Job Description</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{job.description}</p>
        </div>
      )}

      {/* Check-in times */}
      {(checkedIn || checkedOut) && (
        <div className="rounded-xl border bg-card p-4 text-sm space-y-1.5">
          <h2 className="font-semibold mb-2">Attendance</h2>
          {job.check_in_time && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Checked in</span>
              <span>{new Date(job.check_in_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
          {job.check_in_lat && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-mono text-xs">{job.check_in_lat.toFixed(5)}, {job.check_in_lng?.toFixed(5)}</span>
            </div>
          )}
          {job.check_out_time && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Checked out</span>
              <span>{new Date(job.check_out_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>
      )}

      {/* Checklist */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Checklist</h2>
        <ChecklistPanel
          jobId={job.id}
          initialItems={job.checklist ?? []}
          disabled={isComplete}
        />
      </div>

      {/* Site photos */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Site Photos</h2>
        <FieldPhotoUpload
          jobId={job.id}
          photos={(job.client_photos ?? []) as { url: string; caption?: string }[]}
          disabled={isComplete}
        />
      </div>

      {/* Materials */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Materials Used</h2>
        <MaterialsLogger
          jobId={job.id}
          initialMaterials={job.materials_used ?? []}
          disabled={isComplete}
        />
      </div>

      {/* Job value */}
      {job.total_value > 0 && (
        <div className="rounded-xl border bg-card p-4 flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Job Value</span>
          <span className="font-semibold text-lg">£{Number(job.total_value).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold text-sm mb-2">Notes from Office</h2>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{job.notes}</p>
        </div>
      )}

      {/* Complete job */}
      {isActive && checkedIn && !isComplete && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h2 className="font-semibold text-sm">Complete Job</h2>
          <JobCompletionForm jobId={job.id} />
        </div>
      )}

      {isComplete && (
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-4 text-center">
          <p className="font-semibold text-green-800 dark:text-green-200">Job Completed</p>
          {job.completed_date && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {new Date(job.completed_date).toLocaleString("en-GB")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
