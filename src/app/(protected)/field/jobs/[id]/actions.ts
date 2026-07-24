"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFile } from "@/lib/storage";

// Field operative / contractor requests extra work beyond the original scope.
export async function createExtraWorkRequest(
  jobId: string,
  description: string,
  amount: number,
): Promise<{ error: string } | { ok: true }> {
  if (!description.trim()) return { error: "Describe the extra work" };
  if (!amount || amount <= 0) return { error: "Enter an amount greater than 0" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job } = await supabase
    .from("jobs")
    .select("title, assigned_contractor_id, assigned_contractor_user_id")
    .eq("id", jobId)
    .single<{ title: string | null; assigned_contractor_id: string | null; assigned_contractor_user_id: string | null }>();
  if (!job) return { error: "Job not found" };
  if (!job.assigned_contractor_id)
    return { error: "Extra-work requests are only available on contractor-assigned jobs." };

  const { error } = await supabase.from("extra_work_requests").insert({
    job_id: jobId,
    job_title: job.title,
    contractor_id: job.assigned_contractor_id,
    contractor_user_id: job.assigned_contractor_user_id,
    description: description.trim(),
    amount,
    status: "pending",
    created_by_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/field/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

// Operative uploads a site photo from the field — stored in the job-photos
// bucket and appended to the job's client_photos.
export async function uploadFieldPhoto(
  jobId: string,
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected" };
  if (!file.type.startsWith("image/")) return { error: "Please upload an image" };
  if (file.size > 10 * 1024 * 1024) return { error: "Image must be under 10MB" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job } = await supabase
    .from("jobs")
    .select("client_photos")
    .eq("id", jobId)
    .single<{ client_photos: unknown }>();
  if (!job) return { error: "Job not found" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${jobId}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await uploadFile("job-photos", path, buf, file.type);
  if (!up.ok) return { error: up.error };

  const photos = Array.isArray(job.client_photos) ? job.client_photos : [];
  const { error } = await supabase
    .from("jobs")
    .update({
      client_photos: [
        ...photos,
        { url: up.publicUrl, caption: "", uploaded_at: new Date().toISOString() },
      ],
    })
    .eq("id", jobId);
  if (error) return { error: error.message };

  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true };
}
