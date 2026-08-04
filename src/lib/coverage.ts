// Contractor coverage matching (Base44 §1). Decides whether a contractor covers
// a job's postcode, by radius / postcode-district / national mode.

const POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s?\d[A-Z]{2}\b/i;

export type CoverageContractor = {
  id: string;
  coverage_mode: "radius" | "postcodes" | "national" | null;
  base_postcode: string | null;
  coverage_radius_miles: number | null;
  coverage_postcodes: string[] | null;
};

export type CoverageResult = { covers: boolean; distanceMiles: number | null; mode: string };

// Outward code, e.g. "LS1 4DY" -> "LS1"; letters-only district -> "LS".
export function outwardCode(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  const m = postcode.toUpperCase().match(POSTCODE_RE);
  return m ? m[1].toUpperCase() : null;
}
function districtLetters(outward: string): string {
  const m = outward.match(/^([A-Z]{1,2})/);
  return m ? m[1] : outward;
}

const cache = new Map<string, { lat: number; lng: number } | null>();
async function geocode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const key = postcode.replace(/\s+/g, "").toUpperCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) { cache.set(key, null); return null; }
    const j = (await res.json()) as { result?: { latitude: number; longitude: number } };
    const ll = j.result ? { lat: j.result.latitude, lng: j.result.longitude } : null;
    cache.set(key, ll);
    return ll;
  } catch {
    cache.set(key, null);
    return null;
  }
}
function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function checkCoverage(
  contractor: CoverageContractor,
  jobPostcode: string | null | undefined,
): Promise<CoverageResult> {
  const mode = contractor.coverage_mode ?? "national";
  if (mode === "national") return { covers: true, distanceMiles: null, mode };

  const jobOut = outwardCode(jobPostcode);
  if (!jobOut) return { covers: false, distanceMiles: null, mode }; // graceful

  if (mode === "postcodes") {
    const list = (contractor.coverage_postcodes ?? []).map((p) => p.toUpperCase().trim());
    const covers = list.some((p) => {
      const po = outwardCode(p) ?? p;
      return po === jobOut || districtLetters(po) === districtLetters(jobOut) || jobOut.startsWith(po);
    });
    return { covers, distanceMiles: null, mode };
  }

  // radius
  if (!contractor.base_postcode || !contractor.coverage_radius_miles) {
    return { covers: false, distanceMiles: null, mode };
  }
  const [base, job] = await Promise.all([geocode(contractor.base_postcode), geocode(jobPostcode!)]);
  if (!base || !job) return { covers: false, distanceMiles: null, mode };
  const miles = haversineMiles(base, job);
  return { covers: miles <= contractor.coverage_radius_miles, distanceMiles: Math.round(miles), mode };
}

// Filter a list of contractors to those covering the job postcode.
export async function getCoveringContractors<T extends CoverageContractor>(
  contractors: T[],
  jobPostcode: string | null | undefined,
): Promise<{ contractor: T; distanceMiles: number | null }[]> {
  const out: { contractor: T; distanceMiles: number | null }[] = [];
  for (const c of contractors) {
    const r = await checkCoverage(c, jobPostcode);
    if (r.covers) out.push({ contractor: c, distanceMiles: r.distanceMiles });
  }
  out.sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999));
  return out;
}
