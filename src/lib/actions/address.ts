"use server";

// UK address lookup via getAddress.io (getukaddress). Keeps the API key server-side.
// Add GETADDRESS_API_KEY in your environment (Vercel → Settings → Environment Variables).

export type AddressLookupResult =
  | { addresses: string[] }
  | { error: string };

export async function lookupAddresses(postcode: string): Promise<AddressLookupResult> {
  const key = process.env.GETADDRESS_API_KEY;
  if (!key) return { error: "Address lookup isn't configured (missing GETADDRESS_API_KEY)." };

  // getAddress expects a full postcode, uppercase, no spaces (e.g. SW1A1AA).
  const clean = postcode.trim().replace(/\s+/g, "").toUpperCase();
  if (!clean) return { error: "Enter a postcode" };
  // A full UK postcode is 5–7 chars; an outcode alone (e.g. SW1A) won't return addresses.
  if (clean.length < 5) return { error: "Enter a full postcode (e.g. SW1A 1AA)" };

  try {
    const res = await fetch(
      `https://api.getaddress.io/find/${encodeURIComponent(clean)}?api-key=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      // Surface getAddress's own message so we can see the real reason.
      let detail = "";
      try {
        const body = (await res.json()) as { Message?: string; message?: string };
        detail = body.Message || body.message || "";
      } catch {
        detail = (await res.text().catch(() => "")).slice(0, 120);
      }
      if (res.status === 401 || res.status === 403)
        return { error: `Key rejected (${res.status}): ${detail || "check the API key is correct and your email is verified"}` };
      if (res.status === 429) return { error: "getAddress.io lookup limit reached for now." };
      if (res.status === 404) return { error: `getAddress 404: ${detail || "postcode not found / account not active"}` };
      return { error: `getAddress ${res.status}: ${detail || "lookup failed"}` };
    }

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
