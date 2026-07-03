"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerInsertSchema, customerUpdateSchema } from "@/lib/schemas/customers";

export async function createCustomer(values: unknown): Promise<{ error: string } | void> {
  const parsed = customerInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("customers").insert({
    ...parsed.data,
    created_by_id: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = customerUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/customers");
  redirect("/customers");
}