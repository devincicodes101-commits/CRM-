// Geo-scheduling for the public quote booking flow.
// Ports Base44's CustomerBookingPanel loadSuggestions logic:
//  - 21 days ahead from tomorrow, weekends (non-working-days) skipped
//  - if the customer's postcode geocodes, rank days by nearest existing job
//    (haversine miles), breaking ties within 3 miles by fewest jobs that day
//  - otherwise rank purely by fewest jobs that day
//  - return the top 6 suggestions

const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;
const EARTH_RADIUS_MILES = 3958.8;
const DAYS_AHEAD = 21;
const SUGGESTION_COUNT = 6;
const TIE_BREAK_MILES = 3;

export type BookingJob = {
  id: string;
  start_date: string | null;
  address: string | null;
  assigned_team?: string | null;
};

export type DateSuggestion = {
  dateStr: string; // yyyy-MM-dd
  label: string; // e.g. "Monday 27 July"
  jobCount: number;
  nearbyMiles: number | null;
  availability: "wide_open" | "available" | "busy";
};

type LatLng = { lat: number; lng: number };

export function extractPostcode(address: string | null | undefined): string | null {
  if (!address) return null;
  const m = address.match(UK_POSTCODE_RE);
  return m ? m[1].toUpperCase().replace(/\s+/g, " ").trim() : null;
}

// postcodes.io — free, no key. Cached per-postcode within a single call batch.
async function geocode(
  postcode: string,
  cache: Map<string, LatLng | null>,
): Promise<LatLng | null> {
  const key = postcode.replace(/\s+/g, "").toUpperCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`, {
      // Availability data changes slowly; a short cache keeps this snappy.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const json = (await res.json()) as { result?: { latitude: number; longitude: number } };
    const ll = json.result
      ? { lat: json.result.latitude, lng: json.result.longitude }
      : null;
    cache.set(key, ll);
    return ll;
  } catch {
    cache.set(key, null);
    return null;
  }
}

function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function labelFor(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function availabilityFor(jobCount: number): DateSuggestion["availability"] {
  if (jobCount === 0) return "wide_open";
  if (jobCount <= 2) return "available";
  return "busy";
}

// jobs.start_date may be a full ISO datetime; compare on the date part only.
function jobDatePart(startDate: string | null): string | null {
  if (!startDate) return null;
  return startDate.slice(0, 10);
}

export async function generateDateSuggestions(
  customerAddress: string | null | undefined,
  jobs: BookingJob[],
  workingDays: number[] = [1, 2, 3, 4, 5],
): Promise<DateSuggestion[]> {
  // Candidate days: tomorrow .. +21, working days only.
  const candidates: { date: Date; dateStr: string }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (!workingDays.includes(d.getDay())) continue;
    candidates.push({ date: d, dateStr: toDateStr(d) });
  }

  const jobsByDate = new Map<string, BookingJob[]>();
  for (const j of jobs) {
    const dp = jobDatePart(j.start_date);
    if (!dp) continue;
    const arr = jobsByDate.get(dp) ?? [];
    arr.push(j);
    jobsByDate.set(dp, arr);
  }

  const cache = new Map<string, LatLng | null>();
  const customerPostcode = extractPostcode(customerAddress);
  const customerLoc = customerPostcode ? await geocode(customerPostcode, cache) : null;

  type Ranked = DateSuggestion & { _miles: number };
  const ranked: Ranked[] = [];

  for (const c of candidates) {
    const dayJobs = jobsByDate.get(c.dateStr) ?? [];
    const jobCount = dayJobs.length;

    let nearbyMiles: number | null = null;
    if (customerLoc) {
      for (const j of dayJobs) {
        const pc = extractPostcode(j.address);
        if (!pc) continue;
        const loc = await geocode(pc, cache);
        if (!loc) continue;
        const miles = haversineMiles(customerLoc, loc);
        if (nearbyMiles === null || miles < nearbyMiles) nearbyMiles = miles;
      }
    }

    ranked.push({
      dateStr: c.dateStr,
      label: labelFor(c.date),
      jobCount,
      nearbyMiles: nearbyMiles === null ? null : Math.round(nearbyMiles),
      availability: availabilityFor(jobCount),
      _miles: nearbyMiles === null ? 999 : nearbyMiles,
    });
  }

  ranked.sort((a, b) => {
    if (customerLoc) {
      // Nearest first, but treat anything within 3 miles as a tie and prefer the quieter day.
      if (Math.abs(a._miles - b._miles) <= TIE_BREAK_MILES) {
        if (a.jobCount !== b.jobCount) return a.jobCount - b.jobCount;
      }
      if (a._miles !== b._miles) return a._miles - b._miles;
    }
    return a.jobCount - b.jobCount;
  });

  return ranked.slice(0, SUGGESTION_COUNT).map(({ _miles, ...s }) => {
    void _miles;
    return s;
  });
}
