"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not authenticated" as const };
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single<{ role: string }>();
  if (!me || me.role !== "admin") return { supabase, error: "Admin only" as const };
  return { supabase, user };
}

// §14 — website domains + SEO metadata.
export async function createWebsiteDomain(input: {
  domain_name: string;
  domain_url: string;
  google_analytics_id?: string;
  seo_focus_keywords?: string; // comma-separated
  monthly_traffic_goal?: number | null;
  notes?: string;
}): Promise<{ error: string } | { ok: true }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!input.domain_name?.trim() || !input.domain_url?.trim()) return { error: "Domain name and URL are required" };

  const keywords = (input.seo_focus_keywords ?? "")
    .split(",").map((k) => k.trim()).filter(Boolean);

  const { error: insErr } = await supabase.from("website_domains").insert({
    domain_name: input.domain_name.trim(),
    domain_url: input.domain_url.trim(),
    google_analytics_id: input.google_analytics_id?.trim() || null,
    seo_focus_keywords: keywords,
    monthly_traffic_goal: input.monthly_traffic_goal ?? null,
    notes: input.notes?.trim() || null,
    status: "active",
  });
  if (insErr) return { error: insErr.message };
  revalidatePath("/website-domains");
  return { ok: true };
}

export async function deleteWebsiteDomain(id: string): Promise<{ error: string } | { ok: true }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  const { error: delErr } = await supabase.from("website_domains").delete().eq("id", id);
  if (delErr) return { error: delErr.message };
  revalidatePath("/website-domains");
  return { ok: true };
}
