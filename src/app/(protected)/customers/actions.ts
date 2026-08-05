"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerInsertSchema, customerUpdateSchema } from "@/lib/schemas/customers";
import { logAuditEntry } from "@/lib/audit";

export async function createCustomer(values: unknown): Promise<{ error: string } | void> {
  const parsed = customerInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.from("customers").insert({
    ...parsed.data,
    created_by_id: user.id,
  }).select("id").single();
  if (error) return { error: error.message };
  await logAuditEntry(supabase, { action: "create", entityType: "Customer", entityId: data?.id ?? null, entityName: parsed.data.name ?? null });

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = customerUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  await logAuditEntry(supabase, { action: "update", entityType: "Customer", entityId: id, entityName: parsed.data.name ?? null, changedFields: Object.keys(parsed.data) });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAuditEntry(supabase, { action: "delete", entityType: "Customer", entityId: id });

  revalidatePath("/customers");
  redirect("/customers");
}
// GDPR data export — gather everything the CRM holds about a customer.
export async function exportCustomerData(
  id: string,
): Promise<{ json: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!customer) return { error: "Customer not found" };

  const email = customer.email ?? "__none__";
  const [quotes, jobs, invoices, leads, messages] = await Promise.all([
    supabase.from("quotes").select("*").eq("customer_id", id),
    supabase.from("jobs").select("*").eq("customer_id", id),
    supabase.from("invoices").select("*").eq("customer_id", id),
    supabase.from("leads").select("*").eq("email", email),
    supabase.from("messages").select("*").eq("customer_email", email),
  ]);

  const bundle = {
    exported_at: new Date().toISOString(),
    exported_by: user.email,
    customer,
    quotes: quotes.data ?? [],
    jobs: jobs.data ?? [],
    invoices: invoices.data ?? [],
    leads: leads.data ?? [],
    messages: messages.data ?? [],
  };
  return { json: JSON.stringify(bundle, null, 2) };
}
