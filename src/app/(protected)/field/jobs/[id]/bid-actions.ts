"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AUCTION } from "@/lib/auction";
import { resolveOneAuction } from "@/lib/auction-resolve";

// §3/§5 — contractor-side bidding + invite responses (field app).

async function currentContractor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("contractors")
    .select("id, contact_name, company_name, email")
    .eq("user_id", userId)
    .maybeSingle<{ id: string; contact_name: string | null; company_name: string | null; email: string | null }>();
  return data;
}

/**
 * §3 — place an auction bid. Must beat the current bid; only while live & open.
 * The jobs row is updated with a service client because the bidder isn't the
 * assigned contractor yet, so RLS would block a direct update.
 */
export async function placeAuctionBid(
  jobId: string,
  amount: number,
): Promise<{ error: string } | { ok: true; currentBid: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const contractor = await currentContractor(supabase, user.id);
  if (!contractor) return { error: "Only contractors can bid" };
  if (!(amount > 0)) return { error: "Enter a valid bid amount" };

  const admin = await createServiceClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id, auction_status, auction_current_bid, auction_ends_at")
    .eq("id", jobId)
    .single<{ id: string; auction_status: string | null; auction_current_bid: number | null; auction_ends_at: string | null }>();
  if (!job) return { error: "Job not found" };
  if (job.auction_status !== AUCTION.LIVE) return { error: "This auction is not open" };
  if (job.auction_ends_at && new Date(job.auction_ends_at).getTime() <= Date.now()) {
    // Countdown elapsed — resolve now rather than accept a late bid.
    await resolveOneAuction(admin, jobId);
    return { error: "This auction has just closed" };
  }
  const current = job.auction_current_bid ?? 0;
  if (amount <= current) return { error: `Bid must be higher than £${current.toFixed(2)}` };

  // Guarded, concurrency-safe raise: only wins if still the highest.
  const { data: raised } = await admin
    .from("jobs")
    .update({ auction_current_bid: amount, auction_winning_bidder_id: user.id })
    .eq("id", jobId)
    .eq("auction_status", AUCTION.LIVE)
    .lt("auction_current_bid", amount)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (!raised) return { error: "Someone placed a higher bid — try again" };

  const { error: bidErr } = await admin
    .from("contractor_bids")
    .upsert(
      {
        job_id: jobId,
        contractor_id: contractor.id,
        contractor_user_id: user.id,
        contractor_name: contractor.company_name || contractor.contact_name,
        contractor_email: contractor.email,
        bid_amount: amount,
        is_auction_bid: true,
        bid_time: new Date().toISOString(),
        status: "interested",
        responded_date: new Date().toISOString(),
      },
      { onConflict: "job_id,contractor_id" },
    );
  if (bidErr) return { error: bidErr.message };

  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true, currentBid: amount };
}

/**
 * §4 — respond to a (non-auction) bid invite: register interest or decline,
 * optionally with a note and a proposed price.
 */
export async function respondToInvite(
  jobId: string,
  status: "interested" | "declined",
  note?: string,
  proposedPrice?: number | null,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("contractor_bids")
    .update({
      status,
      note: note?.trim() || null,
      proposed_price: proposedPrice ?? null,
      responded_date: new Date().toISOString(),
    })
    .eq("job_id", jobId)
    .eq("contractor_user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/field/jobs/${jobId}`);
  return { ok: true };
}
