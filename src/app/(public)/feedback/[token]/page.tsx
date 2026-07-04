import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";
import type { Job } from "@/lib/schemas/jobs";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, customer_name, start_date, assigned_team")
    .eq("message_token", token)
    .single<Partial<Job>>();

  if (!job) notFound();

  const { data: existing } = await supabase
    .from("job_completions")
    .select("id, star_rating")
    .eq("job_id", job.id!)
    .not("feedback", "is", null)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-background p-6 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Feedback Request</p>
        <h1 className="text-xl font-bold">{job.title}</h1>
        {job.start_date && (
          <p className="text-sm text-muted-foreground">
            {new Date(job.start_date).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        )}
      </div>

      {existing ? (
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-700 p-6 text-center space-y-2">
          <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Feedback Received</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Thank you for your feedback{existing.star_rating ? ` — ${existing.star_rating} stars` : ""}!
          </p>
        </div>
      ) : (
        <FeedbackForm jobId={job.id!} token={token} customerName={job.customer_name ?? ""} />
      )}
    </div>
  );
}