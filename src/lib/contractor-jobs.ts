import type { SupabaseClient } from "@supabase/supabase-js";
import { getBranding, contractorAssignmentHtml, bidInviteHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { getCoveringContractors, outwardCode, type CoverageContractor } from "@/lib/coverage";

// Shared logic for §2/§7: assigning a contractor to a job and notifying them.
// Kept out of the "use server" action files so both server actions and the
// auction resolver (service-role) can reuse it.

type JobRow = {
  id: string;
  title: string | null;
  start_date: string | null;
  address: string | null;
  total_value: number | null;
  message_token: string | null;
  assigned_contractor_user_id: string | null;
};

function longDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// The field-app deep link that opens straight to a job (guarded ?highlightJob).
function fieldJobLink(appBaseUrl: string, jobId: string): string {
  return `${appBaseUrl}/field?highlightJob=${jobId}`;
}

/**
 * §7 — email the contractor that a job is now theirs. Fires ONLY when the
 * assigned contractor's login user actually changed (caller passes the previous
 * value). Never throws — assignment must succeed even if email is down.
 */
export async function notifyContractorAssignment(
  supabase: SupabaseClient,
  jobId: string,
  previousContractorUserId: string | null,
): Promise<void> {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select(
        "id, title, start_date, address, total_value, assigned_contractor_id, assigned_contractor_user_id, contractor_pay_percent, contractor_pay_amount, company_share_amount",
      )
      .eq("id", jobId)
      .single<
        JobRow & {
          assigned_contractor_id: string | null;
          contractor_pay_percent: number | null;
          contractor_pay_amount: number | null;
          company_share_amount: number | null;
        }
      >();
    if (!job || !job.assigned_contractor_id) return;
    // Only notify on an actual change of contractor.
    if (job.assigned_contractor_user_id === previousContractorUserId) return;

    const { data: contractor } = await supabase
      .from("contractors")
      .select("contact_name, company_name, email")
      .eq("id", job.assigned_contractor_id)
      .single<{ contact_name: string | null; company_name: string | null; email: string | null }>();
    if (!contractor?.email) return;

    const branding = await getBranding(supabase);
    const html = contractorAssignmentHtml(
      {
        contractorName: contractor.company_name || contractor.contact_name || "there",
        jobTitle: job.title ?? "Job",
        jobDateLong: longDate(job.start_date),
        customerArea: outwardCode(job.address),
        jobValue: job.total_value ?? 0,
        payPercent: job.contractor_pay_percent,
        payAmount: job.contractor_pay_amount,
        companyShare: job.company_share_amount,
        jobLink: fieldJobLink(branding.appBaseUrl, job.id),
      },
      branding,
    );
    await sendEmail({
      to: contractor.email,
      subject: `New job assigned — ${job.title ?? "Job"}`,
      html,
      from: branding.from,
    });
  } catch (e) {
    console.error("[notifyContractorAssignment] failed", e);
  }
}

type InviteContractorRow = CoverageContractor & {
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  user_id: string | null;
  licence_type: string | null;
  suspended: boolean | null;
};

const INVITE_CONTRACTOR_COLS =
  "id, contact_name, company_name, email, user_id, coverage_mode, base_postcode, coverage_radius_miles, coverage_postcodes, licence_type, suspended";

/**
 * §4 — AUTOMATIC covering-contractor invite, session-free so it can run from the
 * public online-booking flow (service-role, no user). Mirrors the automatic
 * branch of the inviteContractorsForJob server action: matches all non-suspended
 * contractors covering the job postcode (licence-filtered for licenced jobs),
 * upserts bid invites deduped on (job_id, contractor_id), and emails only the
 * newly-invited ones. Never throws.
 */
