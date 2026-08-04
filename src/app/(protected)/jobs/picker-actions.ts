"use server";

import { createClient } from "@/lib/supabase/server";
import { checkCoverage, outwardCode, type CoverageContractor } from "@/lib/coverage";

// §6 — ContractorSmartPicker data. Computes, per contractor, the signals staff
// need when choosing who to assign / invite: coverage + distance, ★ rating,
// availability on the job date, insurance validity, and completion rate.

export type ContractorCard = {
  id: string;
  name: string;
  covers: boolean;
  distanceMiles: number | null;
  rating: number | null; // avg stars, null = not rated yet
  ratingCount: number;
  completionPct: number | null; // completed / assigned, null = no jobs yet
  assignedCount: number;
  availableOnDate: boolean;
  insuranceValid: boolean;
  insuranceIssues: string[]; // names of expired/soon docs
  licenceType: string | null;
};

type ContractorRow = CoverageContractor & {
  contact_name: string | null;
  company_name: string | null;
  licence_type: string | null;
  suspended: boolean | null;
  public_liability_expiry: string | null;
  employer_liability_expiry: string | null;
  insurance_expiry: string | null;
  waste_carrier_expiry: string | null;
  asbestos_licence_expiry: string | null;
};

const INSURANCE_FIELDS: [keyof ContractorRow, string][] = [
  ["public_liability_expiry", "Public liability"],
  ["employer_liability_expiry", "Employer liability"],
  ["insurance_expiry", "Insurance"],
  ["waste_carrier_expiry", "Waste carrier licence"],
  ["asbestos_licence_expiry", "Asbestos licence"],
];

function sameDay(a: string | null, b: string): boolean {
  if (!a) return false;
  return a.slice(0, 10) === b.slice(0, 10);
}

export async function getContractorPickerData(
  jobPostcode: string | null,
  jobDateISO: string | null,
): Promise<ContractorCard[]> {
  const supabase = await createClient();

  const [{ data: contractors }, { data: jobs }, { data: reviews }] = await Promise.all([
    supabase
      .from("contractors")
      .select(
        "id, contact_name, company_name, licence_type, suspended, coverage_mode, base_postcode, coverage_radius_miles, coverage_postcodes, public_liability_expiry, employer_liability_expiry, insurance_expiry, waste_carrier_expiry, asbestos_licence_expiry",
      )
      .or("suspended.is.null,suspended.eq.false")
      .returns<ContractorRow[]>(),
    supabase
      .from("jobs")
      .select("assigned_contractor_id, status, start_date")
      .not("assigned_contractor_id", "is", null)
      .returns<{ assigned_contractor_id: string; status: string; start_date: string | null }[]>(),
    supabase
      .from("reviews")
      .select("star_rating, jobs!inner(assigned_contractor_id)")
      .returns<{ star_rating: number; jobs: { assigned_contractor_id: string | null } | null }[]>(),
  ]);

  const jobsByContractor = new Map<string, { status: string; start_date: string | null }[]>();
  for (const j of jobs ?? []) {
    const arr = jobsByContractor.get(j.assigned_contractor_id) ?? [];
    arr.push({ status: j.status, start_date: j.start_date });
    jobsByContractor.set(j.assigned_contractor_id, arr);
  }

  const ratingByContractor = new Map<string, { sum: number; count: number }>();
  for (const r of reviews ?? []) {
    const cid = r.jobs?.assigned_contractor_id;
    if (!cid) continue;
    const cur = ratingByContractor.get(cid) ?? { sum: 0, count: 0 };
    cur.sum += r.star_rating;
    cur.count += 1;
    ratingByContractor.set(cid, cur);
  }

  const jobOut = outwardCode(jobPostcode);
  const nowSlice = new Date().toISOString().slice(0, 10);

  const cards: ContractorCard[] = [];
  for (const c of contractors ?? []) {
    const cov = await checkCoverage(c, jobOut);

    const myJobs = jobsByContractor.get(c.id) ?? [];
    const assignedCount = myJobs.length;
    const completed = myJobs.filter((j) => j.status === "completed").length;
    const completionPct = assignedCount > 0 ? Math.round((completed / assignedCount) * 100) : null;
    const availableOnDate = jobDateISO
      ? !myJobs.some(
          (j) => j.status !== "cancelled" && sameDay(j.start_date, jobDateISO),
        )
      : true;

    const rt = ratingByContractor.get(c.id);
    const rating = rt && rt.count > 0 ? Math.round((rt.sum / rt.count) * 10) / 10 : null;

    const insuranceIssues: string[] = [];
    for (const [field, label] of INSURANCE_FIELDS) {
      const val = c[field] as string | null;
      if (val && val.slice(0, 10) < nowSlice) insuranceIssues.push(label);
    }

    cards.push({
      id: c.id,
      name: c.company_name || c.contact_name || "Contractor",
      covers: cov.covers,
      distanceMiles: cov.distanceMiles,
      rating,
      ratingCount: rt?.count ?? 0,
      completionPct,
      assignedCount,
      availableOnDate,
      insuranceValid: insuranceIssues.length === 0,
      insuranceIssues,
      licenceType: c.licence_type,
    });
  }

  // Best-first: insurance-valid → available → covers → nearest → highest completion.
  cards.sort((a, b) => {
    if (a.insuranceValid !== b.insuranceValid) return a.insuranceValid ? -1 : 1;
    if (a.availableOnDate !== b.availableOnDate) return a.availableOnDate ? -1 : 1;
    if (a.covers !== b.covers) return a.covers ? -1 : 1;
    const da = a.distanceMiles ?? 9999;
    const db = b.distanceMiles ?? 9999;
    if (da !== db) return da - db;
    return (b.completionPct ?? 0) - (a.completionPct ?? 0);
  });

  return cards;
}
