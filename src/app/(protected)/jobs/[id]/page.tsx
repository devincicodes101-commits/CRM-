import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  Play,
  CheckCircle,
  Receipt,
  PauseCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncButton } from "@/components/ui/async-button";
import { updateJobStatus, approveReschedule, rejectReschedule } from "@/app/(protected)/jobs/actions";
import { createInvoiceFromJob } from "@/app/(protected)/invoices/actions";
import { BidPanel } from "@/components/contractors/bid-panel";
import { JobMessagesPanel, type JobMessage } from "@/components/jobs/job-messages-panel";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import type { Job } from "@/lib/schemas/jobs";
import type { RescheduleRequest } from "@/lib/schemas/job-related";
import type { JobBid, Subcontractor } from "@/lib/schemas/contractors";

const STATUS_VARIANT = {
  scheduled: "secondary",
  on_hold: "outline",
  in_progress: "default",
  completed: "default",
  invoiced: "outline",
  awaiting_payment: "secondary",
  cancelled: "destructive",
} as const;

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
  urgent: "destructive",
} as const;

export default async function JobDetailPage({
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

  const { data: rescheduleRequests } = await supabase
    .from("reschedule_requests")
    .select("*")
    .eq("job_id", id)
    .order("created_date", { ascending: false })
    .returns<RescheduleRequest[]>();

  const [{ data: bids }, { data: subcontractors }, { data: jobMessages }] = await Promise.all([
    supabase.from("job_bids").select("*").eq("job_id", id).order("created_date", { ascending: false }).returns<JobBid[]>(),
    supabase.from("subcontractors").select("id, name, company_name").eq("status", "active").order("name").returns<Subcontractor[]>(),
    supabase.from("job_messages").select("id, sender_role, sender_name, body, created_date").eq("job_id", id).order("created_date", { ascending: true }).returns<JobMessage[]>(),
  ]);

  const pending = rescheduleRequests?.filter((r) => r.status === "pending") ?? [];

  const mapsUrl = job.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="size-4" /> Jobs
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full shrink-0 mt-1"
              style={{ background: job.color ?? "#f97316" }}
            />
            <h1 className="text-2xl font-bold">{job.title}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant={STATUS_VARIANT[job.status as keyof typeof STATUS_VARIANT] ?? "outline"}
              className="capitalize"
            >
              {job.status.replace("_", " ")}
            </Badge>
            <Badge
              variant={PRIORITY_VARIANT[job.priority as keyof typeof PRIORITY_VARIANT] ?? "outline"}
              className="text-xs capitalize"
            >
              {job.priority}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Status lifecycle buttons */}
          {job.status === "scheduled" && (
            <AsyncButton action={() => updateJobStatus(id, "in_progress")} size="sm">
              <Play className="size-4" /> Start Job
            </AsyncButton>
          )}
          {job.status === "in_progress" && (
            <AsyncButton
              action={() => updateJobStatus(id, "completed")}
              variant="secondary"
              size="sm"
            >
              <CheckCircle className="size-4" /> Mark Complete
            </AsyncButton>
          )}
          {job.status === "completed" && (
            <>
              <AsyncButton
                action={() => createInvoiceFromJob(id)}
                size="sm"
              >
                <Receipt className="size-4" /> Create Invoice
              </AsyncButton>
              <AsyncButton
                action={() => updateJobStatus(id, "invoiced")}
                variant="secondary"
                size="sm"
              >
                Mark Invoiced
              </AsyncButton>
            </>
          )}
          {!["cancelled", "invoiced", "completed"].includes(job.status) && (
            <AsyncButton
              action={() => updateJobStatus(id, "on_hold")}
              variant="outline"
              size="sm"
            >
              <PauseCircle className="size-4" /> Hold
            </AsyncButton>
          )}
          {!["cancelled", "completed", "invoiced"].includes(job.status) && (
            <AsyncButton
              action={() => updateJobStatus(id, "cancelled")}
              variant="outline"
              size="sm"
            >
              <XCircle className="size-4" /> Cancel
            </AsyncButton>
          )}
          {job.status === "completed" && job.message_token && (
            <CopyLinkButton
              url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/completion/${job.message_token}`}
              label="Sign-off Link"
              variant="outline"
              size="sm"
            />
          )}
          {job.message_token && (
            <CopyLinkButton
              url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/feedback/${job.message_token}`}
              label="Feedback Link"
              variant="outline"
              size="sm"
            />
          )}
          {job.message_token && (
            <CopyLinkButton
              url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/job-messages/${job.message_token}`}
              label="Messages Link"
              variant="outline"
              size="sm"
            />
          )}
          <Link
            href={`/jobs/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Pending reschedule requests */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-700 p-4 space-y-3">
          <h2 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
            {pending.length} Reschedule Request{pending.length > 1 ? "s" : ""} Pending
          </h2>
          {pending.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4">
              <div className="text-sm space-y-0.5">
                <p className="font-medium">{r.customer_name}</p>
                {r.requested_date && (
                  <p className="text-muted-foreground">
                    Requested:{" "}
                    {new Date(r.requested_date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
                {r.reason && <p className="text-muted-foreground italic">{r.reason}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <AsyncButton
                  action={() => approveReschedule(r.id, id, r.requested_date ?? job.start_date)}
                  size="xs"
                >
                  Approve
                </AsyncButton>
                <AsyncButton
                  action={() => rejectReschedule(r.id, id)}
                  variant="outline"
                  size="xs"
                >
                  Reject
                </AsyncButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Customer</h2>
          <dl className="space-y-2 text-sm">
            {job.customer_name && <Row label="Name" value={job.customer_name} />}
            {job.customer_email && <Row label="Email" value={job.customer_email} />}
            {job.customer_id && (
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Profile</dt>
                <dd>
                  <Link href={`/customers/${job.customer_id}`} className="text-primary hover:underline text-sm">
                    View customer →
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Schedule</h2>
          <dl className="space-y-2 text-sm">
            <Row
              label="Start"
              value={new Date(job.start_date).toLocaleString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            {job.end_date && (
              <Row
                label="End"
                value={new Date(job.end_date).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}
            {job.assigned_team && <Row label="Operative" value={job.assigned_team} />}
            {job.assigned_vehicle && <Row label="Vehicle" value={job.assigned_vehicle} />}
            {job.completed_date && (
              <Row
                label="Completed"
                value={new Date(job.completed_date).toLocaleDateString("en-GB")}
              />
            )}
          </dl>
        </div>
      </div>

      {/* Address + value */}
      {(job.address || job.total_value > 0) && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Site & Value</h2>
          <dl className="space-y-2 text-sm">
            {job.address && (
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Address</dt>
                <dd className="flex items-start gap-2">
                  <span>{job.address}</span>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                    >
                      <MapPin className="size-3" /> Map
                    </a>
                  )}
                </dd>
              </div>
            )}
            {job.total_value > 0 && (
              <Row label="Value" value={`£${Number(job.total_value).toLocaleString()}`} />
            )}
            {job.quote_id && (
              <div className="flex gap-4">
                <dt className="w-28 shrink-0 text-muted-foreground">Quote</dt>
                <dd>
                  <Link href={`/quotes/${job.quote_id}`} className="text-primary hover:underline">
                    View quote →
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h2>
          <p className="text-sm whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      {/* Checklist */}
      {job.checklist && job.checklist.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Checklist</h2>
          <ul className="space-y-1.5">
            {job.checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "size-4 rounded border flex items-center justify-center shrink-0 text-[10px]",
                    item.checked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {item.checked ? "✓" : ""}
                </span>
                <span className={item.checked ? "line-through text-muted-foreground" : ""}>
                  {item.label}
                </span>
                {item.notes && (
                  <span className="text-muted-foreground italic text-xs">— {item.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
        </div>
      )}

      {/* Customer messages thread */}
      <JobMessagesPanel jobId={id} messages={jobMessages ?? []} />

      {/* Bids */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          Contractor Bids {bids && bids.length > 0 ? `(${bids.length})` : ""}
        </h2>
        <BidPanel
          jobId={id}
          bids={bids ?? []}
          subcontractors={subcontractors ?? []}
          canManage={true}
        />
      </div>

      {/* Past reschedule requests */}
      {rescheduleRequests && rescheduleRequests.filter((r) => r.status !== "pending").length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Reschedule History
          </h2>
          <ul className="space-y-2 text-sm">
            {rescheduleRequests
              .filter((r) => r.status !== "pending")
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{r.customer_name}</span>
                    {r.requested_date && (
                      <span className="text-muted-foreground ml-2">
                        → {new Date(r.requested_date).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={r.status === "approved" ? "default" : "destructive"}
                    className="capitalize text-xs"
                  >
                    {r.status}
                  </Badge>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}