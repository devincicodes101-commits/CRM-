"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vehicleInsertSchema, vehicleUpdateSchema, attendanceInsertSchema } from "@/lib/schemas/fleet";

// ─── Vehicle CRUD ──────────────────────────────────────────────────────────────

export async function createVehicle(formData: unknown) {
  const parsed = vehicleInsertSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/fleet");
  redirect("/fleet");
}

export async function updateVehicle(id: string, formData: unknown) {
  const parsed = vehicleUpdateSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/fleet");
  revalidatePath(`/fleet/vehicles/${id}`);
  redirect(`/fleet/vehicles/${id}`);
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/fleet");
  redirect("/fleet");
}

export async function updateVehicleStatus(
  id: string,
  status: "active" | "idle" | "maintenance" | "repair" | "offline"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ status, last_updated: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/fleet");
  revalidatePath(`/fleet/vehicles/${id}`);
}

// ─── Attendance ────────────────────────────────────────────────────────────────

export async function createAttendance(formData: unknown) {
  const parsed = attendanceInsertSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("attendance").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/fleet/attendance");
}

export async function updateAttendance(id: string, formData: unknown) {
  const parsed = attendanceInsertSchema.partial().safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid data" };

  const supabase = await createClient();
  const { error } = await supabase.from("attendance").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/fleet/attendance");
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/fleet/attendance");
}