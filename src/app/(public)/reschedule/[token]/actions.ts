"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { generateDateSuggestions, type BookingJob, type DateSuggestion } from "@/lib/booking";
import { getBranding, bookingConfirmationHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

// §12 — customer self-reschedule (replaces the legacy request→approve flow).
// Possession of the job message_token authorizes the change; service client.

type RescheduleJob = {
  id: string;
  title: string | null;
  customer_name: string | null;
  customer_email: string | null;
  address: string | null;
  status: string;
  start_date: string | null;
  message_token: string;
  assigned_contractor_id: string | null;
};

function isReschedulable(status: string): boolean {
  return status !== "completed" && status !== "cancelled";
}

export async function getPublicJobForReschedule(
  token: string,
): Promise<{ error: string } | { job: { title: string | null; startDate: string | null; status: string }; suggestions: DateSuggestion[] }> {
  if (!token) return { error: "Invalid link" };
  const supabase = await createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, address, status, start_date")
    .eq("message_token", token)
    .single<{ id: string; title: string | null; address: string | null; status: string; start_date: string | null }>();
  if (!job) return { error: "Job not found" };
  if (!isReschedulable(job.status)) return { error: `This job is ${job.status} and can't be rescheduled.` };

  const today = new Date().toISOString().slice(0, 10);
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, start_date, address, assigned_team")
    .gte("start_date", today)
    .returns<BookingJob[]>();

  const branding = await getBranding(supabase);
  const suggestions = await generateDateSuggestions(job.address, jobs ?? [], branding.workingDays);
  return { job: { title: job.title, startDate: job.start_date, status: job.status }, suggestions };
}

const rescheduleSchema = z.object({
  token: z.string().min(1),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function publicRescheduleJob(
  token: string,
  dateStr: string,
): Promise<{ error: string } | { ok: true }> {
  const parsed = rescheduleSchema.safeParse({ token, dateStr });
  if (!parsed.success) return { error: "Invalid reschedule request" };

  const supabase = await createServiceClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, customer_name, customer_email, address, status, start_date, message_token, assigned_contractor_id")
    .eq("message_token", token)
    .single<RescheduleJob>();
  if (!job) return { error: "Job not found" };
  if (!isReschedulable(job.status)) return { error: `This job is ${job.status} and can't be rescheduled.` };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr < todayStr) return { error: "Please choose a future date." };

  const newStart = `${dateStr}T08:00:00.000Z`;
  const { error } = await supabase
    .from("jobs")
    .update({ start_date: newStart, end_date: newStart })
    .eq("id", job.id);
  if (error) return { error: error.message };

  // Emails — best-effort, never block the reschedule.
  try {
    const branding = await getBranding(supabase);
    const jobDateLong = new Date(newStart).toLocaleDateString("en-GB", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
    const emailData = {
      jobTitle: job.title ?? "Your job",
      customerName: job.customer_name,
      jobDateLong,
      jobAddress: job.address,
    };
    const rescheduleLink = `${branding.appBaseUrl}/reschedule/${job.message_token}`;

    if (job.customer_email) {
      await sendEmail({
        to: job.customer_email,
        from: branding.from,
        subject: `Your appointment has moved — ${emailData.jobTitle} on ${jobDateLong}`,
        html: bookingConfirmationHtml(emailData, branding, rescheduleLink),
      });
    }
    // Notify office.
    if (branding.email) {
      await sendEmail({
        to: branding.email,
        from: branding.from,
        subject: `📅 Customer rescheduled — ${emailData.jobTitle}`,
        html: `<p><strong>${emailData.customerName ?? "A customer"}</strong> rescheduled <strong>${emailData.jobTitle}</strong> to <strong>${jobDateLong}</strong>.</p>`,
      });
    }
    // Notify the assigned contractor, if any.
    if (job.assigned_contractor_id) {
      const { data: contractor } = await supabase
        .from("contractors").select("email, contact_name").eq("id", job.assigned_contractor_id)
        .maybeSingle<{ email: string | null; contact_name: string | null }>();
      if (contractor?.email) {
        await sendEmail({
          to: contractor.email,
          from: branding.from,
          subject: `Job date changed — ${emailData.jobTitle}`,
          html: `<p>Hi ${contractor.contact_name ?? "there"},</p><p>The customer moved <strong>${emailData.jobTitle}</strong> to <strong>${jobDateLong}</strong>. Please update your diary.</p>`,
        });
      }
    }
  } catch {
    // swallow — the reschedule itself succeeded
  }

  revalidatePath(`/reschedule/${token}`);
  return { ok: true };
}
