"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// §8 — persist an integration's connection state + notes to integration_connections.
// (The app reads live keys from env vars; this records account state/notes so the
//  table is the source of truth for what's connected.)
export async function saveIntegrationConnection(input: {
  key: string;
  name: string;
  isConnected: boolean;
  notes?: string;
}): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || me.role !== "admin") return { error: "Admin only" };

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("integration_connections").select("id").eq("integration_key", input.key).maybeSingle<{ id: string }>();

  const payload = {
    integration_name: input.name,
    category: "Communications" as const, // enum placeholder; state lives in is_connected
    is_connected: input.isConnected,
    credentials: { notes: input.notes ?? "" },
    connected_date: input.isConnected ? now : null,
    disconnected_date: input.isConnected ? null : now,
  };

  const { error } = existing
    ? await supabase.from("integration_connections").update(payload).eq("id", existing.id)
    : await supabase.from("integration_connections").insert({ integration_key: input.key, created_by_id: user.id, ...payload });
  if (error) return { error: error.message };

  revalidatePath("/settings/integrations");
  return { ok: true };
}
