import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, MapPin, User } from "lucide-react";
import { RescheduleForm } from "./reschedule-form";

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, customer_name, customer_email, address, start_date, start_time, status")
    .eq("message_token", token)
    .single();

  if (!job) notFound();

  if (job.status === "completed" || job.status === "cancelled") {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-2">
        <div className="text-4xl">ℹ️</div>
        <h1 className="text-xl font-bold">Job Already {job.status}</h1>
        <p className="text-sm text-muted-foreground">
          This job cannot be rescheduled because it is {job.status}.
        </p>
      </div>
    );
  }

  const formattedDate = job.start_date
    ? format(new Date(job.start_date), "EEEE, d MMMM yyyy")
    : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request a Reschedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Let us know when you&apos;d prefer us to visit.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-base">{job.title}</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          {job.customer_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              {job.customer_name}
            </div>
          )}
          {formattedDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              {formattedDate}
              {job.start_time ? ` at ${job.start_time}` : ""}
            </div>
          )}
          {job.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {job.address}
            </div>
          )}
        </div>
      </div>

      <RescheduleForm
        jobId={job.id}
        jobTitle={job.title}
        customerName={job.customer_name ?? ""}
        customerEmail={job.customer_email ?? ""}
        originalDate={job.start_date}
      />
    </div>
  );
}
