"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoiceInsertSchema, invoiceUpdateSchema } from "@/lib/schemas/invoices";

export async function createInvoice(values: unknown): Promise<{ error: string } | void> {
  const parsed = invoiceInsertSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...parsed.data, created_by_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}`);
}

export async function updateInvoice(id: string, values: unknown): Promise<{ error: string } | void> {
  const parsed = invoiceUpdateSchema.safeParse(values);
  if (!parsed.success) return { error: "Invalid form data" };

  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function createInvoiceFromJob(jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobError || !job) return { error: jobError?.message ?? "Job not found" };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      customer_id: job.customer_id ?? null,
      customer_name: job.customer_name ?? "Unknown",
      customer_email: job.customer_email ?? null,
      customer_address: job.address ?? null,
      items: job.total_value > 0
        ? [{ service_name: job.title, quantity: 1, unit_price: job.total_value, total: job.total_value }]
        : [],
      subtotal: job.total_value ?? 0,
      vat_rate: 20,
      vat_amount: (job.total_value ?? 0) * 0.2,
      total: (job.total_value ?? 0) * 1.2,
      status: "draft",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}/edit`);
}

export async function sendInvoice(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "sent", sent_date: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function recordPayment(
  id: string,
  amount: number,
  method: "bank_transfer" | "credit_card" | "direct_debit",
  total: number
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const isPaid = amount >= total;
  const { error } = await supabase
    .from("invoices")
    .update({
      amount_paid: amount,
      payment_method: method,
      status: isPaid ? "paid" : "part_paid",
      paid_date: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function markOverdue(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function deleteInvoice(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  redirect("/invoices");
}
