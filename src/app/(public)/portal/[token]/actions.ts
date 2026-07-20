"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

// Public review submission from the customer portal. The portal_token is the
// authorization, so this runs through the service client keyed on that token.
export async function submitPortalReview(
  token: string,
  data: { star_rating: number; review_text: string }
): Promise<{ ok: true } | { error: string }> {
  if (!token) return { error: "Invalid link" };
  const rating = Number(data.star_rating);
  if (!rating || rating < 1 || rating > 5) return { error: "Please pick a star rating" };

  const supabase = await createServiceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("name, email")
    .eq("portal_token", token)
    .single<{ name: string; email: string | null }>();
  if (!customer) return { error: "Portal not found" };

  const { error } = await supabase.from("reviews").insert({
    customer_name: customer.name,
    customer_email: customer.email,
    star_rating: rating,
    review_text: data.review_text?.trim() || null,
    source: "portal",
    is_published: true,
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/${token}`);
  return { ok: true };
}