export async function inviteCoveringContractors(
  supabase: SupabaseClient,
  jobId: string,
  createdById: string | null = null,
): Promise<{ invited: number }> {
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, address, start_date, total_value, requires_licence")
      .eq("id", jobId)
      .single<{
        id: string;
        title: string | null;
        address: string | null;
        start_date: string | null;
        total_value: number | null;
        requires_licence: boolean | null;
      }>();
    if (!job) return { invited: 0 };

    const { data: contractors } = await supabase
      .from("contractors")
      .select(INVITE_CONTRACTOR_COLS)
      .or("suspended.is.null,suspended.eq.false")
      .returns<InviteContractorRow[]>();
    let pool = contractors ?? [];
    if (job.requires_licence) pool = pool.filter((c) => c.licence_type === "licenced");

    const covering = await getCoveringContractors(pool, outwardCode(job.address));
    const targets = covering.map((c) => c.contractor);
    if (targets.length === 0) return { invited: 0 };

    const rows = targets.map((c) => ({
      job_id: jobId,
      contractor_id: c.id,
      contractor_user_id: c.user_id,
      contractor_name: c.company_name || c.contact_name,
      contractor_email: c.email,
      status: "invited" as const,
      created_by_id: createdById,
    }));

    const { data: inserted } = await supabase
      .from("contractor_bids")
      .upsert(rows, { onConflict: "job_id,contractor_id", ignoreDuplicates: true })
      .select("contractor_name, contractor_email");

    const branding = await getBranding(supabase);
    const area = outwardCode(job.address);
    const bidLink = fieldJobLink(branding.appBaseUrl, jobId);
    for (const row of inserted ?? []) {
      if (!row.contractor_email) continue;
      await sendEmail({
        to: row.contractor_email,
        subject: `You're invited to a job — ${job.title ?? "Job"}`,
        html: bidInviteHtml(
          {
            contractorName: row.contractor_name || "there",
            jobTitle: job.title ?? "Job",
            jobDateLong: longDate(job.start_date),
            customerArea: area,
            jobValue: job.total_value ?? 0,
            bidLink,
          },
          branding,
        ),
        from: branding.from,
      });
    }
    return { invited: (inserted ?? []).length };
  } catch (e) {
    console.error("[inviteCoveringContractors] failed", e);
    return { invited: 0 };
  }
}

/**
 * §2 — assign a contractor to a job (direct, from a bid, or as auction winner).
 * Stamps assigned_contractor_id + _user_id, contractor_acceptance='pending',
 * and the pay split, then fires the §7 email if the contractor changed.
 */
export async function assignContractorToJob(
  supabase: SupabaseClient,
  opts: {
    jobId: string;
    contractorId: string;
    payPercent?: number | null;
    payAmount?: number | null; // explicit amount (auction winning bid)
  },
): Promise<{ error: string } | { ok: true }> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id, total_value, assigned_contractor_user_id")
    .eq("id", opts.jobId)
    .single<{ id: string; total_value: number | null; assigned_contractor_user_id: string | null }>();
  if (!job) return { error: "Job not found" };

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, user_id")
    .eq("id", opts.contractorId)
    .single<{ id: string; user_id: string | null }>();
  if (!contractor) return { error: "Contractor not found" };

  const total = job.total_value ?? 0;
  let payAmount = opts.payAmount ?? null;
  if (payAmount == null && opts.payPercent != null) {
    payAmount = Math.round(((total * opts.payPercent) / 100) * 100) / 100;
  }
  const companyShare = payAmount != null ? Math.round((total - payAmount) * 100) / 100 : null;

  const prevUserId = job.assigned_contractor_user_id;
  const { error } = await supabase
    .from("jobs")
    .update({
      assigned_contractor_id: contractor.id,
      assigned_contractor_user_id: contractor.user_id,
      assigned_team: null, // operative & contractor are mutually exclusive
      contractor_acceptance: "pending",
      contractor_pay_percent: opts.payPercent ?? null,
      contractor_pay_amount: payAmount,
      company_share_amount: companyShare,
    })
    .eq("id", opts.jobId);
  if (error) return { error: error.message };

  await notifyContractorAssignment(supabase, opts.jobId, prevUserId);
  return { ok: true };
}
