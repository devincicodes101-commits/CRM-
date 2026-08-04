import type { SupabaseClient } from "@supabase/supabase-js";
import { getBranding, contractorAssignmentHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { outwardCode } from "@/lib/coverage";

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
