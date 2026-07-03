"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { jobInsertSchema, jobUpdateSchema } from "@/lib/schemas/jobs";

export async function createJob(values: unknown): Promise<{ error: string } | void> {
  const parsed = jobInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}

export async function updateJob(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = jobUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  redirect(`/jobs/${id}`);
}

export async function updateJobStatus(
  id: string,
  status: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const extra =
    status === "completed" ? { completed_date: new Date().toISOString() } : {};
  const { error } = await supabase
    .from("jobs")
    .update({ status, ...extra })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
}

export async function deleteJob(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function approveReschedule(
  rescheduleId: string,
  jobId: string,
  newDate: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ start_date: newDate })
    .eq("id", jobId);
  if (jobError) return { error: jobError.message };

  const { error: reqError } = await supabase
    .from("reschedule_requests")
    .update({ status: "approved" })
    .eq("id", rescheduleId);
  if (reqError) return { error: reqError.message };

  revalidatePath(`/jobs/${jobId}`);
}

export async function rejectReschedule(
  rescheduleId: string,
  jobId: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reschedule_requests")
    .update({ status: "rejected" })
    .eq("id", rescheduleId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}