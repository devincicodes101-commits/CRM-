"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobMaterial } from "@/lib/schemas/jobs";

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
  notes: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
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