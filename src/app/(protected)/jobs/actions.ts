"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { jobInsertSchema, jobUpdateSchema } from "@/lib/schemas/jobs";
import { onJobCreated } from "@/lib/automations/triggers";

export async function createJob(values: unknown): Promise<{ error: string } | void> {
  const parsed = jobInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id, message_token")
    .single();
  if (error) return { error: error.message };

  onJobCreated({ ...parsed.data, id: data.id, message_token: data.message_token });

  // fire-and-forget sync to field app
  const fieldAppUrl = process.env.FIELD_APP_URL;
  const syncSecret = process.env.CRM_SYNC_SECRET;
  if (fieldAppUrl && syncSecret) {
    fetch(`${fieldAppUrl}/api/crm-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${syncSecret}`,
      },
      body: JSON.stringify({
        external_ref: data.id,
        title: parsed.data.title,
        address: parsed.data.address ?? "",
        client_name: parsed.data.customer_name ?? "",
        client_email: parsed.data.customer_email ?? undefined,
        total_value: parsed.data.total_value,
        scheduled_date: parsed.data.start_date,
      }),
    }).catch(() => {/* non-critical */});
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}

export async function updateJob(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = jobUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };

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

export async function rescheduleJobDate(
  jobId: string,
  newStartISO: string
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("jobs")
    .update({ start_date: newStartISO })
    .eq("id", jobId);
  if (error) return { error: error.message };

  revalidatePath("/jobs");
  return { ok: true };
}

export async function postOfficeMessage(
  jobId: string,
  body: string
): Promise<{ error: string } | { ok: true }> {
  if (!body.trim()) return { error: "Message is empty" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single<{ full_name: string | null }>();

  const { error } = await supabase.from("job_messages").insert({
    job_id: jobId,
    sender_role: "office",
    sender_name: me?.full_name ?? user.email,
    body: body.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
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