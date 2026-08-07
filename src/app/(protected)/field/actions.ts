"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/storage";
import type { JobMaterial } from "@/lib/schemas/jobs";

// Walkaround video captured at completion → returns the stored URL.
export async function uploadCompletionVideo(
  jobId: string,
  formData: FormData,
): Promise<{ error: string } | { url: string }> {
  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0) return { error: "No video selected" };
  if (!file.type.startsWith("video/")) return { error: "Please upload a video" };
  if (file.size > 60 * 1024 * 1024) return { error: "Video must be under 60MB" };
  const ext = file.name.split(".").pop() || "mp4";
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await uploadFile("job-photos", `completions/${jobId}/${Date.now()}.${ext}`, buf, file.type);
  if (!up.ok) return { error: up.error };
  return { url: up.publicUrl };
}

export async function checkIn(
  jobId: string,
  lat: number,
  lng: number
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      check_in_time: new Date().toISOString(),
      check_in_lat: lat,
      check_in_lng: lng,
      arrival_confirmed: true,
      status: "in_progress",
    })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/field/jobs/${jobId}`);
  revalidatePath("/field");
}

export async function checkOut(jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ check_out_time: new Date().toISOString() })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/field/jobs/${jobId}`);
}

export async function toggleChecklistItem(
  jobId: string,
  checklist: { label: string; checked: boolean; notes?: string }[]
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update({ checklist }).eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/field/jobs/${jobId}`);
}

export async function saveMaterials(
  jobId: string,
  materials: JobMaterial[]
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ materials_used: materials })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/field/jobs/${jobId}`);
}

export async function completeJobFromField(
  jobId: string,
  notes: string,
  extras?: {
    satisfaction?: "excellent" | "good" | "satisfactory" | "poor" | null;
    starRating?: number | null;
    comments?: string | null;
    videoUrl?: string | null;
  },
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs").select("title, customer_name, customer_email").eq("id", jobId)
    .single<{ title: string | null; customer_name: string | null; customer_email: string | null }>();

  const { error } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
      check_out_time: new Date().toISOString(),
      notes: notes || null,
    })
    .eq("id", jobId);
  if (error) return { error: error.message };

  // Record the completion (customer satisfaction / rating / walkaround video).
  const { data: me } = user
    ? await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle<{ full_name: string | null }>()
    : { data: null };
  const completion = {
    job_id: jobId,
    job_title: job?.title ?? null,
    customer_name: job?.customer_name ?? null,
    customer_email: job?.customer_email ?? null,
    operative_name: me?.full_name ?? user?.email ?? null,
    customer_satisfaction: extras?.satisfaction ?? null,
    star_rating: extras?.starRating ?? null,
    customer_comments: extras?.comments ?? null,
    feedback: extras?.comments ?? null,
    video_url: extras?.videoUrl ?? null,
    completed_date: new Date().toISOString(),
  };
  const { data: existing } = await supabase.from("job_completions").select("id").eq("job_id", jobId).maybeSingle<{ id: string }>();
  if (existing) await supabase.from("job_completions").update(completion).eq("id", existing.id);
  else await supabase.from("job_completions").insert({ ...completion, created_by_id: user?.id ?? null });

  revalidatePath(`/field/jobs/${jobId}`);
  revalidatePath("/field");
}

export async function addArrivalNote(
  jobId: string,
  note: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ arrival_note: note })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/field/jobs/${jobId}`);
}