"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

// Public quote response. The random public_token is the authorization —
// no session exists here — so these run through the service-role client
// (RLS is not available to anon users) and are keyed strictly on the token.
// A status guard ensures a token can only act on a quote that is still "sent"
// and not expired, so accepted/declined quotes can't be flipped again.

async function respondToQuote(
  token: string,
  status: "accepted" | "declined"
): Promise<{ error: string } | void> {
  if (!token) return { error: "Invalid link" };

  const supabase = await createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, valid_until")
    .eq("public_token", token)
    .single<{ id: string; status: string; valid_until: string | null }>();

  if (!quote) return { error: "Quote not found" };
  if (quote.status !== "sent") {
    return { error: "This quote is no longer awaiting a response." };
  }
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return { error: "This quote has expired." };
  }

  const { error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", quote.id);
  if (error) return { error: error.message };

  revalidatePath(`/quote/${token}`);
}

export async function acceptQuotePublic(token: string) {
  return respondToQuote(token, "accepted");
}

export async function declineQuotePublic(token: string) {
  return respondToQuote(token, "declined");
}
