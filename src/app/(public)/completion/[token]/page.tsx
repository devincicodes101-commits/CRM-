import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompletionForm } from "./completion-form";
import type { Job } from "@/lib/schemas/jobs";

export default async function CompletionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("message_token", token)
    .single<Job>();

  if (!job) notFound();

  // Check if already signed off
  const { data: existingCompletion } = await supabase
    .from("job_completions")
    .select("id, customer_signed_off, star_rating")
    .eq("job_id", job.id)
    .eq("customer_signed_off", true)
    .maybeSingle();

  const checkedItems = job.checklist?.filter((c) => c.checked) ?? [];
  const allChecked = job.checklist?.length > 0 && checkedItems.length === job.checklist.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-background p-6 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Job Completion</p>
          <h1 className="text-xl font-bold">{job.title}</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t text-sm text-muted-foreground">
          {job.customer_name && <p><span className="font-medium text-foreground">Customer:</span> {job.customer_name}</p>}
          {job.address && <p><span className="font-medium text-foreground">Address:</span> {job.address}</p>}
          {job.start_date && (
            <p>
              <span className="font-medium text-foreground">Date:</span>{" "}
              {new Date(job.start_date).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
          {job.assigned_team && <p><span className="font-medium text-foreground">Operative:</span> {job.assigned_team}</p>}
        </div>
      </div>

      {/* Checklist summary */}
      {job.checklist && job.checklist.length > 0 && (
        <div className="rounded-2xl border bg-background p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Work Completed</h2>
            <span className="text-xs text-muted-foreground">
              {checkedItems.length}/{job.checklist.length} items
            </span>
          </div>
          <ul className="space-y-2">
            {job.checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={`size-5 rounded border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.checked
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {item.checked ? "✓" : "○"}
                </span>
                <span className={item.checked ? "" : "text-muted-foreground"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Already signed off */}
      {existingCompletion ? (
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-6 text-center space-y-2">
          <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Already Signed Off</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Thank you — your sign-off has been recorded.
            {existingCompletion.star_rating && ` You gave us ${existingCompletion.star_rating} stars.`}
          </p>
        </div>
      ) : (
        <CompletionForm jobId={job.id} token={token} customerName={job.customer_name ?? ""} />
      )}
    </div>
  );
}