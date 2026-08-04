"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCoveringContractors, outwardCode, type CoverageContractor } from "@/lib/coverage";
import { assignContractorToJob } from "@/lib/contractor-jobs";
import { resolveOneAuction } from "@/lib/auction-resolve";
import { AUCTION } from "@/lib/auction";
import {
  getBranding,
  auctionInviteHtml,
  bidInviteHtml,
} from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

type ContractorRow = CoverageContractor & {
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  user_id: string | null;
  licence_type: string | null;
  suspended: boolean | null;
};

const CONTRACTOR_COLS =
  "id, contact_name, company_name, email, user_id, coverage_mode, base_postcode, coverage_radius_miles, coverage_postcodes, licence_type, suspended";

function longDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * §4 — invite contractors to bid on a job.
 *  - no contractorIds  → AUTOMATIC: all contractors covering the job postcode.
 *  - with contractorIds → MANUAL: exactly those (coverage check skipped) but the
 *    licence filter still applies for jobs that require a licence.
 * Dedupes on (job_id, contractor_id); emails only newly-invited contractors.
 * When the job is a live auction, sends the "available to bid" email; otherwise
 * a generic bid invite.
 */
export async function inviteContractorsForJob(
  jobId: string,
  contractorIds?: string[],
): Promise<{ error: string } | { ok: true; invited: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, address, start_date, total_value, requires_licence, auction_status, auction_start_price, auction_ends_at",
    )
    .eq("id", jobId)
    .single<{
      id: string;
      title: string | null;
      address: string | null;
      start_date: string | null;
      total_value: number | null;
      requires_licence: boolean | null;
      auction_status: string | null;
      auction_start_price: number | null;
      auction_ends_at: string | null;
    }>();
  if (!job) return { error: "Job not found" };

  let query = supabase.from("contractors").select(CONTRACTOR_COLS).or("suspended.is.null,suspended.eq.false");
  if (contractorIds?.length) query = query.in("id", contractorIds);
  const { data: contractors } = await query.returns<ContractorRow[]>();
  let pool = contractors ?? [];

  // Licence filter always applies for licenced jobs.
  if (job.requires_licence) pool = pool.filter((c) => c.licence_type === "licenced");

  // Automatic mode → restrict to covering contractors; manual keeps the given list.
  let targets: ContractorRow[];
  if (contractorIds?.length) {
    targets = pool;
  } else {
    const covering = await getCoveringContractors(pool, outwardCode(job.address));
    targets = covering.map((c) => c.contractor);
  }
  if (targets.length === 0) return { ok: true, invited: 0 };

  const rows = targets.map((c) => ({
    job_id: jobId,
    contractor_id: c.id,
    contractor_user_id: c.user_id,
    contractor_name: c.company_name || c.contact_name,
    contractor_email: c.email,
    status: "invited" as const,
    created_by_id: user.id,
  }));

  // Dedupe: only rows that didn't already exist are returned → email just those.
  const { data: inserted, error } = await supabase
    .from("contractor_bids")
    .upsert(rows, { onConflict: "job_id,contractor_id", ignoreDuplicates: true })
    .select("contractor_id, contractor_name, contractor_email");
  if (error) return { error: error.message };

  const branding = await getBranding(supabase);
  const isAuction = job.auction_status === AUCTION.LIVE;
  const area = outwardCode(job.address);
  const bidLink = `${branding.appBaseUrl}/field?highlightJob=${jobId}`;

  for (const row of inserted ?? []) {
    if (!row.contractor_email) continue;
    const html = isAuction
      ? auctionInviteHtml(
          {
            contractorName: row.contractor_name || "there",
            jobTitle: job.title ?? "Job",
            jobDateLong: longDate(job.start_date),
            customerArea: area,
            startPrice: job.auction_start_price ?? 0,
            endsAtLong: longDate(job.auction_ends_at),
            bidLink,
          },
          branding,
        )
      : bidInviteHtml(
          {
            contractorName: row.contractor_name || "there",
            jobTitle: job.title ?? "Job",
            jobDateLong: longDate(job.start_date),
            customerArea: area,
            jobValue: job.total_value ?? 0,
            bidLink,
          },
          branding,
        );
    await sendEmail({
      to: row.contractor_email,
      subject: isAuction
        ? `Job auction open — ${job.title ?? "Job"}`
        : `You're invited to a job — ${job.title ?? "Job"}`,
      html,
      from: branding.from,
    });
  }

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true, invited: (inserted ?? []).length };
}

/**
 * §3 — open a live auction for a job, then auto-invite all covering contractors.
 */
export async function createAuction(
  jobId: string,
  startPrice: number,
  durationMins: number,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!(startPrice >= 0)) return { error: "Starting bid must be zero or more" };
  const mins = Math.max(1, Math.round(durationMins || 5));

  const endsAt = new Date(Date.now() + mins * 60_000).toISOString();
  const { error } = await supabase
    .from("jobs")
    .update({
      auction_status: AUCTION.LIVE,
      auction_start_price: startPrice,
      auction_current_bid: startPrice,
      auction_ends_at: endsAt,
      auction_winning_bid: null,
      auction_winning_bidder_id: null,
      // clear any prior direct assignment — the auction decides the contractor
      assigned_contractor_id: null,
      assigned_contractor_user_id: null,
      contractor_acceptance: null,
    })
    .eq("id", jobId);
  if (error) return { error: error.message };

  const inv = await inviteContractorsForJob(jobId);
  if ("error" in inv) return { error: inv.error };

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

/**
 * §3 — manually trigger resolution (also runs on-load / via cron). Idempotent.
 */
export async function resolveAuction(
  jobId: string,
): Promise<{ error: string } | { ok: true; resolved: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const r = await resolveOneAuction(supabase, jobId);
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true, resolved: r.resolved };
}

/**
 * §2/§4 — directly assign a contractor to a job (from the booking panel or the
 * "Assign" button on an interested bid). Marks the winning bid, closes the rest.
 */
export async function assignContractorFromBid(
  jobId: string,
  contractorId: string,
  payPercent?: number | null,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const res = await assignContractorToJob(supabase, { jobId, contractorId, payPercent });
  if ("error" in res) return res;

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}
