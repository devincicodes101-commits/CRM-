"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAlertStatus(
  alertId: string,
  status: "resolved" | "archived"
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const update: Record<string, unknown> = {
    status,
    resolved_by: user.id,
    resolved_date: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("alerts")
    .update(update)
    .eq("id", alertId);

  if (error) return { error: error.message };
  revalidatePath("/alerts");
}
