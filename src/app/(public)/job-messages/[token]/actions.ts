"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/storage";

type JobRef = { id: string; title: string | null; customer_name: string | null; client_photos: unknown };

async function jobByToken(token: string): Promise<JobRef | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, title, customer_name, client_photos")
    .eq("message_token", token)
    .single<JobRef>();
  return data ?? null;
}

// Customer posts a message to the job thread (as the "client" party).
export async function postClientMessage(
  token: string,
  body: string
): Promise<{ ok: true } | { error: string }> {
  if (!body.trim()) return { error: "Please enter a message" };
  const job = await jobByToken(token);
  if (!job) return { error: "Job not found" };

  const supabase = await createServiceClient();
  const { error } = await supabase.from("job_messages").insert({
    job_id: job.id,
    job_title: job.title,
    sender_role: "client",
    sender_name: job.customer_name,
    body: body.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/job-messages/${token}`);
  return { ok: true };
}

// Customer uploads a site photo (stored in the job-photos bucket, appended to the job).
export async function uploadClientPhoto(
  token: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected" };
  if (!file.type.startsWith("image/")) return { error: "Please upload an image" };

  const job = await jobByToken(token);
  if (!job) return { error: "Job not found" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${job.id}/${Date.now()}.${ext}`;
  const buf = await file.arrayBuffer();
  const up = await uploadFile("job-photos", path, buf, file.type);
  if (!up.ok) return { error: up.error };

  const photos = Array.isArray(job.client_photos) ? job.client_photos : [];
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("jobs")
    .update({ client_photos: [...photos, { url: up.publicUrl, caption: "", uploaded_at: new Date().toISOString() }] })
    .eq("id", job.id);
  if (error) return { error: error.message };

  revalidatePath(`/job-messages/${token}`);
  return { ok: true };
}
