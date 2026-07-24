"use server";

// UK address lookup via getAddress.io (getukaddress). Keeps the API key server-side.
// Add GETADDRESS_API_KEY in your environment (Vercel → Settings → Environment Variables).

export type AddressLookupResult =
  | { addresses: string[] }
  | { error: string };

export async function lookupAddresses(postcode: string): Promise<AddressLookupResult> {
  const key = process.env.GETADDRESS_API_KEY;
  if (!key) return { error: "Address lookup isn't configured (missing GETADDRESS_API_KEY)." };

  const clean = postcode.trim().replace(/\s+/g, "");
  if (!clean) return { error: "Enter a postcode" };

  try {
    const res = await fetch(
      `https://api.getaddress.io/find/${encodeURIComponent(clean)}?api-key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (res.status === 404) return { addresses: [] };
    if (res.status === 401) return { error: "Invalid getAddress.io API key." };
    if (!res.ok) return { error: `Lookup failed (${res.status})` };

    const json = (await res.json()) as { addresses?: string[]; postcode?: string };
    const pc = (json.postcode ?? postcode).toUpperCase();
    // getAddress returns comma strings with empty segments — tidy them and append the postcode.
    const addresses = (json.addresses ?? []).map((a) => {
      const parts = a.split(",").map((p) => p.trim()).filter(Boolean);
      return `${parts.join(", ")}, ${pc}`;
    });
    return { addresses };
  } catch {
    return { error: "Address lookup service unavailable." };
  }
}
