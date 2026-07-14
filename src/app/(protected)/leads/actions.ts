"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadInsertSchema, leadUpdateSchema } from "@/lib/schemas/leads";
import { onLeadCreated } from "@/lib/automations/triggers";

export async function createLead(values: unknown): Promise<{ error: string } | void> {
  const parsed = leadInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  onLeadCreated({ ...parsed.data, id: data.id });

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLead(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = leadUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function updateLeadStatus(
  id: string,
  status: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function convertLeadToCustomer(leadId: string): Promise<{ error: string; customerId?: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) return { error: leadError?.message ?? "Lead not found" };

  const { data: customer, error: custError } = await supabase
    .from("customers")
    .insert({
      name: lead.name,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      address: lead.address ?? null,
      notes: lead.notes ?? null,
      status: "active",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (custError) return { error: custError.message };

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "won", converted_to_customer_id: customer.id })
    .eq("id", leadId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/leads");
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function deleteLead(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  redirect("/leads");
}