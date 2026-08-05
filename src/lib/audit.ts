import type { SupabaseClient } from "@supabase/supabase-js";

// §3 — write an audit-log entry for a create/update/delete on a core entity.
// Best-effort: never throws, so it can't break the mutation it records.
export async function logAuditEntry(
  supabase: SupabaseClient,
  entry: {
    action: "create" | "update" | "delete";
    entityType: "Quote" | "Job" | "Invoice" | "Lead" | "Customer";
    entityId?: string | null;
    entityName?: string | null;
    details?: string | null;
    changedFields?: string[];
  },
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let userName: string | null = null;
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle<{ full_name: string | null }>();
      userName = data?.full_name ?? null;
    }
    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      user_name: userName,
      user_email: user?.email ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      entity_name: entry.entityName ?? null,
      details: entry.details ?? null,
      changed_fields: entry.changedFields ?? [],
      created_by_id: user?.id ?? null,
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
