"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { generateDateSuggestions, type BookingJob, type DateSuggestion } from "@/lib/booking";
import {
  getBranding,
  bookingConfirmationHtml,
  salesBookedNotifyHtml,
  photoInviteHtml,
} from "@/lib/email-templates";

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

// After the customer clicks Accept, offer geo-ranked available dates.
export async function getBookingSuggestions(
  token: string,
): Promise<{ suggestions: DateSuggestion[] } | { error: string }> {
  if (!token) return { error: "Invalid link" };
  const supabase = await createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, valid_until, customer_address")
    .eq("public_token", token)
    .single<{
      id: string;
      status: string;
      valid_until: string | null;
      customer_address: string | null;
    }>();

  if (!quote) return { error: "Quote not found" };
  if (quote.status !== "sent") return { error: "This quote is no longer awaiting a response." };
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return { error: "This quote has expired." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, start_date, address, assigned_team")
    .gte("start_date", today)
    .returns<BookingJob[]>();

  const branding = await getBranding(supabase);
  const suggestions = await generateDateSuggestions(
    quote.customer_address,
    jobs ?? [],
    branding.workingDays,
  );
  return { suggestions };
}

// Books the job from the accepted quote (Base44 publicBookJob):
// creates a scheduled Job, marks the quote accepted, and sends the three
// booking emails (customer confirmation w/ reschedule link, sales notice,
// site-photo invite).
export async function bookJobFromQuote(
  token: string,
  startDate: string,
): Promise<{ ok: true } | { error: string }> {
  if (!token) return { error: "Invalid link" };
  if (!startDate || new Date(startDate) < new Date(new Date().toISOString().slice(0, 10))) {
    return { error: "Please choose a valid future date." };
  }
  const supabase = await createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, status, valid_until, quote_number, customer_id, customer_name, customer_email, customer_address, items, total",
    )
    .eq("public_token", token)
    .single<{
      id: string;
      status: string;
      valid_until: string | null;
      quote_number: string;
      customer_id: string | null;
      customer_name: string | null;
      customer_email: string | null;
      customer_address: string | null;
      items: { service_name: string }[] | null;
      total: number | null;
    }>();

  if (!quote) return { error: "Quote not found" };
  if (quote.status !== "sent") return { error: "This quote is no longer awaiting a response." };
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    return { error: "This quote has expired." };
  }

  const firstService = quote.items?.[0]?.service_name || "Work";
  const jobTitle = `${firstService} — ${quote.customer_name ?? "Customer"}`;
  const description = (quote.items ?? []).map((i) => i.service_name).join(", ");

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      title: jobTitle,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email ?? "",
      customer_id: quote.customer_id,
      quote_id: quote.id,
      address: quote.customer_address ?? "",
      description,
      start_date: startDate,
      end_date: startDate,
      start_time: "08:00",
      end_time: "17:00",
      status: "scheduled",
      priority: "high",
      total_value: quote.total ?? 0,
      color: "#f97316",
      notes: `Self-scheduled by customer from quote ${quote.quote_number}`,
    })
    .select("id, message_token")
    .single<{ id: string; message_token: string }>();

  if (jobErr || !job) return { error: jobErr?.message ?? "Could not create the booking." };

  await supabase.from("quotes").update({ status: "accepted" }).eq("id", quote.id);

  // Emails — best-effort, never block the confirmation.
  try {
    const branding = await getBranding(supabase);
    const jobDateLong = new Date(startDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const emailData = {
      jobTitle,
      customerName: quote.customer_name,
      jobDateLong,
      jobAddress: quote.customer_address,
    };
    const rescheduleLink = `${branding.appBaseUrl}/reschedule/${job.message_token}`;
    const photoLink = `${branding.appBaseUrl}/job-messages/${job.message_token}`;

    if (quote.customer_email) {
      await sendEmail({
        to: quote.customer_email,
        from: branding.from,
        subject: `You're booked in — ${jobTitle} on ${jobDateLong}`,
        html: bookingConfirmationHtml(emailData, branding, rescheduleLink),
      });
      await sendEmail({
        to: quote.customer_email,
        from: branding.from,
        subject: `📸 Upload site photos for your job — ${jobTitle}`,
        html: photoInviteHtml(emailData, branding, photoLink),
      });
    }
    if (branding.email) {
      await sendEmail({
        to: branding.email,
        from: branding.from,
        subject: `✅ Quote Accepted & Job Booked — ${quote.quote_number}`,
        html: salesBookedNotifyHtml({ ...emailData, quoteNumber: quote.quote_number }, branding),
      });
    }
  } catch {
    // swallow — the booking itself succeeded
  }

  revalidatePath(`/quote/${token}`);
  return { ok: true };
}
