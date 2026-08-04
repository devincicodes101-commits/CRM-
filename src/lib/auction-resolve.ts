import type { SupabaseClient } from "@supabase/supabase-js";
import { AUCTION } from "@/lib/auction";
import { assignContractorToJob } from "@/lib/contractor-jobs";
import { getBranding, auctionResultHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

// §3 — resolve a live auction whose countdown has ended. Idempotent + guarded
// against double-resolution (only acts on rows still in the LIVE state). Shared
// by the resolveAuction server action and the Vercel Cron sweep, so it takes any
// Supabase client (the cron passes a service-role client).

type BidRow = {
  contractor_id: string;
  contractor_user_id: string | null;
  contractor_name: string | null;
  contractor_email: string | null;
  bid_amount: number | null;
};

export async function resolveOneAuction(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ resolved: boolean; outcome?: "won" | "no_bids" }> {
  // Guard: flip LIVE -> a sentinel only if still live AND expired, atomically,
  // so two concurrent resolvers can't both win the row.
  const { data: claimed } = await supabase
    .from("jobs")
    .update({ auction_status: AUCTION.CLOSED })
    .eq("id", jobId)
    .eq("auction_status", AUCTION.LIVE)
    .lte("auction_ends_at", new Date().toISOString())
    .select("id, title, total_value")
    .maybeSingle<{ id: string; title: string | null; total_value: number | null }>();

  if (!claimed) return { resolved: false }; // someone else resolved it, or not expired

  const branding = await getBranding(supabase);

  // Highest auction bid wins.
  const { data: bids } = await supabase
    .from("contractor_bids")
    .select("contractor_id, contractor_user_id, contractor_name, contractor_email, bid_amount")
    .eq("job_id", jobId)
    .eq("is_auction_bid", true)
    .not("bid_amount", "is", null)
    .order("bid_amount", { ascending: false });

  const ranked = (bids ?? []) as BidRow[];
  const winner = ranked[0];

  if (!winner) {
    await supabase.from("jobs").update({ auction_status: AUCTION.NO_BIDS }).eq("id", jobId);
    return { resolved: true, outcome: "no_bids" };
  }

  // Assign the winner (stamps pay split from the winning bid + sends §7 email).
  await assignContractorToJob(supabase, {
    jobId,
    contractorId: winner.contractor_id,
    payAmount: winner.bid_amount ?? undefined,
  });
  await supabase
    .from("jobs")
    .update({
      auction_status: AUCTION.WON,
      auction_winning_bid: winner.bid_amount,
      auction_winning_bidder_id: winner.contractor_user_id,
      auction_current_bid: winner.bid_amount,
    })
    .eq("id", jobId);

  // Notify winner + losers.
  const jobLink = `${branding.appBaseUrl}/field?highlightJob=${jobId}`;
  for (const b of ranked) {
    if (!b.contractor_email) continue;
    const won = b.contractor_id === winner.contractor_id;
    await sendEmail({
      to: b.contractor_email,
      subject: won ? `You won the auction — ${claimed.title ?? "Job"}` : `Auction closed — ${claimed.title ?? "Job"}`,
      html: auctionResultHtml(
        {
          contractorName: b.contractor_name || "there",
          jobTitle: claimed.title ?? "Job",
          won,
          winningBid: winner.bid_amount,
          jobLink,
        },
        branding,
      ),
      from: branding.from,
    });
  }

  return { resolved: true, outcome: "won" };
}

// Sweep every expired-but-still-live auction (Vercel Cron entry point).
export async function resolveExpiredAuctions(
  supabase: SupabaseClient,
): Promise<{ ok: true; resolved: number }> {
  const { data: expired } = await supabase
    .from("jobs")
    .select("id")
    .eq("auction_status", AUCTION.LIVE)
    .lte("auction_ends_at", new Date().toISOString());

  let resolved = 0;
  for (const j of (expired ?? []) as { id: string }[]) {
    const r = await resolveOneAuction(supabase, j.id);
    if (r.resolved) resolved++;
  }
  return { ok: true, resolved };
}
