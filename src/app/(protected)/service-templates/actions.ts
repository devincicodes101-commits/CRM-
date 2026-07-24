"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceTemplateInsertSchema } from "@/lib/schemas/service-templates";

export async function createServiceTemplate(values: unknown): Promise<{ error: string } | { ok: true }> {
  const parsed = serviceTemplateInsertSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0] ? `${parsed.error.issues[0].path.join(".") || "form"}: ${parsed.error.issues[0].message}` : "Invalid form data" };
  if (parsed.data.items.length === 0) return { error: "Add at least one service" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("service_templates")
    .insert({ ...parsed.data, created_by_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/service-templates");
  return { ok: true };
}

export async function deleteServiceTemplate(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("service_templates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/service-templates");
}
