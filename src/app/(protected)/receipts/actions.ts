"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// §12 — office approves/rejects a field expense receipt.
export async function decideReceipt(
  id: string,
  decision: "approved" | "rejected",
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || !["admin", "user"].includes(me.role)) return { error: "Office only" };

  const { error } = await supabase.from("receipts").update({ status: decision }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/receipts");
  return { ok: true };
}
