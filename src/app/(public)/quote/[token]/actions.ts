"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function acceptQuotePublic(quoteNumber: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "accepted" })
    .eq("quote_number", quoteNumber);
  if (error) return { error: error.message };
  revalidatePath(`/quote/${quoteNumber}`);
}

export async function declineQuotePublic(quoteNumber: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status: "declined" })
    .eq("quote_number", quoteNumber);
  if (error) return { error: error.message };
  revalidatePath(`/quote/${quoteNumber}`);
}