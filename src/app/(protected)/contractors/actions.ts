"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { contractorInsertSchema, contractorUpdateSchema, subcontractorInsertSchema, subcontractorUpdateSchema } from "@/lib/schemas/contractors";

// ─── Contractors ────────────────────────────────────────────────────────────

export async function createContractor(values: unknown): Promise<{ error: string } | void> {
  const parsed = contractorInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("contractors")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/contractors");
  redirect(`/contractors/${data.id}`);
}

export async function updateContractor(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = contractorUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("contractors").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contractors");
  revalidatePath(`/contractors/${id}`);
  redirect(`/contractors/${id}`);
}

export async function deleteContractor(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contractors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contractors");
  redirect("/contractors");
}

// ─── Subcontractors ─────────────────────────────────────────────────────────

export async function createSubcontractor(values: unknown): Promise<{ error: string } | void> {
  const parsed = subcontractorInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("subcontractors")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/contractors");
  redirect(`/contractors/subcontractors/${data.id}`);
}

export async function updateSubcontractor(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = subcontractorUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("subcontractors").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/contractors");
  revalidatePath(`/contractors/subcontractors/${id}`);
  redirect(`/contractors/subcontractors/${id}`);
}

export async function toggleSubcontractorStatus(
  id: string,
  currentStatus: string
): Promise<{ error: string } | void> {
  const next = currentStatus === "active" ? "inactive" : "active";
  const supabase = await createClient();
  const { error } = await supabase.from("subcontractors").update({ status: next }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contractors");
  revalidatePath(`/contractors/subcontractors/${id}`);
}

export async function deleteSubcontractor(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("subcontractors").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contractors");
  redirect("/contractors?tab=subcontractors");
}

// ─── Job Bids ────────────────────────────────────────────────────────────────

export async function submitBid(
  jobId: string,
  subcontractorId: string,
  amount: number,
  notes: string,
  estimatedDays?: number
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subcontractors")
    .select("id, name, company_name")
    .eq("id", subcontractorId)
    .single();
  if (!sub) return { error: "Subcontractor not found" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, start_date, address, description")
    .eq("id", jobId)
    .single();
  if (!job) return { error: "Job not found" };

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("job_bids").insert({
    job_id: jobId,
    job_title: job.title,
    job_start_date: job.start_date,
    job_address: job.address,
    job_description: job.description,
    subcontractor_id: subcontractorId,
    subcontractor_name: sub.name,
    subcontractor_company: sub.company_name,
    amount,
    notes: notes || null,
    estimated_days: estimatedDays ?? null,
    status: "pending",
    created_by_id: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/jobs/${jobId}`);
}

export async function acceptBid(bidId: string, jobId: string, subcontractorId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subcontractors")
    .select("id, name")
    .eq("id", subcontractorId)
    .single();

  const [{ error: bidError }, { error: rejectError }] = await Promise.all([
    supabase.from("job_bids").update({ status: "accepted" }).eq("id", bidId),
    supabase.from("job_bids").update({ status: "rejected" }).eq("job_id", jobId).neq("id", bidId),
  ]);
  if (bidError) return { error: bidError.message };

  // Assign the winning subcontractor to the job
  await supabase
    .from("jobs")
    .update({ assigned_contractor_id: subcontractorId, assigned_team: sub?.name ?? null })
    .eq("id", jobId);

  revalidatePath(`/jobs/${jobId}`);
}

export async function rejectBid(bidId: string, jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("job_bids").update({ status: "rejected" }).eq("id", bidId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}