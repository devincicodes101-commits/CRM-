import { createClient } from "@/lib/supabase/server";
import { HighValueCommercialClient } from "./hvc-client";

export const dynamic = "force-dynamic";

export default async function HighValueCommercialPage() {
  const supabase = await createClient();
  // Fetch commercial quotes (newest first); the £3,000 threshold + filters are
  // applied client-side, exactly like the Base44 page.
  const { data } = await supabase
    .from("quotes")
    .select("*")
    .eq("client_type", "commercial")
    .order("created_date", { ascending: false })
    .limit(500);

  return <HighValueCommercialClient quotes={data ?? []} />;
}
