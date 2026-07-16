"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCommissionInvoice(formData: {
  agentId: string;
  agentName: string;
  commissionRate: number;
  periodStart: string;
  periodEnd: string;
}): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!me || me.role !== "admin") return { error: "Admin only" };

  // Fetch accepted quotes for the agent in the period
  const { data: quotes, error: qErr } = await supabase
    .from("quotes")
    .select("id, total")
    .eq("sales_agent_id", formData.agentId)
    .eq("status", "accepted")
    .gte("created_date", formData.periodStart)
    .lte("created_date", formData.periodEnd);

  if (qErr) return { error: qErr.message };

  const totalQuoteValue = (quotes ?? []).reduce(
    (s, q) => s + Number(q.total ?? 0),
    0
  );
  const commissionAmount = totalQuoteValue * (formData.commissionRate / 100);
  const vatAmount = commissionAmount * 0.2;
  const totalDue = commissionAmount + vatAmount;

  // Generate invoice number
  const invoiceNumber = `CINV-${Date.now()}`;

  const service = await createServiceClient();
  const { error: insertErr } = await service.from("commission_invoices").insert({
    invoice_number: invoiceNumber,
    sales_agent_id: formData.agentId,
    sales_agent_name: formData.agentName,
    period_start: formData.periodStart.split("T")[0],
    period_end: formData.periodEnd.split("T")[0],
    quote_ids: (quotes ?? []).map((q) => q.id),
    total_quotes: (quotes ?? []).length,
    total_quote_value: totalQuoteValue,
    commission_rate: formData.commissionRate,
    commission_amount: commissionAmount,
    vat_amount: vatAmount,
    total_due: totalDue,
    status: "draft",
    created_by_id: user.id,
  });

  if (insertErr) return { error: insertErr.message };

  redirect("/commission-invoices");
}
