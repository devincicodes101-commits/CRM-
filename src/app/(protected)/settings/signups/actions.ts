"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// §13 — admin decides on an operative signup request.
export async function decideSignupRequest(
  id: string,
  decision: "approved" | "rejected",
  reason?: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || me.role !== "admin") return { error: "Admin only" };

  const { data: req } = await supabase
    .from("signup_requests")
    .select("operative_name, email")
    .eq("id", id)
    .single<{ operative_name: string; email: string }>();
  if (!req) return { error: "Request not found" };

  const { error } = await supabase
    .from("signup_requests")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? (reason ?? null) : null,
      approved_by: decision === "approved" ? user.id : null,
      approved_date: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // On approval, queue an invite so the office can send it from Team & Invites.
  if (decision === "approved") {
    const { data: dupe } = await supabase
      .from("invited_users").select("id").eq("email", req.email).maybeSingle<{ id: string }>();
    if (!dupe) {
      await supabase.from("invited_users").insert({
        name: req.operative_name, email: req.email, department: "field", role: "operative", status: "pending",
      });
    }
  }

  revalidatePath("/settings/signups");
  return { ok: true };
}
