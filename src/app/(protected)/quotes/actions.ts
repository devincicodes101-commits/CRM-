"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quoteInsertSchema, quoteUpdateSchema } from "@/lib/schemas/quotes";

export async function createQuote(values: unknown): Promise<{ error: string } | void> {
  const parsed = quoteInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("quotes")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  redirect(`/quotes/${data.id}`);
}

export async function updateQuote(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = quoteUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function sendQuote(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "sent", sent_date: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function updateQuoteStatus(
  id: string,
  status: "draft" | "sent" | "accepted" | "declined" | "expired"
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuote(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/quotes");
  redirect("/quotes");
}