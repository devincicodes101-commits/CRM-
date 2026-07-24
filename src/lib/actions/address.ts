"use server";

// UK address lookup via getukaddress.com (the service the CRM key `gua_...` is for).
// Endpoint: GET https://getukaddress.com/api/v1/autocomplete?query={q}&api_key={key}
// Key lives in GETADDRESS_API_KEY (Vercel → Settings → Environment Variables).

export type AddressLookupResult =
  | { addresses: string[] }
  | { error: string };

type GukResult = {
  summaryLine?: string;
  organisation?: string;
  addressLine1?: string;
  addressLine2?: string;
  town?: string;
  postcode?: string;
};

export async function lookupAddresses(query: string): Promise<AddressLookupResult> {
  const key = process.env.GETADDRESS_API_KEY;
  if (!key) return { error: "Address lookup isn't configured (missing GETADDRESS_API_KEY)." };

  const q = query.trim();
  if (q.length < 3) return { error: "Enter at least 3 characters (a postcode or street)" };

  try {
    const res = await fetch(
      `https://getukaddress.com/api/v1/autocomplete?query=${encodeURIComponent(q)}&api_key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string; error?: string };
        detail = body.message || body.error || "";
      } catch {
        detail = (await res.text().catch(() => "")).slice(0, 120);
      }
      if (res.status === 401 || res.status === 403)
        return { error: `Key rejected (${res.status}): ${detail || "check the API key"}` };
      if (res.status === 429) return { error: "Lookup limit reached for now." };
      return { error: `Lookup failed (${res.status})${detail ? ": " + detail : ""}` };
    }

    const json = (await res.json()) as { results?: GukResult[] };
    const addresses = (json.results ?? []).map((r) => {
      if (r.summaryLine) return r.summaryLine;
      return [r.organisation, r.addressLine1, r.addressLine2, r.town, r.postcode]
        .map((p) => (p ?? "").trim())
        .filter(Boolean)
        .join(", ");
    });
    return { addresses };
  } catch {
    return { error: "Address lookup service unavailable." };
  }
}
