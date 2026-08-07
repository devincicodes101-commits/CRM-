import type { SupabaseClient } from "@supabase/supabase-js";

// Licenced-job routing: a job requires a licence when ANY of the services on the
// quote it was booked from is classified 'licenced' (e.g. AIB, garage ceilings).
// Mirrors Base44 publicBookJob's requires_licence derivation, adapted to our
// schema (services.licence_type instead of Service.licence_type='licenced_work').
export async function deriveRequiresLicence(
  supabase: SupabaseClient,
  items: { service_id?: string | null }[] | null | undefined,
): Promise<boolean> {
  const ids = (items ?? [])
    .map((i) => i?.service_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (ids.length === 0) return false;

  const { data } = await supabase
    .from("services")
    .select("licence_type")
    .in("id", ids)
    .eq("licence_type", "licenced")
    .limit(1);

  return (data?.length ?? 0) > 0;
}
