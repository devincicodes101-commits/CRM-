"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { vehicleInsertSchema, vehicleUpdateSchema, attendanceInsertSchema } from "@/lib/schemas/fleet";

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// §7 — an operative's device reports its GPS position. Updates their vehicle's
// live location (service role — vehicles are admin-write) and, when they get
// within ~3 miles of their assigned job, raises a one-per-day "approaching"
// alert for the office. Real-time (no cron) so it works on any plan.
export async function updateOperativeLocation(
  lat: number,
  lng: number,
  speed?: number,
): Promise<{ ok: true } | { skipped: string } | { error: string }> {
  if (typeof lat !== "number" || typeof lng !== "number") return { error: "Invalid coordinates" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: me } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle<{ full_name: string | null }>();
  const name = me?.full_name?.trim();
  if (!name) return { skipped: "no_name" };

  const admin = await createServiceClient();
  const { data: vehicle } = await admin
    .from("vehicles").select("id, assigned_job").eq("driver", name).maybeSingle<{ id: string; assigned_job: string | null }>();
  if (!vehicle) return { skipped: "no_vehicle" };

  await admin.from("vehicles").update({
    current_lat: lat, current_lng: lng, speed: speed ?? 0,
    last_updated: new Date().toISOString(), status: "active",
  }).eq("id", vehicle.id);

  // Proximity to the assigned job's cached site coords.
  if (vehicle.assigned_job) {
    const { data: job } = await admin
      .from("jobs").select("id, title, site_lat, site_lng").eq("id", vehicle.assigned_job)
      .maybeSingle<{ id: string; title: string | null; site_lat: number | null; site_lng: number | null }>();
    if (job?.site_lat != null && job?.site_lng != null) {
      const miles = milesBetween(lat, lng, job.site_lat, job.site_lng);
      if (miles <= 3) {
        const todayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
        const { data: dupe } = await admin
          .from("alerts").select("id").eq("job_id", job.id).eq("alert_type", "message")
          .ilike("title", "%approaching%").gte("created_date", todayStart).maybeSingle<{ id: string }>();
        if (!dupe) {
          await admin.from("alerts").insert({
            alert_type: "message",
            title: `🚚 ${name} approaching site`,
            message: `${name} is about ${miles.toFixed(1)} mi from ${job.title ?? "the job"}.`,
            job_id: job.id,
            status: "active",
          });
        }
      }
    }
  }
  return { ok: true };
}

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