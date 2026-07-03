"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceInsertSchema, serviceUpdateSchema } from "@/lib/schemas/services";

export async function createService(values: unknown): Promise<{ error: string } | void> {
  const parsed = serviceInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("services")
    .insert({ ...parsed.data, created_by_id: user.id });
  if (error) return { error: error.message };

  revalidatePath("/services");
  redirect("/services");
}

export async function updateService(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = serviceUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("services").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/services");
  redirect("/services");
}

export async function toggleServiceActive(id: string, is_active: boolean): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/services");
}

export async function deleteService(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/services");
  redirect("/services");
}